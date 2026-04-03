import type { Flow, Scenario, TraceEntry } from '@vrunai/types'
import { fmtMs } from '@vrunai/core'
import { useState } from 'react'

interface Props {
  flow: Flow[]
  trace: TraceEntry[]
  scenario: Scenario
}

export function FlowGraph({ flow, trace, scenario }: Props) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Flow</span>
      {flow.map((f, i) => {
        const entry = trace.find(t => t.step === f.step)
        const expected = scenario.expectedPath?.includes(f.step) ?? false
        const color = entry
          ? (expected ? 'var(--green)' : 'var(--yellow)')
          : (expected ? 'var(--red)' : 'var(--text-faint)')
        const isExpanded = expandedStep === f.step

        return (
          <div key={f.step} className="flex flex-col">
            {i > 0 && (
              <div className="pl-3" style={{ color: 'var(--text-muted)' }}>│</div>
            )}
            <button
              className="flex items-center gap-2 pl-2 text-left hover:bg-white/5 rounded py-0.5 transition-colors"
              onClick={() => setExpandedStep(isExpanded ? null : f.step)}
            >
              <span style={{ color: 'var(--text-muted)' }}>▼</span>
              <span style={{ color, fontWeight: entry ? 600 : 400 }}>[{f.step}]</span>
              {f.tool && <span style={{ color: 'var(--text-muted)' }}>→ {f.tool}</span>}
              {entry && (
                <span style={{ color: 'var(--green)' }}>✓ t{entry.turn} {fmtMs(entry.durationMs)}</span>
              )}
              {!entry && expected && (
                <span style={{ color: 'var(--red)' }}>✗ not called</span>
              )}
              {!entry && !expected && (
                <span style={{ color: 'var(--text-muted)' }}>· skipped</span>
              )}
            </button>
            {isExpanded && entry && (
              <div className="pl-8 flex flex-col gap-0.5 pb-1" style={{ color: 'var(--text-muted)' }}>
                <div className="text-xs">
                  <span className="opacity-60">in: </span>
                  {Object.entries(entry.input).map(([k, v]) => (
                    <span key={k} className="mr-2">{k}: <span style={{ color: 'var(--code-cyan)' }}>{JSON.stringify(v)}</span></span>
                  )) || '—'}
                </div>
                <div className="text-xs">
                  <span className="opacity-60">out: </span>
                  {Object.entries(entry.output).map(([k, v]) => (
                    <span key={k} className="mr-2">{k}: <span style={{ color: 'var(--code-cyan)' }}>{JSON.stringify(v)}</span></span>
                  )) || '—'}
                </div>
              </div>
            )}
            {f.condition && (
              <div className="pl-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                if {f.condition.if} → then: {f.condition.then} else: {f.condition.else}
              </div>
            )}
          </div>
        )
      })}
      {/* Unexpected tool calls */}
      {trace.filter(t => t.step === '?').map((t, i) => (
        <div key={`unexpected-${i}`} className="flex flex-col">
          <div className="pl-3" style={{ color: 'var(--text-muted)' }}>│</div>
          <div className="flex items-center gap-2 pl-2">
            <span style={{ color: 'var(--text-muted)' }}>▼</span>
            <span style={{ color: 'var(--red)' }}>[?]</span>
            <span style={{ color: 'var(--code-purple)' }}>{t.toolName}</span>
            <span style={{ color: 'var(--red)' }}>✗ unexpected</span>
          </div>
        </div>
      ))}
    </div>
  )
}
