/**
 * Tokenizer — converts an expression string into a stream of tokens.
 *
 * Supported glyphs: digits . + - × ÷ ^ % ! ( ) π e √
 * Function names:   sin cos tan asin acos atan ln log
 *
 * Numbers may carry scientific notation (1.5e-7) so pasted/history
 * results can be re-parsed. A bare `e` is Euler's constant.
 */

export const FUNCTIONS = new Set([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'ln', 'log', 'sqrt',
])

export class CalcError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CalcError'
  }
}

const DIGIT = /[0-9]/

/** Convert expression string -> array of tokens. Throws CalcError on bad input. */
export function tokenize(input) {
  const src = String(input)
  const tokens = []
  let i = 0

  const pushNumber = () => {
    let raw = ''
    while (i < src.length && DIGIT.test(src[i])) raw += src[i++]
    // decimal portion
    if (src[i] === '.') {
      raw += src[i++]
      while (i < src.length && DIGIT.test(src[i])) raw += src[i++]
      if (raw.endsWith('.')) {
        // trailing dot like "5." -> treat as 5
        raw = raw.slice(0, -1)
        i--
      }
    }
    // scientific notation: only when `e` is glued to the number
    if (
      src[i] === 'e' &&
      (DIGIT.test(src[i + 1]) ||
        ((src[i + 1] === '+' || src[i + 1] === '-') && DIGIT.test(src[i + 2])))
    ) {
      raw += src[i++] // e
      if (src[i] === '+' || src[i] === '-') raw += src[i++]
      while (i < src.length && DIGIT.test(src[i])) raw += src[i++]
    }
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new CalcError('Invalid number')
    tokens.push({ type: 'num', value })
  }

  while (i < src.length) {
    const ch = src[i]

    if (ch === ' ') { i++; continue }

    if (DIGIT.test(ch) || ch === '.') { pushNumber(); continue }

    if (ch === '+') { tokens.push({ type: 'op', value: '+' }); i++; continue }
    if (ch === '-' || ch === '−' || ch === '–') { tokens.push({ type: 'op', value: '-' }); i++; continue }
    if (ch === '×' || ch === '*' || ch === '·') { tokens.push({ type: 'op', value: '×' }); i++; continue }
    if (ch === '÷' || ch === '/') { tokens.push({ type: 'op', value: '÷' }); i++; continue }
    if (ch === '^') { tokens.push({ type: 'op', value: '^' }); i++; continue }
    if (ch === '!') { tokens.push({ type: 'postfix', value: '!' }); i++; continue }
    if (ch === '%') { tokens.push({ type: 'postfix', value: '%' }); i++; continue }
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue }

    if (ch === 'π') { tokens.push({ type: 'const', name: 'π' }); i++; continue }
    if (ch === 'e') { tokens.push({ type: 'const', name: 'e' }); i++; continue }
    if (ch === '√') { tokens.push({ type: 'func', name: 'sqrt' }); i++; continue }

    if (/[a-zA-Z]/.test(ch)) {
      // longest-match function names
      const rest = src.slice(i).toLowerCase()
      const match = ['asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'log', 'ln']
        .find((name) => rest.startsWith(name))
      if (!match) throw new CalcError(`Unknown symbol "${src.slice(i, i + 4)}"`)
      tokens.push({ type: 'func', name: match === 'sqrt' ? 'sqrt' : match })
      i += match.length
      continue
    }

    throw new CalcError(`Unexpected character "${ch}"`)
  }

  return tokens
}
