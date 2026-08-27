import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllHistory, putHistory } from '../lib/db.js'
import { useLocalStorageState } from './useLocalStorageState.js'

export const HISTORY_MAX = 50
const HISTORY_KEY = 'scicalc.history.v1'
const PERSIST_DEBOUNCE_MS = 400

/**
 * History state with a 3-tier durability model:
 *   1. React state — the UI source of truth during a session.
 *   2. localStorage — instant mirror so reloads stay snappy.
 *   3. IndexedDB — durable, quota-friendly, written 400 ms after the last change.
 *
 * IndexedDB is the source of truth on first paint (it survives quota resets);
 * localStorage just covers the very first reload.
 */
export function useHistory() {
  const [history, setHistory] = useLocalStorageState(HISTORY_KEY, [])
  const hydratedRef = useRef(false)
  const timerRef = useRef(null)

  // Hydrate from IndexedDB once after mount, then allow writes.
  useEffect(() => {
    let alive = true
    getAllHistory().then((rows) => {
      if (!alive) return
      if (rows.length > 0) setHistory(rows)
      hydratedRef.current = true
    })
    return () => {
      alive = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // setHistory is stable across renders; intentionally no deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced IDB write — coalesces a burst of equals-presses into one
  // transaction. Skip until the hydration has settled so we don't clobber
  // the IndexedDB snapshot with the empty localStorage initial state.
  useEffect(() => {
    if (!hydratedRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      putHistory(history.slice(0, HISTORY_MAX))
    }, PERSIST_DEBOUNCE_MS)
  }, [history])

  const push = useCallback(
    (entry) => setHistory((h) => [entry, ...h].slice(0, HISTORY_MAX)),
    [setHistory],
  )

  const clear = useCallback(() => setHistory([]), [setHistory])

  return { history, push, clear }
}
