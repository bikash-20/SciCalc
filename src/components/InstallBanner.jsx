import { useEffect, useState } from 'react'
import { CalcIcon, CloseIcon, DownloadIcon } from './Icons.jsx'

const DISMISS_KEY = 'scicalc.installDismissed.v1'

/**
 * Promo banner prompting installation.
 * - Chrome/Android/desktop: appears when `beforeinstallprompt` fires → one-tap install
 * - iOS Safari: native prompt unsupported → shows Share ▦ → Add to Home Screen steps
 * - Remembers dismissal; hidden when already running as installed PWA
 */
export default function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [armed, setArmed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      /* private mode */
    }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (dismissed || standalone) return undefined

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    setIsIOS(ios)

    const onPrompt = (e) => {
      e.preventDefault()
      setPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // ease-in shortly after first paint instead of popping instantly
    const timer = setTimeout(() => setArmed(true), 2500)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  const dismiss = () => {
    setArmed(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    setPromptEvent(null)
    dismiss()
  }

  // iOS: informational banner works without the native event
  const show = armed && (Boolean(promptEvent) || isIOS)

  return (
    <div
      aria-label="Install SciCalc"
      className={`fixed inset-x-0 z-50 flex justify-center px-4 transition-all duration-300 ease-out
                  ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}
                  bottom-[calc(1rem+env(safe-area-inset-bottom))]`}
    >
      <div
        className={`flex w-full max-w-md items-center gap-3 rounded-2xl border p-3 pr-2 shadow-2xl backdrop-blur-xl
                    border-white/20 bg-ink-900/90 text-white shadow-black/40
                    dark:border-white/10 sm:max-w-lg`}
      >
        {/* mini app icon */}
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunset text-white shadow-lg shadow-rose-500/30"
        >
          <CalcIcon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">Install SciCalc</p>
          <p className="truncate text-xs text-slate-300">
            {isIOS && !promptEvent
              ? 'Tap Share ▦ then “Add to Home Screen”.'
              : 'One tap — full screen & works offline.'}
          </p>
        </div>

        {!isIOS && (
          <button
            type="button"
            onClick={install}
            disabled={!promptEvent}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sunset
                       px-4 py-2.5 font-ui text-sm font-semibold text-white shadow-lg shadow-rose-500/30
                       transition hover:brightness-110 active:scale-[0.96] cursor-pointer
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
                       disabled:opacity-50"
          >
            <DownloadIcon width={16} height={16} />
            Install
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>
    </div>
  )
}
