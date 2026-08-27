import { motion } from 'framer-motion'
import { memo, useMemo, useState } from 'react'
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

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.018, delayChildren: 0.05 },
  },
}
const keyFade = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

function AnimatedKey({ children, ...props }) {
  return (
    <motion.div variants={keyFade} className="contents">
      <MemoKey {...props}>{children}</MemoKey>
    </motion.div>
  )
}

function useKeyActions(calc) {
  return useMemo(
    () => ({
      digit: (d) => calc.pressDigit(d),
      dot: () => calc.pressDot(),
      op: (op) => calc.pressOperator(op),
      fn: (name) => calc.pressFunction(name),
      insert: (text, opts) => calc.insert(text, opts),
      clear: () => calc.pressClear(),
      back: () => calc.pressBackspace(),
      sign: () => calc.pressSign(),
      eq: () => calc.pressEquals(),
      toggleAngle: () => calc.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg'),
    }),
    [calc],
  )
}

function SciencePad({ calc }) {
  const [second, setSecond] = useState(false)
  const a = useKeyActions(calc)

  const sciFn = (name, plainLabel, ariaLabel) => {
    const alt = second ? SECOND_MAP[name] : undefined
    if (alt) {
      return (
        <AnimatedKey key={`${name}-alt`} label={alt.label} variant="fn" active
             ariaLabel={ariaLabel}
             onPress={() => (alt.insert ? a.insert(alt.insert) : a.fn(alt.fnName))} />
      )
    }
    return (
      <AnimatedKey key={name} label={plainLabel} variant="fn" ariaLabel={ariaLabel}
           onPress={() => a.fn(name)} />
    )
  }

  const digits = (...ds) =>
    ds.map((d) => <AnimatedKey key={d} label={d} onPress={() => a.digit(d)} />)

  return (
    <motion.div className="grid grid-cols-5 gap-2" variants={stagger} initial="hidden" animate="show">
      <AnimatedKey label="2nd" variant="ghost" active={second} ariaLabel="Second function shift"
           onPress={() => setSecond((v) => !v)} />
      <AnimatedKey label={calc.angleMode === 'deg' ? 'DEG' : 'RAD'} variant="ghost"
           ariaLabel={`Angle unit: ${calc.angleMode === 'deg' ? 'degrees' : 'radians'} — tap to switch`}
           onPress={a.toggleAngle} />
      <AnimatedKey label="(" variant="fn" ariaLabel="Open parenthesis" onPress={() => a.insert('(')} />
      <AnimatedKey label=")" variant="fn" ariaLabel="Close parenthesis" onPress={() => a.insert(')')} />
      <AnimatedKey label="AC" variant="danger" ariaLabel="All clear" onPress={a.clear} />

      {sciFn('sin', 'sin', 'Sine')}
      {sciFn('cos', 'cos', 'Cosine')}
      {sciFn('tan', 'tan', 'Tangent')}
      {sciFn('ln', 'ln', 'Natural logarithm')}
      <AnimatedKey label="⌫" variant="op" ariaLabel="Backspace" onPress={a.back} />

      {sciFn('log', 'log', 'Logarithm base 10')}
      <AnimatedKey label="√" variant="fn" ariaLabel="Square root" onPress={() => a.fn('sqrt')} />
      <AnimatedKey label="x²" variant="fn" ariaLabel="Square" onPress={() => a.insert('^2')} />
      <AnimatedKey label="xʸ" variant="fn" ariaLabel="Power" onPress={() => a.insert('^')} />
      <AnimatedKey label="÷" variant="op" ariaLabel="Divide" onPress={() => a.op('÷')} />

      <AnimatedKey label="π" variant="fn" ariaLabel="Pi" onPress={() => a.insert('π')} />
      {digits('7', '8', '9')}
      <AnimatedKey label="×" variant="op" ariaLabel="Multiply" onPress={() => a.op('×')} />

      <AnimatedKey label="e" variant="fn" ariaLabel="Euler's number" onPress={() => a.insert('e')} />
      {digits('4', '5', '6')}
      <AnimatedKey label="−" variant="op" ariaLabel="Subtract" onPress={() => a.op('-')} />

      <AnimatedKey label="%" variant="op" ariaLabel="Percent" onPress={() => a.insert('%')} />
      {digits('1', '2', '3')}
      <AnimatedKey label="+" variant="op" ariaLabel="Add" onPress={() => a.op('+')} />

      <AnimatedKey label="n!" variant="op" ariaLabel="Factorial" onPress={() => a.insert('!')} />
      <AnimatedKey label="±" variant="op" ariaLabel="Toggle sign" onPress={a.sign} />
      <AnimatedKey label="0" onPress={() => a.digit('0')} />
      <AnimatedKey label="." ariaLabel="Decimal point" onPress={a.dot} />
      <AnimatedKey label="=" variant="equals" ariaLabel="Equals" onPress={a.eq} />
    </motion.div>
  )
}

function BasicPad({ calc }) {
  const a = useKeyActions(calc)
  const digits = (...ds) =>
    ds.map((d) => <AnimatedKey key={d} label={d} onPress={() => a.digit(d)} />)

  return (
    <motion.div className="grid grid-cols-4 gap-2" variants={stagger} initial="hidden" animate="show">
      <AnimatedKey label="AC" variant="danger" ariaLabel="All clear" onPress={a.clear} />
      <AnimatedKey label="⌫" variant="op" ariaLabel="Backspace" onPress={a.back} />
      <AnimatedKey label="%" variant="op" ariaLabel="Percent" onPress={() => a.insert('%')} />
      <AnimatedKey label="÷" variant="op" ariaLabel="Divide" onPress={() => a.op('÷')} />

      {digits('7', '8', '9')}
      <AnimatedKey label="×" variant="op" ariaLabel="Multiply" onPress={() => a.op('×')} />

      {digits('4', '5', '6')}
      <AnimatedKey label="−" variant="op" ariaLabel="Subtract" onPress={() => a.op('-')} />

      {digits('1', '2', '3')}
      <AnimatedKey label="+" variant="op" ariaLabel="Add" onPress={() => a.op('+')} />

      <AnimatedKey label="±" variant="op" ariaLabel="Toggle sign" onPress={a.sign} />
      <AnimatedKey label="0" onPress={() => a.digit('0')} />
      <AnimatedKey label="." ariaLabel="Decimal point" onPress={a.dot} />
      <AnimatedKey label="=" variant="equals" ariaLabel="Equals" onPress={a.eq} />
    </motion.div>
  )
}

export default memo(function Keypad({ scientific, calc }) {
  return scientific ? <SciencePad calc={calc} /> : <BasicPad calc={calc} />
})
