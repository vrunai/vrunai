import { useState } from 'react'
import type { AgentSpec, ComparisonResult, TraceEntry } from '@vrunai/types'
import { MetricBar } from '../components/ui/MetricBar'
import { FlowGraph } from '../components/FlowGraph'
import { ComparisonTable } from '../components/ComparisonTable'
import { fmtMs, fmtUsd, fmtPct, pctColor } from '@vrunai/core'

interface Props {
  spec: AgentSpec
  results: ComparisonResult[]
  savedAt?: string
  isDemoMode?: boolean
  onNewRun: () => void
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: color ?? 'var(--text-primary)' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</span>}
    </div>
  )
}

// ── Summary ────────────────────────────────────────────────────────────────────

function ResultsSummary({ results }: { results: ComparisonResult[] }) {
  const allMetrics = results.flatMap(r => r.metrics)

  // Best model by avg pass rate
  const modelRates = results.map(r => {
    const avg = r.metrics.length > 0
      ? r.metrics.reduce((s, m) => s + (m.path_accuracy + m.tool_accuracy + m.outcome_accuracy) / 3, 0) / r.metrics.length
      : 0
    return { model: r.model, avg }
  })
  const best = modelRates.sort((a, b) => b.avg - a.avg)[0]

  const avgPassRate = allMetrics.length > 0
    ? allMetrics.reduce((s, m) => s + (m.path_accuracy + m.tool_accuracy + m.outcome_accuracy) / 3, 0) / allMetrics.length
    : 0

  const avgLatency = allMetrics.length > 0
    ? allMetrics.reduce((s, m) => s + m.avg_latency_ms, 0) / allMetrics.length
    : 0

  const totalCost = allMetrics.reduce((s, m) => s + m.total_cost_usd, 0)

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <StatCard label="Best Model" value={best?.model ?? '—'} sub={best ? fmtPct(best.avg) + ' avg pass' : undefined} color="var(--accent)" />
      <StatCard label="Avg Pass Rate" value={fmtPct(avgPassRate)} color={pctColor(avgPassRate)} />
      <StatCard label="Avg Latency" value={fmtMs(avgLatency)} />
      <StatCard label="Total Cost" value={fmtUsd(totalCost)} />
    </div>
  )
}

// ── Model Card ─────────────────────────────────────────────────────────────────

function ModelComparisonCard({ result }: { result: ComparisonResult }) {
  const metrics = result.metrics
  if (!metrics.length) return null

  const avg = (fn: (m: typeof metrics[0]) => number) =>
    metrics.reduce((s, m) => s + fn(m), 0) / metrics.length

  const pathAcc = avg(m => m.path_accuracy)
  const toolAcc = avg(m => m.tool_accuracy)
  const outAcc  = avg(m => m.outcome_accuracy)
  const cons    = avg(m => m.consistency)
  const lat     = avg(m => m.avg_latency_ms)
  const cost    = metrics.reduce((s, m) => s + m.total_cost_usd, 0)

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{result.model}</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          {fmtMs(lat)} · {fmtUsd(cost)}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <MetricBar label="Path Accuracy" value={pathAcc} />
        <MetricBar label="Tool Accuracy" value={toolAcc} />
        <MetricBar label="Outcome Accuracy" value={outAcc} />
        <MetricBar label="Consistency" value={cons} />
      </div>
    </div>
  )
}

// ── Trace Step ─────────────────────────────────────────────────────────────────

