import { useEffect } from 'react'
import { CloseIcon, TrashIcon } from './Icons.jsx'

/** Shared list rendering — used by the mobile drawer AND the desktop side panel. */
export function HistoryList({ history, onRestore }) {
  if (history.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Your calculations will appear here.
      </p>
    )
  }
  return (
    <ul className="space-y-2 p-3">
      {history.map((entry) => (
        <li key={entry.ts}>
          <button
            type="button"
            onClick={() => onRestore(entry.expr)}
            className="group w-full rounded-xl px-4 py-3 text-right transition-colors hover:bg-slate-100 dark:hover:bg-ink-800"
          >
            <div className="numeric truncate text-xs text-slate-400 dark:text-slate-500">{entry.expr}</div>
            <div className="numeric truncate text-lg font-semibold text-slate-900 group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-300">
              {entry.result}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Slide-over drawer for phones/tablets (<lg).
 * On large screens App renders HistoryList inline instead.
 */
export default function HistoryDrawer({ open, history, onClose, onRestore, onClear }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200
                    ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Calculation history"
        className={`absolute right-0 top-0 h-full w-84 max-w-[88vw] flex flex-col
                    bg-white dark:bg-ink-900 shadow-2xl
                    border-l border-slate-900/10 dark:border-white/10
                    transition-transform duration-300 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-slate-900/5 px-5 py-4 dark:border-white/5">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">History</h2>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear history"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
              >
                <TrashIcon />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600
                         dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <HistoryList history={history} onRestore={onRestore} />
        </div>
      </aside>
    </div>
  )
}
