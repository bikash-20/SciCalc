import { useCallback, useEffect, useState } from 'react'
import Display from './components/Display.jsx'
import Keypad from './components/Keypad.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import HistoryDrawer, { HistoryList } from './components/HistoryDrawer.jsx'
import { SunIcon, MoonIcon, HistoryIcon, TrashIcon } from './components/Icons.jsx'
import { useCalculator } from './hooks/useCalculator.js'

const THEME_KEY = 'scicalc.theme.v1'

export default function App() {
  const calc = useCalculator()
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'dark')
  const [scientific, setScientific] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0d14' : '#f7f7fb')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const copyText = useCallback((text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }, [])

  /* ---- full keyboard support ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key

      if (/^[0-9]$/.test(k)) return calc.pressDigit(k)
      if (k === '.') return calc.pressDot()
      if (k === '+' || k === '-') return calc.pressOperator(k)
      if (k === '*' || k.toLowerCase() === 'x') return calc.pressOperator('×')
      if (k === '/') {
        e.preventDefault()
        return calc.pressOperator('÷')
      }
      if (k === '^') return calc.insert('^')
      if (k === '%') return calc.insert('%')
      if (k === '!') return calc.insert('!')
      if (k === '(' || k === ')') return calc.insert(k)
      if (k === 'Enter' || k === '=') {
        e.preventDefault()
        return calc.pressEquals()
      }
      if (k === 'Backspace') return calc.pressBackspace()
      if (k === 'Escape' || k === 'Delete') return calc.pressClear()

      const lower = k.toLowerCase()
      if (lower === 'p') return calc.insert('π')
      if (lower === 's') return calc.pressFunction('sin')
      if (lower === 'c') return calc.pressFunction('cos')
      if (lower === 't') return calc.pressFunction('tan')
      if (lower === 'r') return calc.pressFunction('sqrt')
      if (lower === 'l') return calc.pressFunction('ln')
      if (lower === 'g') return calc.pressFunction('log')
      if (lower === 'h') setHistoryOpen((v) => !v)
      if (lower === 'd') calc.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg')
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [calc])

  return (
    <div className="min-h-full font-ui text-slate-900 dark:text-slate-100 relative overflow-x-clip
                    bg-paper-50 dark:bg-ink-950 transition-colors">
      {/* ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent-500/25 blur-[110px]" />
        <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-glow/20 blur-[130px]" />
      </div>

      <main className="app-main relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 pt-safe pb-safe sm:max-w-lg sm:px-6 lg:max-w-5xl lg:flex-row lg:gap-10">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
        {/* header */}
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-cyan-glow shadow-lg shadow-accent-500/30">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white"
                   strokeWidth="2" strokeLinecap="round">
                <rect x="5" y="3" width="14" height="18" rx="3" />
                <path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
              </svg>
            </span>
            <h1 className="font-display text-xl font-bold tracking-tight">SciCalc</h1>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setHistoryOpen(true)} aria-label="History (H)"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-700
                         dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer lg:hidden">
              <HistoryIcon />
            </button>
            <button type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-900/5 hover:text-slate-700
                         dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* calculator card */}
        <section className="animate-pop-in rounded-3xl border border-slate-900/5 bg-white/70 p-4 shadow-2xl
                            shadow-slate-900/10 backdrop-blur-xl sm:p-5
                            dark:border-white/10 dark:bg-ink-900/70 dark:shadow-black/40">
          <Display
            input={calc.input}
            displayResult={calc.displayResult}
            error={calc.error}
            preview={calc.preview}
            justEvaluated={calc.justEvaluated}
            angleMode={calc.angleMode}
            onToggleAngle={() => calc.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg')}
            onCopy={copyText}
            onBackspace={calc.pressBackspace}
          />

          {/* mode switch */}
          <div className="my-4 flex items-center rounded-full bg-slate-900/5 p-1 text-sm font-medium
                          dark:bg-white/5" role="tablist" aria-label="Calculator mode">
            {['basic', 'scientific'].map((mode) => (
              <button key={mode} type="button" role="tab"
                aria-selected={scientific === (mode === 'scientific')}
                onClick={() => setScientific(mode === 'scientific')}
                className={`flex-1 rounded-full py-1.5 capitalize transition-all duration-200 cursor-pointer
                  ${scientific === (mode === 'scientific')
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                {mode}
              </button>
            ))}
          </div>

          <Keypad scientific={scientific} calc={calc} />
        </section>

        <p className="mt-4 hidden text-center text-xs text-slate-400 sm:block dark:text-slate-600">
          Keyboard works — digits, + − * / ^ % !, Enter = equals, Esc = clear,
          s/c/t/r/l/g for functions, H history
        </p>

        {/* developer credit */}
        <footer className="mt-3 text-center text-xs text-slate-400 dark:text-slate-600">
          Crafted by{' '}
          <a
            href="https://github.com/bikash-20"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-500 underline-offset-2 transition-colors hover:text-accent-600 hover:underline dark:text-slate-500 dark:hover:text-accent-300"
          >
            Bikash Talukder
          </a>
        </footer>
        </div>

        {/* persistent history side panel — large screens & tablets landscape */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="overflow-hidden rounded-3xl border border-slate-900/5 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur-xl
                          dark:border-white/10 dark:bg-ink-900/70 dark:shadow-black/20">
            <header className="flex items-center justify-between border-b border-slate-900/5 px-5 py-4 dark:border-white/5">
              <h2 className="font-display text-lg font-semibold">History</h2>
              {calc.history.length > 0 && (
                <button type="button" onClick={calc.clearHistory} aria-label="Clear history"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer">
                  <TrashIcon />
                </button>
              )}
            </header>
            <div className="max-h-[65vh] overflow-y-auto">
              <HistoryList history={calc.history} onRestore={calc.restoreFromHistory} />
            </div>
          </div>
        </aside>
      </main>

      <HistoryDrawer
        open={historyOpen}
        history={calc.history}
        onClose={() => setHistoryOpen(false)}
        onRestore={calc.restoreFromHistory}
        onClear={calc.clearHistory}
      />

      {/* PWA install promo */}
      <InstallBanner />

      {/* offline status indicator */}
      {!online && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/20 bg-white/80 px-3 py-1.5 backdrop-blur
                     dark:bg-ink-900/80"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" aria-hidden />
          <span className="font-ui text-xs font-medium text-amber-700 dark:text-amber-300">
            Offline — everything is saved on this device
          </span>
        </div>
      )}
    </div>
  )
}
