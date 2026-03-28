import React from 'react'
import type { ComparisonResult } from '@vrunai/types'
import { fmtPct, fmtUsd, pctColor } from '@vrunai/core'

interface Props {
  results: ComparisonResult[]
}

export function ComparisonTable({ results }: Props) {
  if (results.length < 2) return null

  const scenarioNames = results[0].metrics.map(m => m.scenarioName)

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Model Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ color: 'var(--text-soft)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Scenario</th>
              {results.map(r => (
                <th key={r.model} className="text-center px-3 py-2 font-medium" colSpan={2} style={{ color: 'var(--code-cyan)' }}>
                  {r.model.length > 20 ? r.model.slice(0, 18) + '…' : r.model}
                </th>
              ))}
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th />
              {results.map(r => (
                <React.Fragment key={r.model}>
                  <th className="text-center px-2 py-1 font-normal" style={{ color: 'var(--text-muted)' }}>path</th>
                  <th className="text-center px-2 py-1 font-normal" style={{ color: 'var(--text-muted)' }}>outcome</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarioNames.map(name => (
              <tr key={name} style={{ borderBottom: '1px solid var(--bg-muted)' }}>
                <td className="px-3 py-1.5" style={{ color: 'var(--text-soft)' }}>{name}</td>
                {results.map(r => {
                  const m = r.metrics.find(x => x.scenarioName === name)
                  if (!m) return <React.Fragment key={r.model}><td /><td /></React.Fragment>
                  return (
                    <React.Fragment key={r.model}>
                      <td className="text-center px-2 py-1.5 font-mono" style={{ color: pctColor(m.path_accuracy) }}>
                        {fmtPct(m.path_accuracy)}
                      </td>
                      <td className="text-center px-2 py-1.5 font-mono" style={{ color: pctColor(m.outcome_accuracy) }}>
                        {fmtPct(m.outcome_accuracy)}
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-3 py-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>Average</td>
              {results.map(r => {
                const avgPath = r.metrics.reduce((s, m) => s + m.path_accuracy, 0) / r.metrics.length
                const avgOutcome = r.metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / r.metrics.length
                return (
                  <React.Fragment key={r.model}>
                    <td className="text-center px-2 py-1.5 font-mono font-semibold" style={{ color: pctColor(avgPath) }}>
                      {fmtPct(avgPath)}
                    </td>
                    <td className="text-center px-2 py-1.5 font-mono font-semibold" style={{ color: pctColor(avgOutcome) }}>
                      {fmtPct(avgOutcome)}
                    </td>
                  </React.Fragment>
                )
              })}
            </tr>
            <tr style={{ borderTop: '1px solid var(--bg-muted)' }}>
              <td className="px-3 py-1.5" style={{ color: 'var(--text-muted)' }}>Cost</td>
              {results.map(r => {
                const total = r.metrics.reduce((s, m) => s + m.total_cost_usd, 0)
                return (
                  <td key={r.model} className="text-center px-2 py-1.5 font-mono" colSpan={2} style={{ color: 'var(--text-muted)' }}>
                    {fmtUsd(total)}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
