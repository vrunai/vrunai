import type { HistoryEntry } from '../lib/storage'
import type { ComparisonResult } from '@vrunai/types'
import { fmtDate, fmtPct, pctColor } from '@vrunai/core'

interface Props {
  history: HistoryEntry[]
  onOpen: (entry: HistoryEntry) => void
  onDelete: (id: string) => void
  onClear: () => void
}

function avgPassRate(result: ComparisonResult): number {
  if (!result.metrics.length) return 0
  const total = result.metrics.reduce((s, m) => s + (m.path_accuracy + m.tool_accuracy + m.outcome_accuracy) / 3, 0)
  return total / result.metrics.length
}

function HistoryItem({ entry, onOpen, onDelete }: {
  entry: HistoryEntry
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="rounded-xl border p-5 cursor-pointer transition-colors group"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      onClick={onOpen}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{entry.agentName}</span>
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{fmtDate(entry.savedAt)}</div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {entry.results.length} model{entry.results.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {entry.results[0]?.metrics.length ?? 0} scenario{(entry.results[0]?.metrics.length ?? 0) !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <div className="flex items-center gap-2 flex-wrap">
              {entry.results.map(r => {
                const rate = avgPassRate(r)
                return (
                  <span key={r.model} className="text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{r.model} </span>
                    <span className="font-semibold tabular-nums" style={{ color: pctColor(rate) }}>{fmtPct(rate)}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={onOpen}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-focus)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            }}
          >
            Open
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3h10M5 3V2h4v1M6 6v4M8 6v4M3 3l1 9h6l1-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export function HistoryScreen({ history, onOpen, onDelete, onClear }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-8 py-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {history.length} saved evaluation{history.length !== 1 ? 's' : ''}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#52525f" strokeWidth="1.5"/>
                <path d="M12 7v5l3 3" stroke="#52525f" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No evaluations yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Completed runs will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl">
            {history.map(entry => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onOpen={() => onOpen(entry)}
                onDelete={() => onDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
