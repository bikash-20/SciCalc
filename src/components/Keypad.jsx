import { useState } from 'react'
import Key from './Key.jsx'

/** What each science key becomes while "2nd" is active. */
const SECOND_MAP = {
  sin: { label: 'sin⁻¹', fnName: 'asin' },
  cos: { label: 'cos⁻¹', fnName: 'acos' },
  tan: { label: 'tan⁻¹', fnName: 'atan' },
  ln: { label: 'eˣ', insert: 'e^(' },
  log: { label: '10ˣ', insert: '10^(' },
}

export default function Keypad({ scientific, calc }) {
  return scientific ? <SciencePad calc={calc} /> : <BasicPad calc={calc} />
}

function SciencePad({ calc }) {
  const [second, setSecond] = useState(false)

  const sciFn = (name, plainLabel, ariaLabel) => {
    const alt = second ? SECOND_MAP[name] : undefined
    if (alt) {
      return (
        <Key key={`${name}-alt`} label={alt.label} variant="fn" active ariaLabel={ariaLabel}
             onPress={() => (alt.insert ? calc.insert(alt.insert) : calc.pressFunction(alt.fnName))} />
      )
    }
    return (
      <Key key={name} label={plainLabel} variant="fn" ariaLabel={ariaLabel}
           onPress={() => calc.pressFunction(name)} />
    )
  }

  const digits = (...ds) =>
    ds.map((d) => <Key key={d} label={d} onPress={() => calc.pressDigit(d)} />)

  return (
    <div className="grid grid-cols-5 gap-2">
      {/* row 1 — utilities */}
      <Key label="2nd" variant="ghost" active={second} ariaLabel="Second function shift"
           onPress={() => setSecond((v) => !v)} />
      <Key label={calc.angleMode === 'deg' ? 'DEG' : 'RAD'} variant="ghost"
           ariaLabel={`Angle unit: ${calc.angleMode === 'deg' ? 'degrees' : 'radians'} — tap to switch`}
           onPress={() => calc.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg')} />
      <Key label="(" variant="fn" ariaLabel="Open parenthesis" onPress={() => calc.insert('(')} />
      <Key label=")" variant="fn" ariaLabel="Close parenthesis" onPress={() => calc.insert(')')} />
      <Key label="AC" variant="danger" ariaLabel="All clear" onPress={calc.pressClear} />

      {/* row 2 — trig */}
      {sciFn('sin', 'sin', 'Sine')}
      {sciFn('cos', 'cos', 'Cosine')}
      {sciFn('tan', 'tan', 'Tangent')}
      {sciFn('ln', 'ln', 'Natural logarithm')}
      <Key label="⌫" variant="op" ariaLabel="Backspace" onPress={calc.pressBackspace} />

      {/* row 3 — logs & powers */}
      {sciFn('log', 'log', 'Logarithm base 10')}
      <Key label="√" variant="fn" ariaLabel="Square root" onPress={() => calc.pressFunction('sqrt')} />
      <Key label="x²" variant="fn" ariaLabel="Square" onPress={() => calc.insert('^2')} />
      <Key label="xʸ" variant="fn" ariaLabel="Power" onPress={() => calc.insert('^')} />
      <Key label="÷" variant="op" ariaLabel="Divide" onPress={() => calc.pressOperator('÷')} />

      {/* row 4 */}
      <Key label="π" variant="fn" ariaLabel="Pi" onPress={() => calc.insert('π')} />
      {digits('7', '8', '9')}
      <Key label="×" variant="op" ariaLabel="Multiply" onPress={() => calc.pressOperator('×')} />

      {/* row 5 */}
      <Key label="e" variant="fn" ariaLabel="Euler's number" onPress={() => calc.insert('e')} />
      {digits('4', '5', '6')}
      <Key label="−" variant="op" ariaLabel="Subtract" onPress={() => calc.pressOperator('-')} />

      {/* row 6 */}
      <Key label="%" variant="op" ariaLabel="Percent" onPress={() => calc.insert('%')} />
      {digits('1', '2', '3')}
      <Key label="+" variant="op" ariaLabel="Add" onPress={() => calc.pressOperator('+')} />

      {/* row 7 */}
      <Key label="n!" variant="op" ariaLabel="Factorial" onPress={() => calc.insert('!')} />
      <Key label="±" variant="op" ariaLabel="Toggle sign" onPress={calc.pressSign} />
      <Key label="0" onPress={() => calc.pressDigit('0')} />
      <Key label="." ariaLabel="Decimal point" onPress={calc.pressDot} />
      <Key label="=" variant="equals" ariaLabel="Equals" onPress={calc.pressEquals} />
    </div>
  )
}

function BasicPad({ calc }) {
  const rows = [
    [
      <Key key="ac" label="AC" variant="danger" ariaLabel="All clear" onPress={calc.pressClear} />,
      <Key key="del" label="⌫" variant="op" ariaLabel="Backspace" onPress={calc.pressBackspace} />,
      <Key key="pct" label="%" variant="op" ariaLabel="Percent" onPress={() => calc.insert('%')} />,
      <Key key="div" label="÷" variant="op" ariaLabel="Divide" onPress={() => calc.pressOperator('÷')} />,
    ],
    [...['7', '8', '9'].map((d) => <Key key={d} label={d} onPress={() => calc.pressDigit(d)} />),
      <Key key="mul" label="×" variant="op" ariaLabel="Multiply" onPress={() => calc.pressOperator('×')} />,
    ],
    [...['4', '5', '6'].map((d) => <Key key={d} label={d} onPress={() => calc.pressDigit(d)} />),
      <Key key="sub" label="−" variant="op" ariaLabel="Subtract" onPress={() => calc.pressOperator('-')} />,
    ],
    [...['1', '2', '3'].map((d) => <Key key={d} label={d} onPress={() => calc.pressDigit(d)} />),
      <Key key="add" label="+" variant="op" ariaLabel="Add" onPress={() => calc.pressOperator('+')} />,
    ],
    [
      <Key key="sign" label="±" variant="op" ariaLabel="Toggle sign" onPress={calc.pressSign} />,
      <Key key="0" label="0" onPress={() => calc.pressDigit('0')} />,
      <Key key="dot" label="." ariaLabel="Decimal point" onPress={calc.pressDot} />,
      <Key key="eq" label="=" variant="equals" ariaLabel="Equals" onPress={calc.pressEquals} />,
    ],
  ]

  return <div className="grid grid-cols-4 gap-2">{rows.flat()}</div>
}
