import { AnimatePresence, motion } from 'framer-motion'
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
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) ?? 'dark' } catch { return 'dark' }
  })
  const [scientific, setScientific] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

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
      ?.setAttribute('content', theme === 'dark' ? '#0a0a12' : '#fbf7f4')
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const copyText = useCallback((text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key

      if (/^[0-9]$/.test(k)) return calc.actions.pressDigit(k)
      if (k === '.') return calc.actions.pressDot()
      if (k === '+' || k === '-') return calc.actions.pressOperator(k)
      if (k === '*' || k.toLowerCase() === 'x') {
        e.preventDefault()
        return calc.actions.pressOperator('×')
      }
      if (k === '/') {
        e.preventDefault()
        return calc.actions.pressOperator('÷')
      }
      if (k === '^') return calc.actions.insert('^')
      if (k === '%') return calc.actions.insert('%')
      if (k === '!') return calc.actions.insert('!')
      if (k === '(' || k === ')') return calc.actions.insert(k)
      if (k === 'Enter' || k === '=') {
        e.preventDefault()
        return calc.actions.pressEquals()
      }
      if (k === 'Backspace') return calc.actions.pressBackspace()
      if (k === 'Escape' || k === 'Delete') return calc.actions.pressClear()

      const lower = k.toLowerCase()
      if (lower === 'p') return calc.actions.insert('π')
      if (lower === 's') return calc.actions.pressFunction('sin')
      if (lower === 'c') return calc.actions.pressFunction('cos')
      if (lower === 't') return calc.actions.pressFunction('tan')
      if (lower === 'r') return calc.actions.pressFunction('sqrt')
      if (lower === 'l') return calc.actions.pressFunction('ln')
      if (lower === 'g') return calc.actions.pressFunction('log')
      if (lower === 'h') setHistoryOpen((v) => !v)
      if (lower === 'd') calc.actions.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg')
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [calc, calc.angleMode])

  return (
    <div className="min-h-full font-ui text-slate-900 dark:text-slate-100 relative overflow-x-clip
                    bg-sunset-radial transition-colors duration-500">
      {/* Animated ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-rose-500/30 blur-[110px]"
          animate={{ x: [0, 30, -10, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-teal-400/25 blur-[130px]"
          animate={{ x: [0, -25, 15, 0], y: [0, -15, 10, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/20 blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <main className="app-main relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 pt-safe pb-safe sm:max-w-lg sm:px-6 lg:max-w-5xl lg:flex-row lg:gap-10">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <motion.span
                aria-hidden
                whileHover={{ rotate: -8, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunset shadow-lg shadow-rose-500/30"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white"
                     strokeWidth="2" strokeLinecap="round">
                  <rect x="5" y="3" width="14" height="18" rx="3" />
                  <path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
                </svg>
              </motion.span>
              <h1 className="font-display text-xl font-bold tracking-tight bg-sunset bg-clip-text text-transparent">
                SciCalc
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setHistoryOpen(true)} aria-label="History (H)"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-700
                           dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer lg:hidden
                           focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2">
                <HistoryIcon />
              </button>
              <motion.button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                whileTap={{ scale: 0.9, rotate: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-900/5 hover:text-slate-700
                           dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer
                           focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.span key="sun"
                      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                      transition={{ duration: 0.2 }}>
                      <SunIcon />
                    </motion.span>
                  ) : (
                    <motion.span key="moon"
                      initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                      transition={{ duration: 0.2 }}>
                      <MoonIcon />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="rounded-3xl border border-white/40 bg-white/60 p-4 shadow-2xl shadow-slate-900/10
                       backdrop-blur-2xl sm:p-5
                       dark:border-white/10 dark:bg-ink-900/55 dark:shadow-black/40"
          >
            <Display
              input={calc.input}
              displayResult={calc.displayResult}
              error={calc.error}
              preview={calc.preview}
              justEvaluated={calc.justEvaluated}
              angleMode={calc.angleMode}
              onToggleAngle={() => calc.actions.setAngleMode(calc.angleMode === 'deg' ? 'rad' : 'deg')}
              onCopy={copyText}
              onBackspace={calc.actions.pressBackspace}
            />

            <div className="my-4 flex items-center rounded-full bg-slate-900/5 p-1 text-sm font-medium
                            dark:bg-white/5 relative" role="tablist" aria-label="Calculator mode">
              {['basic', 'scientific'].map((mode) => {
                const active = scientific === (mode === 'scientific')
                return (
                  <button key={mode} type="button" role="tab"
                    aria-selected={active}
                    onClick={() => setScientific(mode === 'scientific')}
                    className="relative flex-1 rounded-full py-1.5 capitalize cursor-pointer
                               focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2
                               transition-colors duration-200">
                    {active && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-ink-700"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {mode}
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={scientific ? 'sci' : 'basic'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <Keypad scientific={scientific} actions={calc.actions} angleMode={calc.angleMode} />
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <p className="mt-4 hidden text-center text-xs text-slate-500 sm:block dark:text-slate-400">
            Keyboard works — digits, + − * / ^ % !, Enter = equals, Esc = clear,
            s/c/t/r/l/g for functions, H history
          </p>

          <footer className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Crafted by{' '}
            <a
              href="https://github.com/bikash-20"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 underline-offset-2 transition-colors hover:text-rose-600 hover:underline dark:text-slate-300 dark:hover:text-rose-300"
            >
              Bikash Talukder
            </a>
          </footer>
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 24 }}
            className="overflow-hidden rounded-3xl border border-white/40 bg-white/65 shadow-xl shadow-slate-900/5 backdrop-blur-xl
                       dark:border-white/10 dark:bg-ink-900/60 dark:shadow-black/20"
          >
            <header className="flex items-center justify-between border-b border-slate-900/5 px-5 py-4 dark:border-white/5">
              <h2 className="font-display text-lg font-semibold">History</h2>
              {calc.history.length > 0 && (
                <button type="button" onClick={calc.actions.clearHistory} aria-label="Clear history"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer
                             focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2">
                  <TrashIcon />
                </button>
              )}
            </header>
            <div className="max-h-[65vh] overflow-y-auto">
              <HistoryList history={calc.history} onRestore={calc.actions.restoreFromHistory} />
            </div>
          </motion.div>
        </aside>
      </main>

      <HistoryDrawer
        open={historyOpen}
        history={calc.history}
        onClose={() => setHistoryOpen(false)}
        onRestore={calc.actions.restoreFromHistory}
        onClear={calc.actions.clearHistory}
      />

      <InstallBanner />

      <AnimatePresence>
        {!online && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/30 bg-white/85 px-3 py-1.5 backdrop-blur
                       shadow-lg shadow-amber-500/10
                       dark:bg-ink-900/85"
          >
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" aria-hidden />
            <span className="font-ui text-xs font-medium text-amber-700 dark:text-amber-300">
              Offline — everything is saved on this device
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
