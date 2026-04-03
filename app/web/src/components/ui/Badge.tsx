import { pctColor } from '@vrunai/core'

type Variant = 'pass' | 'fail' | 'partial' | 'accent' | 'muted'

interface Props {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const STYLES: Record<Variant, { bg: string; color: string }> = {
  pass:    { bg: 'var(--color-success-bg)', color: 'var(--green)' },
  fail:    { bg: 'var(--color-error-bg)',   color: 'var(--red)' },
  partial: { bg: 'var(--color-warning-bg)', color: 'var(--yellow)' },
  accent:  { bg: 'var(--overlay-active)',   color: 'var(--accent)' },
  muted:   { bg: 'var(--bg-subtle)',        color: 'var(--text-secondary)' },
}

export function Badge({ variant = 'muted', children, className = '' }: Props) {
  const s = STYLES[variant]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ background: s.bg, color: s.color }}
    >
      {children}
    </span>
  )
}

export function PassBadge({ value }: { value: number }) {
  const color  = pctColor(value)
  const bg     = color === '#9ece6a' ? 'rgba(158,206,106,0.10)'
               : color === '#7aa2f7' ? 'rgba(122,162,247,0.10)'
               : color === '#e0af68' ? 'rgba(224,175,104,0.10)'
               : 'rgba(247,118,142,0.10)'
  const label  = value >= 0.9 ? '✓' : value >= 0.7 ? '●' : value >= 0.5 ? '~' : '✗'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {label} {Math.round(value * 100)}%
    </span>
  )
}
