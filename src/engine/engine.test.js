/**
 * Engine test suite — zero dependencies, run with:  npm test
 */
import { evaluate, safeEvaluate, formatResult, CalcError } from './evaluate.js'

let passed = 0
let failed = 0

function check(name, fn) {
  try {
    const result = fn()
    if (result === true) {
      passed++
    } else {
      failed++
      console.error(`✗ ${name}\n   expected true, got ${result}`)
    }
  } catch (err) {
    failed++
    console.error(`✗ ${name}\n   threw ${err.message}`)
  }
}

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b))
const ev = (expr, opts = { angleMode: 'deg' }) => evaluate(expr, opts)

// ---------- arithmetic ----------
check('addition', () => approx(ev('2+3'), 5))
check('precedence ×  before +', () => approx(ev('2+3×4'), 14))
check('parentheses override', () => approx(ev('(2+3)×4'), 20))
check('nested parentheses', () => approx(ev('((1+2)×(3+4))'), 21))
check('division', () => approx(ev('10÷4'), 2.5))
check('unary minus', () => approx(ev('-5+3'), -2))
check('unary minus after operator', () => approx(ev('6×-3'), -18))
check('double unary', () => approx(ev('--5'), 5))

// ---------- power / postfix ----------
check('power left of × ', () => approx(ev('2^3'), 8))
check('power right-assoc 2^3^2=512', () => approx(ev('2^3^2'), 512))
check('negative exponent', () => approx(ev('2^-3'), 0.125))
check('-2^2 = -(2^2)', () => approx(ev('-2^2'), -4))
check('x² via ^2', () => approx(ev('7^2'), 49))
check('factorial', () => approx(ev('5!'), 120))
check('factorial zero', () => approx(ev('0!'), 1))
check('factorial inside expression', () => approx(ev('3!+4!'), 30))
check('percent standalone 50% = 0.5', () => approx(ev('50%'), 0.5))
check('percent additive 200+10%', () => approx(ev('200+10%'), 220))
check('percent subtractive 200-10%', () => approx(ev('200−10%') ?? ev('200-10%'), 180))

// ---------- implicit multiplication ----------
check('implicit 2π', () => approx(ev('2π'), 2 * Math.PI, 1e-12))
check('implicit 2(3+4)', () => approx(ev('2(3+4)'), 14))
check('implicit (1+2)(3+4)', () => approx(ev('(1+2)(3+4)'), 21))
check('implicit π(2+1)', () => approx(ev('π(2+1)'), Math.PI * 3, 1e-12))

// ---------- functions ----------
check('sin 30° = 0.5', () => approx(ev('sin(30)'), 0.5))
check('cos 60° = 0.5', () => approx(ev('cos(60)'), 0.5))
check('tan 45° = 1', () => approx(ev('tan(45)'), 1))
check('radians sin(π/2)=1', () => approx(evaluate('sin(π÷2)', { angleMode: 'rad' }), 1))
check('asin(0.5) deg = 30', () => approx(ev('asin(0.5)'), 30))
check('ln(e)=1', () => approx(ev('ln(e)'), 1))
check('log(1000)=3', () => approx(ev('log(1000)'), 3))
check('√81 = 9', () => approx(ev('√81'), 9))
check('√ binds tight: √9+1=4', () => approx(ev('√9+1'), 4))
check('√ with parens √(16+9)=5', () => approx(ev('√(16+9)'), 5))
check('func chain 2sin(30)', () => approx(ev('2sin(30)'), 1))

// ---------- scientific notation parsing ----------
check('parse 1.5e3', () => approx(ev('1.5e3'), 1500))
check('parse 2e-2', () => approx(ev('2e-2'), 0.02))

// ---------- formatting ----------
check('format strips float noise', () => formatResult(0.1 + 0.2) === '0.3')
check('format integer', () => formatResult(42) === '42')
check('format exponential large', () => formatResult(5e15).includes('e'))
check('format tiny -> exponential', () => formatResult(0.0000000001234).includes('e'))
check('format zero', () => formatResult(0) === '0')

// ---------- errors ----------
const throwsWith = (expr, msgPart) => {
  try {
    ev(expr)
    return false
  } catch (err) {
    return err instanceof CalcError && err.message.toLowerCase().includes(msgPart.toLowerCase())
  }
}
check("error: divide by zero", () => throwsWith('5÷0', 'divide'))
check('error: unbalanced )', () => throwsWith('(2+3', 'missing'))
check('error: trailing operator', () => throwsWith('5+', 'incomplete'))
check('error: factorial negative', () => throwsWith('(-5)!', 'whole'))
check('error: asin domain', () => throwsWith('asin(2)', 'domain'))
check('error: tan pole', () => throwsWith('tan(90)', 'undefined'))

// ---------- safeEvaluate shape ----------
check('safe ok', () => safeEvaluate('1+1').ok === true && safeEvaluate('1+1').value === 2)
check('safe error message', () => safeEvaluate('9÷0').ok === false &&
  typeof safeEvaluate('9÷0').error === 'string')

// empty input
check('empty input error', () => safeEvaluate('').ok === false)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
