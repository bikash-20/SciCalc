import { memo, useCallback, useMemo, useState } from 'react'
import Key from './Key.jsx'

/** What each science key becomes while "2nd" is active. */
const SECOND_MAP = {
  sin: { label: 'sin⁻¹', fnName: 'asin' },
  cos: { label: 'cos⁻¹', fnName: 'acos' },
  tan: { label: 'tan⁻¹', fnName: 'atan' },
  ln: { label: 'eˣ', insert: 'e^(' },
  log: { label: '10ˣ', insert: '10^(' },
}

const MemoKey = memo(Key)

/**
 * One stable handler per key. Each handler closes over the latest actions
 * via `actionsRef.current` (refreshed every render) so we always dispatch
 * the freshest actions without rebuilding closures on every keystroke.
 */
function useStableHandlers(actionsRef, angleModeRef) {
  return useMemo(() => ({
    '.':           () => actionsRef.current.pressDot(),
    'AC':          () => actionsRef.current.pressClear(),
    'backspace':   () => actionsRef.current.pressBackspace(),
    'sign':        () => actionsRef.current.pressSign(),
    'equals':      () => actionsRef.current.pressEquals(),
    'toggleAngle': () => {
      const mode = angleModeRef.current
      actionsRef.current.setAngleMode(mode === 'deg' ? 'rad' : 'deg')
    },
    'd0': () => actionsRef.current.pressDigit('0'),
    'd1': () => actionsRef.current.pressDigit('1'),
    'd2': () => actionsRef.current.pressDigit('2'),
    'd3': () => actionsRef.current.pressDigit('3'),
    'd4': () => actionsRef.current.pressDigit('4'),
    'd5': () => actionsRef.current.pressDigit('5'),
    'd6': () => actionsRef.current.pressDigit('6'),
    'd7': () => actionsRef.current.pressDigit('7'),
    'd8': () => actionsRef.current.pressDigit('8'),
    'd9': () => actionsRef.current.pressDigit('9'),
    'op+': () => actionsRef.current.pressOperator('+'),
    'op-': () => actionsRef.current.pressOperator('-'),
    'op*': () => actionsRef.current.pressOperator('×'),
    'op/': () => actionsRef.current.pressOperator('÷'),
    'pct':  () => actionsRef.current.insert('%'),
    'fact': () => actionsRef.current.insert('!'),
    'lparen': () => actionsRef.current.insert('('),
    'rparen': () => actionsRef.current.insert(')'),
    'pow':  () => actionsRef.current.insert('^'),
    'sqr':  () => actionsRef.current.insert('^2'),
    'sqrt': () => actionsRef.current.pressFunction('sqrt'),
    'pi':   () => actionsRef.current.insert('π'),
    'e':    () => actionsRef.current.insert('e'),
    'sin':  () => actionsRef.current.pressFunction('sin'),
    'cos':  () => actionsRef.current.pressFunction('cos'),
    'tan':  () => actionsRef.current.pressFunction('tan'),
    'ln':   () => actionsRef.current.pressFunction('ln'),
    'log':  () => actionsRef.current.pressFunction('log'),
    // 2nd-shift handlers (literal text inserts). Stable identities.
    'asin':  () => actionsRef.current.pressFunction('asin'),
    'acos':  () => actionsRef.current.pressFunction('acos'),
    'atan':  () => actionsRef.current.pressFunction('atan'),
    'ePow':  () => actionsRef.current.insert('e^('),
    '10Pow': () => actionsRef.current.insert('10^('),
  }), [actionsRef, angleModeRef])
}

/* ----- Per-key memoized renderers -------------------------------------
 * Each helper returns a `<MemoKey>` for a single id. Because we hand the
 * SAME `onPress` reference to the same id on every render, React.memo
 * bails out and the underlying DOM/key button is not re-painted.
 * ---------------------------------------------------------------------- */

const keyOf = (id, label, variant, ariaLabel, onPress, active = false) => (
  <MemoKey key={id} label={label} variant={variant} ariaLabel={ariaLabel} active={active} onPress={onPress} />
)

function DigitBtn({ id, label, handlers }) {
  return keyOf(id, label, 'digit', label, handlers[id])
}
const MemoDigit = memo(DigitBtn)

function FnBtn({ id, plainLabel, ariaLabel, second, handlers }) {
  const alt = second ? SECOND_MAP[id] : undefined
  const label = alt?.label ?? plainLabel
  const handlerId = alt
    ? (alt.insert ? (id === 'ln' ? 'ePow' : id === 'log' ? '10Pow' : 'asin') : id === 'sin' ? 'asin' : id === 'cos' ? 'acos' : 'atan')
    : id
  return keyOf(id, label, 'fn', ariaLabel, handlers[handlerId], Boolean(alt))
}
const MemoFn = memo(FnBtn)

function OpBtn({ id, label, ariaLabel, handlers }) {
  return keyOf(id, label, 'op', ariaLabel, handlers[id])
}
const MemoOp = memo(OpBtn)