function TraceStepRow({ entry }: { entry: TraceEntry }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-l-2 pl-3 mb-2" style={{ borderColor: 'var(--border)' }}>
      <button
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px]" style={{ borderColor: 'var(--border-focus)', color: 'var(--text-secondary)' }}>
          {entry.turn}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{entry.step}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>→ {entry.toolName}</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{fmtMs(entry.durationMs)}</span>
        <svg
          className="w-3 h-3 transition-transform"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Input</div>
            <pre className="text-xs p-2 rounded overflow-auto max-h-32" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {JSON.stringify(entry.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Output</div>
            <pre className="text-xs p-2 rounded overflow-auto max-h-32" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {JSON.stringify(entry.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Match Row ──────────────────────────────────────────────────────────────────

function MatchRow({ label, expected, actual, match }: {
  label: string
  expected: string
  actual: string
  match: boolean
}) {
  return (
    <div className="flex items-start gap-3 text-xs py-1.5 border-b" style={{ borderColor: 'var(--bg-muted)' }}>
      <span className="w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="flex-1 font-mono" style={{ color: 'var(--text-secondary)' }}>{expected}</span>
      <span
        className="flex-1 font-mono"
        style={{ color: match ? 'var(--green)' : 'var(--red)' }}
      >
        {actual}
      </span>
      <span style={{ color: match ? 'var(--green)' : 'var(--red)' }}>
        {match ? '✓' : '✗'}
      </span>
    </div>
  )
}

// ── Scenario Detail ────────────────────────────────────────────────────────────

function ScenarioDetail({ spec, scenario, results }: {
  spec: AgentSpec
  scenario: AgentSpec['scenarios'][0]
  results: ComparisonResult[]
}) {
  return (
    <div className="px-6 py-4" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
      {/* Input */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Input</div>
        <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
          {scenario.input}
        </div>
      </div>

      {/* Traces per model */}
      <div className={`grid gap-6 ${results.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {results.map(result => {
          const scenMetrics = result.metrics.find(m => m.scenarioName === scenario.name)
          if (!scenMetrics) return null
          const run = scenMetrics.runs[0]
          if (!run) return null

          return (
            <div key={result.model}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{result.model}</span>
              </div>

              {/* Flow Graph */}
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <FlowGraph flow={spec.flow} trace={run.trace} scenario={scenario} />
              </div>

              {/* Trace */}
              <div className="mb-4">
                {run.trace.map((entry, i) => (
                  <TraceStepRow key={i} entry={entry} />
                ))}
              </div>

              {/* Match rows */}
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-[5rem_1fr_1fr_1rem] gap-3 px-3 py-1.5 text-[10px] uppercase tracking-wider" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <span>Check</span><span>Expected</span><span>Actual</span><span />
                </div>
                <div className="px-3">
                  <MatchRow
                    label="Path"
                    expected={scenario.expectedPath?.join(' → ') ?? '—'}
                    actual={run.actualPath.join(' → ')}
                    match={run.pathMatch}
                  />
                  <MatchRow
                    label="Tools"
                    expected={scenario.expectedTools.join(', ')}
                    actual={run.actualTools.join(', ')}
                    match={run.toolMatch}
                  />
                  <MatchRow
                    label="Outcome"
                    expected={JSON.stringify(scenario.expectedOutcome)}
                    actual={JSON.stringify(run.finalOutput)}
                    match={run.outcomeMatch}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Scenario Table ─────────────────────────────────────────────────────────────

function ScenarioTable({ spec, results }: { spec: AgentSpec; results: ComparisonResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-5 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Scenario
            </th>
            {results.map(r => (
              <th key={r.model} className="text-center px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {r.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.scenarios.map(scenario => {
            const isExpanded = expanded === scenario.name
            return (
              <>
                <tr
                  key={scenario.name}
                  className="cursor-pointer border-b transition-colors"
                  style={{ borderColor: 'var(--border)', background: isExpanded ? 'var(--bg-elevated)' : 'transparent' }}
                  onClick={() => setExpanded(isExpanded ? null : scenario.name)}
                  onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}
                  onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3.5 h-3.5 transition-transform shrink-0"
                        style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        viewBox="0 0 12 12" fill="none"
                      >
                        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{scenario.name}</span>
                    </div>
                  </td>
                  {results.map(result => {
                    const m = result.metrics.find(m => m.scenarioName === scenario.name)
                    if (!m) return <td key={result.model} className="text-center px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>—</td>
                    const pass = (m.path_accuracy + m.tool_accuracy + m.outcome_accuracy) / 3
                    return (
                      <td key={result.model} className="text-center px-4 py-3">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: pctColor(pass) }}>
                          {fmtPct(pass)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
                {isExpanded && (
                  <tr key={`${scenario.name}-detail`}>
                    <td colSpan={results.length + 1} style={{ padding: 0 }}>
                      <ScenarioDetail spec={spec} scenario={scenario} results={results} />
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Results Screen ─────────────────────────────────────────────────────────────

export function ResultsScreen({ spec, results, isDemoMode, onNewRun }: Props) {
  function downloadJson() {
    const blob = new Blob([JSON.stringify({ spec, results }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${spec.agent.name.replace(/\s+/g, '_')}_results.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-8 py-4" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.agent.name}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{results.length} model{results.length !== 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{spec.scenarios.length} scenario{spec.scenarios.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors"
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3M3 11v2h10v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download JSON
            </button>
            <button
              onClick={onNewRun}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium"
              style={{ background: 'var(--btn-primary-bg)', color: '#FFFFFF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg)' }}
            >
              New Run
            </button>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {isDemoMode && (
        <div className="px-8 py-2.5" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Demo mode &middot; No API key required
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <ResultsSummary results={results} />

        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Model Comparison
        </h2>
        <div className={`grid gap-4 mb-8 ${results.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-lg'}`}>
          {results.map(r => <ModelComparisonCard key={r.model} result={r} />)}
        </div>

        {results.length >= 2 && (
          <div className="mb-8">
            <ComparisonTable results={results} />
          </div>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Scenarios
        </h2>
        <ScenarioTable spec={spec} results={results} />
      </div>
    </div>
  )
}
