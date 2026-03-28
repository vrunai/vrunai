import { pctColor, fmtPct } from '@vrunai/core'

interface Props {
  label: string
  value: number // 0–1
}

export function MetricBar({ label, value }: Props) {
  const color = pctColor(value)
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums" style={{ color }}>
        {fmtPct(value)}
      </span>
    </div>
  )
}