function SciencePad({ actionsRef, angleModeRef }) {
  const [second, setSecond] = useState(false)
  const handlers = useStableHandlers(actionsRef, angleModeRef)
  const toggleSecond = useCallback(() => setSecond((v) => !v), [])

  return (
    <div className="grid grid-cols-5 gap-2">
      {keyOf('2nd', '2nd', 'ghost', 'Second function shift', toggleSecond, second)}
      {keyOf(
        'toggleAngle',
        angleModeRef.current === 'deg' ? 'DEG' : 'RAD',
        'ghost',
        `Angle unit: ${angleModeRef.current === 'deg' ? 'degrees' : 'radians'} — tap to switch`,
        handlers.toggleAngle,
      )}
      <MemoFn id="lparen" plainLabel="(" ariaLabel="Open parenthesis" second={second} handlers={handlers} />
      <MemoFn id="rparen" plainLabel=")" ariaLabel="Close parenthesis" second={second} handlers={handlers} />
      {keyOf('AC', 'AC', 'danger', 'All clear', handlers.AC)}

      <MemoFn id="sin" plainLabel="sin" ariaLabel="Sine" second={second} handlers={handlers} />
      <MemoFn id="cos" plainLabel="cos" ariaLabel="Cosine" second={second} handlers={handlers} />
      <MemoFn id="tan" plainLabel="tan" ariaLabel="Tangent" second={second} handlers={handlers} />
      <MemoFn id="ln"  plainLabel="ln"  ariaLabel="Natural logarithm" second={second} handlers={handlers} />
      <MemoOp id="backspace" label="⌫" ariaLabel="Backspace" handlers={handlers} />

      <MemoFn id="log" plainLabel="log" ariaLabel="Logarithm base 10" second={second} handlers={handlers} />
      <MemoFn id="sqrt" plainLabel="√" ariaLabel="Square root" second={second} handlers={handlers} />
      {keyOf('sqr', 'x²', 'fn', 'Square', handlers.sqr)}
      {keyOf('pow', 'xʸ', 'fn', 'Power', handlers.pow)}
      <MemoOp id="op/" label="÷" ariaLabel="Divide" handlers={handlers} />

      {keyOf('pi', 'π', 'fn', 'Pi', handlers.pi)}
      <MemoDigit id="d7" label="7" handlers={handlers} />
      <MemoDigit id="d8" label="8" handlers={handlers} />
      <MemoDigit id="d9" label="9" handlers={handlers} />
      <MemoOp id="op*" label="×" ariaLabel="Multiply" handlers={handlers} />

      {keyOf('e', 'e', 'fn', "Euler's number", handlers.e)}
      <MemoDigit id="d4" label="4" handlers={handlers} />
      <MemoDigit id="d5" label="5" handlers={handlers} />
      <MemoDigit id="d6" label="6" handlers={handlers} />
      <MemoOp id="op-" label="−" ariaLabel="Subtract" handlers={handlers} />

      <MemoOp id="pct" label="%" ariaLabel="Percent" handlers={handlers} />
      <MemoDigit id="d1" label="1" handlers={handlers} />
      <MemoDigit id="d2" label="2" handlers={handlers} />
      <MemoDigit id="d3" label="3" handlers={handlers} />
      <MemoOp id="op+" label="+" ariaLabel="Add" handlers={handlers} />

      <MemoOp id="fact" label="n!" ariaLabel="Factorial" handlers={handlers} />
      <MemoOp id="sign" label="±" ariaLabel="Toggle sign" handlers={handlers} />
      <MemoDigit id="d0" label="0" handlers={handlers} />
      {keyOf('.', '.', 'digit', 'Decimal point', handlers['.'])}
      {keyOf('equals', '=', 'equals', 'Equals', handlers.equals)}
    </div>
  )
}

function BasicPad({ actionsRef }) {
  const handlers = useStableHandlers(actionsRef, { current: 'deg' })

  return (
    <div className="grid grid-cols-4 gap-2">
      {keyOf('AC', 'AC', 'danger', 'All clear', handlers.AC)}
      <MemoOp id="backspace" label="⌫" ariaLabel="Backspace" handlers={handlers} />
      <MemoOp id="pct" label="%" ariaLabel="Percent" handlers={handlers} />
      <MemoOp id="op/" label="÷" ariaLabel="Divide" handlers={handlers} />

      <MemoDigit id="d7" label="7" handlers={handlers} />
      <MemoDigit id="d8" label="8" handlers={handlers} />
      <MemoDigit id="d9" label="9" handlers={handlers} />
      <MemoOp id="op*" label="×" ariaLabel="Multiply" handlers={handlers} />

      <MemoDigit id="d4" label="4" handlers={handlers} />
      <MemoDigit id="d5" label="5" handlers={handlers} />
      <MemoDigit id="d6" label="6" handlers={handlers} />
      <MemoOp id="op-" label="−" ariaLabel="Subtract" handlers={handlers} />

      <MemoDigit id="d1" label="1" handlers={handlers} />
      <MemoDigit id="d2" label="2" handlers={handlers} />
      <MemoDigit id="d3" label="3" handlers={handlers} />
      <MemoOp id="op+" label="+" ariaLabel="Add" handlers={handlers} />

      <MemoOp id="sign" label="±" ariaLabel="Toggle sign" handlers={handlers} />
      <MemoDigit id="d0" label="0" handlers={handlers} />
      {keyOf('.', '.', 'digit', 'Decimal point', handlers['.'])}
      {keyOf('equals', '=', 'equals', 'Equals', handlers.equals)}
    </div>
  )
}

export default memo(function Keypad({ scientific, actionsRef, angleModeRef }) {
  return scientific
    ? <SciencePad actionsRef={actionsRef} angleModeRef={angleModeRef} />
    : <BasicPad actionsRef={actionsRef} />
})