import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Read/write a single localStorage key as JSON. Falls back gracefully if
 * localStorage is unavailable (private mode, sandbox).
 *
 * Returns [value, setValue]. The setter mirrors to localStorage immediately
 * and triggers a re-render. SSR-safe: the initializer defers all reads to
 * the first client render via lazy `useState`.
 */
export function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => readKey(key, fallback))
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {
      /* quota exceeded / private mode — non-fatal */
    }
  }, [value])

  const reset = useCallback(() => setValue(fallback), [fallback])
  return [value, setValue, reset]
}

function readKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}
