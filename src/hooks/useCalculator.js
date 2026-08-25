import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { safeEvaluate, formatResult } from '../engine/evaluate.js'

/**
 * Calculator state machine.
 *
 * The expression lives as a plain glyph string (digits, + - × ÷ ^ % ! ( ) π e √,
 * function names). The engine parses it on demand — live for the preview line,
 * definitively on "=".
 */

const OPERATORS = '+-×÷^'
const HISTORY_KEY = 'scicalc.history.v1'
const ANGLE_KEY = 'scicalc.angleMode.v1'

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const lastChar = (s) => s.slice(-1)
const isOperator = (ch) => OPERATORS.includes(ch)

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
  // "2+3" -> "2+(-3)" — always grammatically valid
  return `${prefix}(-${num})`
}

/** Number currently being typed, used for the decimal-point guard. */
function trailingNumber(expr) {
  const m = expr.match(/(\d+\.?\d*(?:e[+-]?\d+)?)$/i)
  return m ? m[0] : ''
}

export function useCalculator() {
  const [input, setInput] = useState('')
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [lastResult, setLastResult] = useState(null) // numeric
  const [displayResult, setDisplayResult] = useState(null) // formatted string
  const [error, setError] = useState(null)
  const preEvalRef = useRef('')

  const [angleMode, setAngleMode] = useState(() => load(ANGLE_KEY, 'deg'))
  const [history, setHistory] = useState(() => load(HISTORY_KEY, []))

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem(ANGLE_KEY, JSON.stringify(angleMode))
  }, [angleMode])

  /** Live preview of the current expression (silent while incomplete). */
  const preview = useMemo(
    () => (input && !justEvaluated && !error ? safeEvaluate(input, { angleMode }) : null),
    [input, justEvaluated, error, angleMode],
  )

  /** Continue-from-result keys keep the chain alive after "=" (e.g. 9 = % ). */
  const baseForContinuation = () => formatResult(lastResult ?? 0)

  const insert = useCallback((text, { continuesResult = false } = {}) => {
    setError(null)
    setInput((prev) => {
      let base = prev
      if (justEvaluated) {
        base = continuesResult ? baseForContinuation() : ''
      }
      return base + text
    })
    setJustEvaluated(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justEvaluated, lastResult])

  const pressDigit = useCallback((d) => insert(d), [insert])

  const pressDot = useCallback(() => {
    setError(null)
    setInput((prev) => {
      const base = justEvaluated ? '' : prev
      const current = trailingNumber(base)
      if (current.includes('.')) return prev // only one dot per number
      return base + (current === '' ? '0.' : '.')
    })
    setJustEvaluated(false)
  }, [justEvaluated])

  const pressOperator = useCallback((op) => {
    setError(null)
    setInput((prev) => {
      let base = prev
      if (justEvaluated) base = baseForContinuation()
      if (base === '') return op === '-' ? '-' : prev // lone minus is unary
      const prevCh = lastChar(base)
      if (isOperator(prevCh)) {
        // "×-" unary pair is legal; otherwise replace the dangling operator
        if (!(op === '-' && '×÷^'.includes(prevCh))) {
          return base.slice(0, -1) + op
        }
      }
      return base + op
    })
    setJustEvaluated(false)
  }, [justEvaluated, lastResult])

  const pressEquals = useCallback(() => {
    if (!input.trim()) return
    const res = safeEvaluate(input, { angleMode })
    if (res.ok) {
      preEvalRef.current = input
      const formatted = formatResult(res.value)
      setLastResult(res.value)
      setDisplayResult(formatted)
      setJustEvaluated(true)
      setError(null)
      setHistory((h) =>
        [{ expr: input, result: formatted, ts: Date.now() }, ...h].slice(0, 50),
      )
    } else {
      setError(res.error)
    }
  }, [input, angleMode])

  const pressClear = useCallback(() => {
    setInput('')
    setJustEvaluated(false)
    setLastResult(null)
    setDisplayResult(null)
    setError(null)
  }, [])

  const pressBackspace = useCallback(() => {
    setError(null)
    if (justEvaluated) {
      // restore the pre-eval expression for editing
      setInput(preEvalRef.current)
      setJustEvaluated(false)
      setLastResult(null)
      setDisplayResult(null)
      return
    }
    setInput((prev) => backspaceToken(prev))
  }, [justEvaluated])

  const pressSign = useCallback(() => {
    setError(null)
    if (justEvaluated) {
      if (lastResult !== null) {
        const negated = -lastResult
        setLastResult(negated)
        setDisplayResult(formatResult(negated))
      }
      return
    }
    setInput((prev) => negateTrailingNumber(prev) ?? prev)
  }, [justEvaluated, lastResult])

  /** Function keys append "name(" — √ is prefix without parens. */
  const pressFunction = useCallback(
    (name) => (name === 'sqrt' ? insert('√') : insert(`${name}(`)),
    [insert],
  )

  const clearHistory = useCallback(() => setHistory([]), [])

  const restoreFromHistory = useCallback((expr) => {
    setInput(expr)
    setJustEvaluated(false)
    setDisplayResult(null)
    setLastResult(null)
    setError(null)
  }, [])

  return {
    // state
    input,
    displayResult,
    error,
    preview,
    justEvaluated,
    angleMode,
    history,
    // actions
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
    clearHistory,
    restoreFromHistory,
  }
}
