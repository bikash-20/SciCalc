/**
 * Thin promise-based IndexedDB wrapper for durable local persistence.
 *
 * - `history` object store keyed by `ts` (the record's timestamp).
 * - Browser APIs are wrapped so this module NEVER throws in normal use —
 *   callers fall back to localStorage when IndexedDB is unavailable
 *   (private mode, sandboxed iframes, etc.).
 *
 * The calculator treats IndexedDB as the source of truth for history:
 * it has a far larger quota than localStorage and is transactional/durable.
 */

const DB_NAME = 'scicalc'
const DB_VERSION = 1
const HISTORY_STORE = 'history'

const idbSupported = typeof indexedDB !== 'undefined'

let dbPromise = null

function openDB() {
  if (!idbSupported) return Promise.reject(new Error('indexedDB unavailable'))
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    let req
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(err)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'ts' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('indexedDB blocked'))
  })

  // allow retry after a failure
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

/** Read all history records, newest first. Resolves [] on any failure. */
export function getAllHistory() {
  return new Promise((resolve) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(HISTORY_STORE, 'readonly')
        const req = tx.objectStore(HISTORY_STORE).getAll()
        req.onsuccess = () =>
          resolve(req.result.sort((a, b) => b.ts - a.ts))
        req.onerror = () => resolve([])
        tx.onerror = () => resolve([])
      })
      .catch(() => resolve([]))
  })
}

/** Replace history wholesale in one atomic transaction. Never rejects. */
export function putHistory(entries) {
  return new Promise((resolve) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(HISTORY_STORE, 'readwrite')
        const store = tx.objectStore(HISTORY_STORE)
        store.clear()
        for (const entry of entries) store.put(entry)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
        tx.onabort = () => resolve()
      })
      .catch(() => resolve())
  })
}

/** Remove all history records. Never rejects. */
export function clearHistory() {
  return new Promise((resolve) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(HISTORY_STORE, 'readwrite')
        tx.objectStore(HISTORY_STORE).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      })
      .catch(() => resolve())
  })
}