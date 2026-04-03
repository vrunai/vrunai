import type { RunningSnapshot, RunProgress } from '../hooks/useAppState'

interface Props {
  runs: RunningSnapshot[]
  onSelect: (id: string) => void
  onCancel: (id: string) => void
}

function progressStats(progress: RunProgress) {
  let done = 0, total = 0
  for (const model of Object.values(progress)) {
    for (const status of Object.values(model)) {
      total++
      if (status === 'done' || status === 'error') done++
    }
  }
  return { done, total }
}

function RunCard({ run, onSelect, onCancel }: { run: RunningSnapshot; onSelect: (id: string) => void; onCancel: (id: string) => void }) {
  const models = Object.keys(run.progress)
  const { done, total } = progressStats(run.progress)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      onClick={() => onSelect(run.id)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        width: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-focus)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {run.spec.agent.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {total > 0 ? `${done} / ${total} scenarios` : 'Starting…'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onCancel(run.id) }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--brand-gradient-subtle)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Models */}
      <div className="flex flex-wrap gap-1.5">
        {models.length === 0
          ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Initialising…</span>
          : models.map(m => (
            <span key={m} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              background: 'var(--bg-muted)', color: 'var(--text-secondary)', fontFamily: 'monospace',
            }}>
              {m}
            </span>
          ))
        }
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        Click to open →
      </div>
    </button>
  )
}

export function RunningOverviewScreen({ runs, onSelect, onCancel }: Props) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-8 py-4" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Running Evaluations
          </h1>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
            background: 'var(--brand-muted)', color: 'var(--accent)', fontWeight: 600,
          }}>
            {runs.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '24px 32px', maxWidth: 900 }}>
        {runs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', paddingTop: 48 }}>
            No evaluations running
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {runs.map(run => (
              <RunCard key={run.id} run={run} onSelect={onSelect} onCancel={onCancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
