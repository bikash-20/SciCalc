/**
 * Recursive-descent parser: token stream -> AST.
 *
 * Grammar (highest binding last):
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('×' | '÷') unary | <implicit> unary)*
 *   unary      := ('+' | '-') unary | power
 *   power      := postfix ('^' unary)?            // right-associative
 *   postfix    := atom ('!' | '%')*
 *   atom       := number | constant
 *               | func '(' expression ')'         // sin( ... )
 *               | func power                      // √9 style, binds tight
 *               | '(' expression ')'
 */

import { CalcError } from './tokenizer.js'

const IMPLICIT_START = new Set(['num', 'const', 'func', 'lparen'])

export function parse(tokens) {
  let pos = 0

  const peek = () => tokens[pos]
  const next = () => tokens[pos++]

  const expect = (predicate, message) => {
    const tok = next()
    if (!tok || !predicate(tok)) throw new CalcError(message)
    return tok
  }

  function parseExpression() {
    let node = parseTerm()
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = next().value
      node = { type: 'binary', op, left: node, right: parseTerm() }
    }
    return node
  }

  function startsOperand(tok) {
    return tok && (tok.type === 'num' || tok.type === 'const' ||
      tok.type === 'func' || tok.type === 'lparen')
  }

  function parseTerm() {
    let node = parseUnary()
    for (;;) {
      const tok = peek()
      if (tok?.type === 'op' && (tok.value === '×' || tok.value === '÷')) {
        const op = next().value
        node = { type: 'binary', op, left: node, right: parseUnary() }
      } else if (IMPLICIT_START.has(tok?.type)) {
        // implicit multiplication: 2π, 3(4+1), (1+2)(3)
        node = { type: 'binary', op: '×', left: node, right: parseUnary() }
      } else {
        break
      }
    }
    return node
  }

  function parseUnary() {
    const tok = peek()
    if (tok?.type === 'op' && (tok.value === '-' || tok.value === '+')) {
      next()
      const arg = parseUnary()
      return tok.value === '-' ? { type: 'negate', arg } : arg
    }
    return parsePower()
  }

  function parsePower() {
    const base = parsePostfix()
    if (peek()?.type === 'op' && peek().value === '^') {
      next()
      const exponent = parseUnary() // right-assoc, allows 2^-3
      return { type: 'power', base, exponent }
    }
    return base
  }

  function parsePostfix() {
    let node = parseAtom()
    while (peek()?.type === 'postfix') {
      const { value } = next()
      if (value === '!') node = { type: 'factorial', arg: node }
      if (value === '%') node = { type: 'percent', operand: node }
    }
    return node
  }

  function parseAtom() {
    const tok = next()
    if (!tok) throw new CalcError('Incomplete expression')

    if (tok.type === 'num') return { type: 'num', value: tok.value }
    if (tok.type === 'const') return { type: 'const', name: tok.name }

    if (tok.type === 'func') {
      if (peek()?.type === 'lparen') {
        next()
        const arg = parseExpression()
        expect((t) => t.type === 'rparen', 'Missing ")"')
        return { type: 'call', name: tok.name, arg }
      }
      // prefix form without parens (√9): bind tightly to the next power chain
      return { type: 'call', name: tok.name, arg: parsePower() }
    }

    if (tok.type === 'lparen') {
      const inner = parseExpression()
      expect((t) => t.type === 'rparen', 'Missing ")"')
      return { type: 'group', expr: inner }
    }

    if (tok.type === 'op') throw new CalcError('Missing value before operator')
    throw new CalcError('Invalid expression')
  }

  const ast = parseExpression()
  if (pos < tokens.length) {
    throw new CalcError(peek().type === 'rparen' ? 'Unexpected ")"' : 'Unexpected trailing input')
  }
  return ast
}
