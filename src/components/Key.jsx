import { memo } from 'react'

/**
 * A single calculator key — 3D / tactile.
 *
 * Depth comes from layered box-shadows (no GPU work) plus a CSS `:active`
 * transform that "pushes the button down" by translating the shadow into
 * a flat pressed state. The same effect as framer-motion's spring but
 * ~30× cheaper for 30 keys pressed in a row.
 *
 * Variants differ by base hue + bevel color; the geometry stays identical
 * so the keypad reads as a single object.
 *
 *   digit    — neutral, light face
 *   fn       — rose (functions / constants)
 *   op       — teal (operators)
 *   equals   — gradient CTA
 *   danger   — red, for AC
 *   ghost    — flat, for shift/mode toggles
 */

const VARIANT = {
  digit: {
    face: 'bg-white/85 text-slate-900 dark:bg-ink-800/80 dark:text-slate-50',
    edge: 'shadow-[0_4px_0_0_rgba(15,23,42,0.18),0_6px_14px_-4px_rgba(15,23,42,0.25),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.55),0_6px_14px_-4px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
    press: 'active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(15,23,42,0.18),0_3px_8px_-4px_rgba(15,23,42,0.25)] dark:active:shadow-[0_2px_0_0_rgba(0,0,0,0.55),0_3px_8px_-4px_rgba(0,0,0,0.55)]',
    hover: 'hover:-translate-y-[1px] hover:brightness-[1.04]',
  },
  fn: {
    face: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
    edge: 'shadow-[0_4px_0_0_rgb(190,24,93,0.35),0_6px_14px_-4px_rgba(244,63,117,0.35),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_0_0_rgb(244,63,117,0.45),0_6px_14px_-4px_rgba(244,63,117,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
    press: 'active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(190,24,93,0.35),0_3px_8px_-4px_rgba(244,63,117,0.35)]',
    hover: 'hover:-translate-y-[1px] hover:brightness-[1.05]',
  },
  op: {
    face: 'bg-teal-100/90 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200',
    edge: 'shadow-[0_4px_0_0_rgb(13,148,136,0.4),0_6px_14px_-4px_rgba(20,184,166,0.35),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_0_0_rgb(45,212,191,0.45),0_6px_14px_-4px_rgba(45,212,191,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
    press: 'active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(13,148,136,0.4),0_3px_8px_-4px_rgba(20,184,166,0.35)]',
    hover: 'hover:-translate-y-[1px] hover:brightness-[1.05]',
  },
  equals: {
    face: 'bg-sunset text-white',
    edge: 'shadow-[0_4px_0_0_rgb(190,24,93,0.55),0_8px_18px_-4px_rgba(244,63,117,0.5),inset_0_1px_0_0_rgba(255,255,255,0.4)]',
    press: 'active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(190,24,93,0.55),0_4px_10px_-4px_rgba(244,63,117,0.5)]',
    hover: 'hover:-translate-y-[1px] hover:brightness-110',
  },
  danger: {
    face: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
    edge: 'shadow-[0_4px_0_0_rgb(190,24,93,0.4),0_6px_14px_-4px_rgba(244,63,117,0.35),inset_0_1px_0_0_rgba(255,255,255,0.7)]',
    press: 'active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(190,24,93,0.4),0_3px_8px_-4px_rgba(244,63,117,0.35)]',
    hover: 'hover:-translate-y-[1px] hover:brightness-[1.05]',
  },
  ghost: {
    face: 'bg-transparent text-slate-500 dark:text-slate-400',
    edge: 'shadow-none',
    press: 'active:translate-y-[1px]',
    hover: 'hover:bg-slate-900/5 dark:hover:bg-white/10',
  },
}

function Key({ label, onPress, variant = 'digit', active = false, ariaLabel, className = '' }) {
  const v = VARIANT[variant] ?? VARIANT.digit

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      onClick={onPress}
      className={[
        'group relative flex items-center justify-center',
        'min-h-[48px] sm:min-h-[54px] lg:min-h-[62px] xl:min-h-[68px]',
        'rounded-2xl font-ui text-base sm:text-lg lg:text-xl font-medium select-none touch-manipulation',
        'border border-white/50 dark:border-white/5',
        'transition-[transform,filter,background-color] duration-100 ease-out',
        'focus-visible:outline-2 focus-visible:outline-rose-500 focus-visible:outline-offset-2',
        'cursor-pointer',
        v.face,
        v.edge,
        v.press,
        v.hover,
        // Active state for "2nd" / "DEG" toggle pills
        active && 'translate-y-[2px] brightness-105 ring-2 ring-rose-400/60',
        className,
      ].join(' ')}
    >
      {/* Top highlight — gives the bevel a sense of light source */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-1 h-px bg-white/60 dark:bg-white/15 rounded-full"
      />
      <span className="relative">{label}</span>
    </button>
  )
}

export default memo(Key)
