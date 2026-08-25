/**
 * A single calculator key.
 * variant: digit | fn | op | equals | danger | ghost
 */
export default function Key({
  label,
  onPress,
  variant = 'digit',
  active = false,
  ariaLabel,
  className = '',
}) {
  const styles = {
    digit:
      'bg-white text-slate-900 shadow-sm shadow-slate-900/5 hover:bg-violet-50 ' +
      'dark:bg-ink-800 dark:text-slate-50 dark:shadow-black/20 dark:hover:bg-ink-700',
    fn:
      'bg-violet-500/8 text-violet-700 hover:bg-violet-500/15 ' +
      'dark:bg-accent-400/10 dark:text-accent-300 dark:hover:bg-accent-400/20',
    op:
      'bg-indigo-500/12 text-indigo-600 hover:bg-indigo-500/22 ' +
      'dark:bg-accent-500/18 dark:text-accent-200 dark:hover:bg-accent-500/30',
    equals:
      'bg-gradient-to-br from-accent-500 to-cyan-glow text-white font-semibold ' +
      'shadow-lg shadow-accent-500/30 hover:brightness-110',
    danger:
      'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 ' +
      'dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20',
    ghost:
      'bg-transparent text-slate-500 hover:bg-slate-900/5 ' +
      'dark:text-slate-400 dark:hover:bg-white/10',
  }[variant]

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      onClick={onPress}
      className={[
        // touch target + rhythm (≥44px, grows on larger screens)
        'flex items-center justify-center min-h-[48px] sm:min-h-[54px]',
        'rounded-2xl font-ui text-base sm:text-lg font-medium select-none',
        'transition-[transform,background-color,filter] duration-100 ease-out',
        'active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-accent-500',
        'focus-visible:outline-offset-2 cursor-pointer',
        active && 'bg-accent-500! text-white! shadow-md shadow-accent-500/40',
        styles,
        className,
      ].join(' ')}
    >
      {label}
    </button>
  )
}
