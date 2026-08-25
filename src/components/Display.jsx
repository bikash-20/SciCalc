import { useState } from 'react'
import { CopyIcon, CheckIcon, DeleteIcon } from './Icons.jsx'

function sizeClass(len) {
  if (len <= 9) return 'text-5xl sm:text-6xl lg:text-7xl'
  if (len <= 13) return 'text-4xl sm:text-5xl lg:text-6xl'
  return 'text-3xl sm:text-4xl lg:text-5xl'
}

/**
 * The display card: angle chip, live preview / expression line,
 * big result line, copy + backspace utilities.
 */
export default function Display({
  input,
  displayResult,
  error,
  preview,
  justEvaluated,
  angleMode,
  onToggleAngle,
  onCopy,
  onBackspace,
}) {
  const [copied, setCopied] = useState(false)

  const bigText = justEvaluated ? displayResult : input || '0'

  const handleCopy = () => {
    const raw = justEvaluated ? displayResult : preview?.ok ? String(preview.value) : bigText
    onCopy(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section
      className="rounded-xl2 px-5 pt-4 pb-5 bg-slate-50/60 dark:bg-ink-950/60
                 border border-slate-900/5 dark:border-white/5"
      aria-label="Calculator display"
    >
      {/* utility row */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onToggleAngle}
          aria-label={`Angle unit: ${angleMode === 'deg' ? 'degrees' : 'radians'} — tap to switch`}
          className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide
                     bg-indigo-500/10 text-indigo-600 dark:bg-accent-400/15 dark:text-accent-200
                     hover:bg-indigo-500/20 dark:hover:bg-accent-400/25 transition-colors"
        >
          {angleMode.toUpperCase()}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy result to clipboard"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-900/5
                       dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/10 transition-colors"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            type="button"
            onClick={onBackspace}
            aria-label="Delete last character"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-900/5
                       dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/10 transition-colors"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* expression / preview line */}
      <div className="h-6 flex items-center justify-end gap-2 overflow-hidden">
        {error ? (
          <span className="text-sm font-medium text-rose-500 dark:text-rose-400 truncate">{error}</span>
        ) : (
          <>
            {!justEvaluated && preview?.ok && (
              <span className="numeric text-sm text-slate-400 dark:text-slate-500 truncate">
                = {preview.value}
              </span>
            )}
            <span className="numeric text-sm text-slate-400 dark:text-slate-500 truncate max-w-full">
              {(justEvaluated ? `${input} ` : '') || ''}
            </span>
          </>
        )}
      </div>

      {/* main line */}
      <output
        aria-live="polite"
        className={`numeric block w-full text-right font-semibold text-slate-900
                    dark:text-white break-all leading-tight mt-1 ${sizeClass(bigText.length)}
                    ${error ? 'text-rose-500 dark:text-rose-400 text-2xl' : ''}`}
      >
        {error ? 'Error' : bigText}
      </output>
    </section>
  )
}
