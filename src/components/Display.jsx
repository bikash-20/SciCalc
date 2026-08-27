import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback, useState } from 'react'
import { CopyIcon, CheckIcon, DeleteIcon } from './Icons.jsx'

function sizeClass(len) {
  if (len <= 9)  return 'text-5xl sm:text-6xl lg:text-7xl'
  if (len <= 13) return 'text-4xl sm:text-5xl lg:text-6xl'
  return                'text-3xl sm:text-4xl lg:text-5xl'
}

/**
 * The display card: angle chip, live preview / expression line,
 * big result line, copy + backspace utilities.
 *
 * Uses framer-motion's AnimatePresence to fade/slide the result on `=`
 * without a layout shift.
 */
function Display({
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

  const handleCopy = useCallback(() => {
    const raw = justEvaluated ? displayResult : preview?.ok ? String(preview.value) : bigText
    onCopy(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }, [justEvaluated, displayResult, preview, bigText, onCopy])

  return (
    <section
      className="rounded-xl2 px-5 pt-4 pb-5 bg-white/70 dark:bg-ink-900/60
                 border border-white/60 dark:border-white/5 backdrop-blur-xl
                 shadow-sm shadow-slate-900/5 dark:shadow-black/30 bg-grain"
      aria-label="Calculator display"
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onToggleAngle}
          aria-label={`Angle unit: ${angleMode === 'deg' ? 'degrees' : 'radians'} — tap to switch`}
          className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide
                     bg-teal-500/15 text-teal-700 dark:bg-teal-400/15 dark:text-teal-200
                     hover:bg-teal-500/25 dark:hover:bg-teal-400/25 transition-colors
                     focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2"
        >
          {angleMode.toUpperCase()}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy result to clipboard"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-900/5
                       dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/10
                       transition-colors focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span key="check"
                  initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.12 }}>
                  <CheckIcon />
                </motion.span>
              ) : (
                <motion.span key="copy"
                  initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.12 }}>
                  <CopyIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={onBackspace}
            aria-label="Delete last character"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-900/5
                       dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/10
                       transition-colors focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="h-6 flex items-center justify-end gap-2 overflow-hidden">
        {error ? (
          <span className="text-sm font-medium text-rose-500 dark:text-rose-400 truncate">{error}</span>
        ) : (
          <>
            {!justEvaluated && preview?.ok && (
              <span className="numeric text-sm text-slate-500 dark:text-slate-400 truncate">
                = {preview.value}
              </span>
            )}
            <span className="numeric text-sm text-slate-500 dark:text-slate-400 truncate max-w-full">
              {(justEvaluated ? `${input} ` : '') || ''}
            </span>
          </>
        )}
      </div>

      <output
        aria-live="polite"
        className={`numeric block w-full text-right font-semibold break-all leading-tight mt-1
                    bg-sunset bg-clip-text text-transparent
                    ${sizeClass(bigText.length)}
                    ${error ? '!bg-none !text-rose-500 dark:!text-rose-400 text-2xl' : ''}`}
      >
        {error ? 'Error' : bigText}
      </output>
    </section>
  )
}

export default memo(Display)
