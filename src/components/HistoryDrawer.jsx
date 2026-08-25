import { useEffect } from 'react'
import { CloseIcon, TrashIcon } from './Icons.jsx'

/**
 * Slide-over panel listing past calculations.
 * Click an entry to load its expression back into the calculator.
 */
export default function HistoryDrawer({ open, history, onClose, onRestore, onClear }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200
                    ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Calculation history"
        className={`absolute right-0 top-0 h-full w-84 max-w-[88vw]
                    bg-white dark:bg-ink-900 shadow-2xl flex flex-col
                    border-l border-slate-900/10 dark:border-white/10
                    transition-transform duration-250 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-900/5 dark:border-white/5">
          <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white">History</h2>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear history"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <TrashIcon />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-900/5
                         dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <ul className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 && (
            <li className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10">
              Your calculations will appear here.
            </li>
          )}
          {history.map((entry) => (
            <li key={entry.ts}>
              <button
                type="button"
                onClick={() => {
                  onRestore(entry.expr)
                  onClose()
                }}
                className="w-full text-right rounded-xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-ink-800
                           transition-colors group"
              >
                <div className="numeric text-xs text-slate-400 dark:text-slate-500 truncate">{entry.expr}</div>
                <div className="numeric text-lg font-semibold text-slate-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-300 truncate">
                  {entry.result}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
