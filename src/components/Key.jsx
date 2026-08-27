import { motion } from 'framer-motion'

/**
 * A single calculator key.
 * variant: digit | fn | op | equals | danger | ghost
 *
 * Wrapped in framer-motion for a 90ms springy tap. Animations are disabled
 * by framer-motion automatically when the user prefers reduced motion.
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
      'bg-white/80 text-slate-900 shadow-sm shadow-slate-900/5 hover:bg-white ' +
      'dark:bg-ink-800/70 dark:text-slate-50 dark:shadow-black/30 dark:hover:bg-ink-700',
    fn:
      'bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 ' +
      'dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20',
    op:
      'bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 ' +
      'dark:bg-teal-400/10 dark:text-teal-200 dark:hover:bg-teal-400/20',
    equals:
      'bg-sunset text-white font-semibold shadow-lg shadow-rose-500/30 ' +
      'hover:brightness-110',
    danger:
      'bg-rose-600/10 text-rose-700 hover:bg-rose-600/20 ' +
      'dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25',
    ghost:
      'bg-transparent text-slate-500 hover:bg-slate-900/5 ' +
      'dark:text-slate-400 dark:hover:bg-white/10',
  }[variant]

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      onClick={onPress}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.4 }}
      className={[
        'flex items-center justify-center min-h-[48px] sm:min-h-[54px] lg:min-h-[62px] xl:min-h-[68px]',
        'rounded-2xl font-ui text-base sm:text-lg lg:text-xl font-medium select-none touch-manipulation',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2',
        'cursor-pointer border border-white/40 dark:border-white/5',
        active && 'bg-sunset! text-white! shadow-md shadow-rose-500/40',
        styles,
        className,
      ].join(' ')}
    >
      {label}
    </motion.button>
  )
}