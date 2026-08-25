/**
 * Evaluator + public API.
 *
 *   evaluate(exprString, { angleMode }) -> number   (throws CalcError)
 *   safeEvaluate(exprString, opts)     -> { ok, value | error }
 *   formatResult(number)               -> display string
 *
 * Percent behaves like modern phone calculators:
 *   200 + 10%  -> 220        (10% of 200 added)
 *   200 − 10%  -> 180
 *   200 × 10%  -> 20         (plain 0.1 multiplier)
 *   50%        -> 0.5        (standalone)
 */

import { tokenize, CalcError } from './tokenizer.js'
import { parse } from './parser.js'

export { CalcError }

const DEG = Math.PI / 180
const FACTORIAL_MAX = 170 // beyond this -> Infinity

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw new CalcError('Factorial needs a whole number ≥ 0')
  if (n > FACTORIAL_MAX) throw new CalcError('Result too large')
  let acc = 1
  for (let k = 2; k <= n; k++) acc *= k
  return acc
}

function makeTrig(angleMode) {
  const toRad = (x) => (angleMode === 'deg' ? x * DEG : x)
  const fromRad = (x) => (angleMode === 'deg' ? x / DEG : x)
  return {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => {
      const r = toRad(x)
      // guard tan(90°) style poles within float noise
      if (Math.abs(Math.cos(r)) < 1e-15) throw new CalcError('Undefined (tan pole)')
      return Math.tan(r)
    },
    asin: (x) => {
      if (x < -1 || x > 1) throw new CalcError('Out of domain (−1…1)')
      return fromRad(Math.asin(x))
    },
    acos: (x) => {
      if (x < -1 || x > 1) throw new CalcError('Out of domain (−1…1)')
      return fromRad(Math.acos(x))
    },
    atan: (x) => fromRad(Math.atan(x)),
  }
}

/** Non-trig functions that don't exist under their calculator names on Math. */
const PLAIN_FUNCS = {
  ln: Math.log,
  log: Math.log10,
  sqrt: Math.sqrt,
}

function evalNode(node, ctx) {
  switch (node.type) {
    case 'num':
      return node.value

    case 'const':
      return node.name === 'π' ? Math.PI : Math.E

    case 'group':
      return evalNode(node.expr, ctx)

    case 'negate':
      return -evalNode(node.arg, ctx)

    case 'power': {
      const base = evalNode(node.base, ctx)
      const exp = evalNode(node.exponent, ctx)
      const out = Math.pow(base, exp)
      if (Number.isNaN(out)) throw new CalcError('Out of domain')
      return out
    }

    case 'factorial':
      return factorial(evalNode(node.arg, ctx))

    case 'call': {
      const arg = evalNode(node.arg, ctx)
      const fn = ctx.trig[node.name] ?? PLAIN_FUNCS[node.name]
      if (typeof fn !== 'function') throw new CalcError(`Unknown function ${node.name}`)
      const out = fn(arg)
      if (Number.isNaN(out)) throw new CalcError('Out of domain')
      return Object.is(out, -0) ? 0 : out
    }

    case 'percent': {
      // resolved by parent binary op; standalone falls back to /100
      return evalNode(node.operand, ctx) / 100
    }

    case 'binary': {
      const { op, left, right } = node

      // contextual percent handling
      if ((op === '+' || op === '-') && right.type === 'percent') {
        const base = evalNode(left, ctx)
        const pct = evalNode(right.operand, ctx)
        return op === '+' ? base + (base * pct) / 100 : base - (base * pct) / 100
      }

      const a = evalNode(left, ctx)
      const b = evalNode(right, ctx)

      switch (op) {
        case '+': return a + b
        case '-': return a - b
        case '×': return a * b
        case '÷':
          if (b === 0) throw new CalcError("Can't divide by zero")
          return a / b
        default:
          throw new CalcError(`Unknown operator ${op}`)
      }
    }

    default:
      throw new CalcError('Invalid expression')
  }
}

/** Evaluate an expression string to a number. Throws CalcError. */
export function evaluate(expression, { angleMode = 'rad' } = {}) {
  if (!expression || !expression.trim()) throw new CalcError('Nothing to calculate')
  const ast = parse(tokenize(expression))
  const value = evalNode(ast, { trig: makeTrig(angleMode) })
  if (!Number.isFinite(value)) {
    throw new CalcError(Number.isNaN(value) ? 'Undefined result' : 'Result too large')
  }
  return Object.is(value, -0) ? 0 : value
}

/** Non-throwing wrapper used for the live preview. */
export function safeEvaluate(expression, options) {
  try {
    return { ok: true, value: evaluate(expression, options) }
  } catch (err) {
    return { ok: false, error: err instanceof CalcError ? err.message : 'Invalid expression' }
  }
}

/** Human-friendly display formatting (up to 12 significant digits). */
export function formatResult(value) {
  const abs = Math.abs(value)
  if (value === 0) return '0'
  if (abs >= 1e12 || abs < 1e-9) {
    return value.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e')
  }
  return String(parseFloat(value.toPrecision(12)))
}
