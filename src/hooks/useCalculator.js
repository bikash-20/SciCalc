import { useCallback, useMemo, useRef } from 'react'
import { useExpression } from './useExpression.js'
import { useHistory } from './useHistory.js'
import { useKeyboardShortcuts } from './useKeyboardShortcuts.js'

/**
 * Composes the calculator hook. Returns one object with two stable
 * sub-references so consumers can memo against just what they need:
 *   - `state`   — input / displayResult / error / preview / angleMode / history
 *   - `actions` — pressDigit, pressDot, pressOperator, pressEquals, …
 *
 * The keyboard listener is bound once per mount and reads the latest
 * actions through a ref, so it never re-attaches during typing.
 */
export function useCalculator({ onToggleHistory, onToggleAngle } = {}) {
  const { state, actions } = useExpression()
  const { history, push, clear } = useHistory()

  // Keep a stable callback ref so `actions.pressEquals` doesn't have to
  // close over `push` directly (which would invalidate its identity on
  // every render of useHistory).
  const onCommitRef = useRef(() => {})
  onCommitRef.current = useCallback(
    (entry) => push({ ...entry, ts: Date.now() }),
    [push],
  )

  // Wrap the upstream pressEquals so it also writes history. We replace the
  // upstream's no-op default with the ref-based commit.
  const pressEquals = useMemo(
    () => (...args) => actions.pressEquals((entry) => onCommitRef.current(entry)),
    [actions],
  )

  const bundled = useMemo(
    () => ({ ...actions, pressEquals, clearHistory: clear }),
    [actions, pressEquals, clear],
  )

  const actionsRef = useRef(bundled)
  actionsRef.current = bundled

  useKeyboardShortcuts(actionsRef, {
    toggleHistory: onToggleHistory,
    toggleAngle: onToggleAngle,
  })

  return useMemo(
    () => ({ state: { ...state, history }, actions: bundled }),
    [state, history, bundled],
  )
}
