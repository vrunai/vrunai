import { useState } from 'react'
import type { AgentSpec } from '@vrunai/types'
import type { RunProgress } from '../hooks/useAppState'

interface Props {
  spec: AgentSpec
  progress: RunProgress
  cancelFn: (() => void) | null
  error?: string
  onGoBack?: () => void
}

type Status = 'queued' | 'running' | 'done' | 'error'

function StatusDot({ status }: { status: Status }) {
  if (status === 'done') {
    return <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--green)' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#22c55e22"/><path d="M4 7l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      pass
    </span>
  }
  if (status === 'error') {
    return <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--red)' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#ef444422"/><path d="M5 5l4 4M9 5l-4 4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
      fail
    </span>
  }
  if (status === 'running') {
    return <span className="flex items-center gap-1.5 text-xs font-medium animate-pulse" style={{ color: 'var(--accent)' }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
      running...
    </span>
  }
  return <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
    <span className="w-2 h-2 rounded-full border inline-block" style={{ borderColor: 'var(--text-muted)' }} />
    queued
  </span>
}

function ProviderPanel({ model, scenarioStatuses, scenarios }: {
  model: string
  scenarioStatuses: Record<string, Status>
  scenarios: AgentSpec['scenarios']
}) {
  const total = scenarios.length
  const done = Object.values(scenarioStatuses).filter(s => s === 'done' || s === 'error').length
  const pct = total > 0 ? done / total : 0

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{model}</span>
          </div>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{done}/{total}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct * 100}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Scenario rows */}
      <div className="divide-y divide-[var(--border)]">
        {scenarios.map(s => {
          const status: Status = scenarioStatuses[s.name] ?? 'queued'
          return (
            <div key={s.name} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: status === 'queued' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {s.name}
              </span>
              <StatusDot status={status} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RunningScreen({ spec, progress, cancelFn, error, onGoBack }: Props) {
  const [cancelling, setCancelling] = useState(false)
  const models = Object.keys(progress)
  // Collect all models from progress, even if they haven't started yet
  // Models without any progress entry are considered queued
  const allModels = models.length > 0 ? models : []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-8 py-4" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Evaluation</span>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--text-primary)' }}>{spec.agent.name}</span>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--accent)' }}>Running...</span>
          </div>
          {cancelling ? (
            <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#2a2a32" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#8b8b9a" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Cancelling…
            </div>
          ) : (
            <button
              onClick={() => { cancelFn?.(); setCancelling(true) }}
              disabled={!cancelFn}
              className="px-4 py-2 text-sm rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                if (cancelFn) {
                  e.currentTarget.style.borderColor = 'var(--red)'
                  e.currentTarget.style.color = 'var(--red)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-8 mt-4 rounded-xl border overflow-hidden" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.35)' }}>
          <div className="px-5 py-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-1.5" style={{ color: 'var(--red)' }}>Evaluation failed</div>
              <pre className="text-xs overflow-auto" style={{ color: 'var(--red-light)', maxHeight: 140, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{error}</pre>
            </div>
            <button
              onClick={onGoBack}
              className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(239,68,68,0.4)', color: 'var(--red)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {allModels.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#2a2a32" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span className="text-sm">Initializing...</span>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${allModels.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
            {allModels.map(model => (
              <ProviderPanel
                key={model}
                model={model}
                scenarioStatuses={progress[model] ?? {}}
                scenarios={spec.scenarios}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
