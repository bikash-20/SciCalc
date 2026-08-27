import { useCallback, useEffect, useRef, useState } from 'react'
import { safeEvaluate, formatResult } from '../engine/evaluate.js'
import { useLocalStorageState } from './useLocalStorageState.js'

const ANGLE_KEY = 'scicalc.angleMode.v1'

const lastChar = (s) => s.slice(-1)
const isOperator = (ch) => '+-×÷^'.includes(ch)

/** Strip one logical token from the end ("asin(", "sin(", "√", digits…). */
function backspaceToken(expr) {
  const fnMatch = expr.match(/(a?(?:sin|cos|tan)|log|ln)\($/i)
  if (fnMatch) return expr.slice(0, -fnMatch[0].length)
  if (expr.endsWith('√')) return expr.slice(0, -1)
  return expr.slice(0, -1)
}

/** Toggle the sign of the trailing number using unambiguous grammar. */
function negateTrailingNumber(expr) {
  const m = expr.match(/(\d+\.?\d*(?:e[+-]?\d+)?)$/i)
  if (!m) return null
  const num = m[0]
  const prefix = expr.slice(0, expr.length - num.length)

  // "-3" -> "3"  (only when the minus is unary)
  if (prefix.endsWith('-')) {
    const before = prefix.slice(0, -1)
    if (before === '' || isOperator(lastChar(before)) || lastChar(before) === '(') {
      return before + num
    }
  }
  if (prefix === '') return '-' + num
  return `${prefix}(-${num})`
}

/** Number currently being typed, used for the decimal-point guard. */
function trailingNumber(expr) {
  const m = expr.match(/(\d+\.?\d*(?:e[+-]?\d+)?)$/i)
  return m ? m[0] : ''
}

/**
 * The expression state machine. Owns: input, error, justEvaluated, lastResult,
 * displayResult, angleMode, and a debounced live `preview`.
 *
 * Returns state + stable action callbacks. All callbacks use setState updaters
 * so their identity stays stable across renders that don't change their deps.
 */
export function useExpression() {
  const [input, setInput] = useState('')
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [displayResult, setDisplayResult] = useState(null)
  const [error, setError] = useState(null)
  const preEvalRef = useRef('')

  const [angleMode, setAngleMode] = useLocalStorageState(ANGLE_KEY, 'deg')

  // Debounced live preview. Tokenize + parse + eval is microseconds but we
  // still coalesce a burst of keystrokes so the Display doesn't repaint
  // mid-press.
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    if (!input || justEvaluated || error) {
      setPreview(null)
      return undefined
    }
    const id = setTimeout(() => {
      setPreview(safeEvaluate(input, { angleMode }))
    }, 120)
    return () => clearTimeout(id)
  }, [input, justEvaluated, error, angleMode])

  const clearError = useCallback(() => setError(null), [])

  const baseForContinuation = useCallback(
    () => formatResult(lastResult ?? 0),
    [lastResult],
  )

  const insert = useCallback(
    (text, { continuesResult = false } = {}) => {
      clearError()
      setInput((prev) => {
        const base = justEvaluated ? (continuesResult ? baseForContinuation() : '') : prev
        return base + text
      })
      setJustEvaluated(false)
    },
    [clearError, justEvaluated, baseForContinuation],
  )

  const pressDigit = useCallback((d) => insert(d), [insert])

  const pressDot = useCallback(() => {
    clearError()
    setInput((prev) => {
      const base = justEvaluated ? '' : prev
      if (trailingNumber(base).includes('.')) return prev // only one dot per number
      return base + (base === '' || isOperator(lastChar(base)) || lastChar(base) === '(' ? '0.' : '.')
    })
    setJustEvaluated(false)
  }, [clearError, justEvaluated])

  const pressOperator = useCallback(
    (op) => {
      clearError()
      setInput((prev) => {
        let base = justEvaluated ? baseForContinuation() : prev
        if (base === '') return op === '-' ? '-' : prev // lone minus is unary
        const prevCh = lastChar(base)
        // "×-" unary pair is legal; otherwise replace the dangling operator
        if (isOperator(prevCh) && !(op === '-' && '×÷^'.includes(prevCh))) {
          return base.slice(0, -1) + op
        }
        return base + op
      })
      setJustEvaluated(false)
    },
    [clearError, justEvaluated, baseForContinuation],
  )

  const pressEquals = useCallback(
    (onCommit) => {
      if (!input.trim()) return
      const res = safeEvaluate(input, { angleMode })
      if (res.ok) {
        const formatted = formatResult(res.value)
        preEvalRef.current = input
        setLastResult(res.value)
        setDisplayResult(formatted)
        setJustEvaluated(true)
        setError(null)
        onCommit?.({ expr: input, result: formatted })
      } else {
        setError(res.error)
      }
    },
    [input, angleMode],
  )

  const pressClear = useCallback(() => {
    setInput('')
    setJustEvaluated(false)
    setLastResult(null)
    setDisplayResult(null)
    setError(null)
  }, [])

  const pressBackspace = useCallback(() => {
    clearError()
    if (justEvaluated) {
      setInput(preEvalRef.current)
      setJustEvaluated(false)
      setLastResult(null)
      setDisplayResult(null)
      return
    }
    setInput((prev) => backspaceToken(prev))
  }, [clearError, justEvaluated])

  const pressSign = useCallback(() => {
    clearError()
    if (justEvaluated) {
      if (lastResult !== null) {
        const negated = -lastResult
        setLastResult(negated)
        setDisplayResult(formatResult(negated))
      }
      return
    }
    setInput((prev) => negateTrailingNumber(prev) ?? prev)
  }, [clearError, justEvaluated, lastResult])

  const pressFunction = useCallback(
    (name) => insert(name === 'sqrt' ? '√' : `${name}(`),
    [insert],
  )

  const restoreFromHistory = useCallback((expr) => {
    setInput(expr)
    setJustEvaluated(false)
    setDisplayResult(null)
    setLastResult(null)
    setError(null)
  }, [])

  return {
    state: { input, displayResult, error, preview, justEvaluated, angleMode },
    actions: {
      pressDigit,
      pressDot,
      pressOperator,
      pressEquals,
      pressClear,
      pressBackspace,
      pressSign,
      pressFunction,
      insert,
      setAngleMode,
      restoreFromHistory,
    },
  }
}
