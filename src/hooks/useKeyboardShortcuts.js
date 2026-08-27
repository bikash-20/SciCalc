import { useEffect } from 'react'

/**
 * Wire the global keyboard listener for the calculator. The actions map is
 * read through a ref so the listener is bound exactly once per mount and
 * never re-attaches during typing.
 */
export function useKeyboardShortcuts(actionsRef, extras = {}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const a = actionsRef.current
      if (!a) return
      const k = e.key

      if (/^[0-9]$/.test(k)) return a.pressDigit(k)
      if (k === '.') return a.pressDot()
      if (k === '+' || k === '-') return a.pressOperator(k)
      if (k === '*' || k.toLowerCase() === 'x') {
        e.preventDefault()
        return a.pressOperator('×')
      }
      if (k === '/') {
        e.preventDefault()
        return a.pressOperator('÷')
      }
      if (k === '^') return a.insert('^')
      if (k === '%') return a.insert('%')
      if (k === '!') return a.insert('!')
      if (k === '(' || k === ')') return a.insert(k)
      if (k === 'Enter' || k === '=') {
        e.preventDefault()
        return a.pressEquals()
      }
      if (k === 'Backspace') return a.pressBackspace()
      if (k === 'Escape' || k === 'Delete') return a.pressClear()

      const lower = k.toLowerCase()
      if (lower === 'p') return a.insert('π')
      if (lower === 's') return a.pressFunction('sin')
      if (lower === 'c') return a.pressFunction('cos')
      if (lower === 't') return a.pressFunction('tan')
      if (lower === 'r') return a.pressFunction('sqrt')
      if (lower === 'l') return a.pressFunction('ln')
      if (lower === 'g') return a.pressFunction('log')
      if (lower === 'h') return extras.toggleHistory?.()
      if (lower === 'd') return extras.toggleAngle?.()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actionsRef, extras])
}
