import React, { useState, useMemo } from 'react'
import { getAllModels, formatContextWindow, fmtUsd, type ModelConfig } from '@vrunai/core'

const PROVIDER_COLORS: Record<string, string> = {
  openai:    '#22c55e',
  anthropic: '#f59e0b',
  google:    '#3b82f6',
  mistral:   '#8b5cf6',
  meta:      '#ef4444',
}

function providerColor(provider: string): string {
  const key = provider.toLowerCase()
  for (const [k, v] of Object.entries(PROVIDER_COLORS)) {
    if (key.includes(k)) return v
  }
  return 'var(--text-secondary)'
}

function ProviderBadge({ provider }: { provider: string }) {
  const color = providerColor(provider)
  const label = provider.charAt(0).toUpperCase() + provider.slice(1)
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </span>
  )
}

export function ModelsScreen() {
  const models = getAllModels()
  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const providers = useMemo(() => {
    const set = new Set(models.map(m => m.provider))
    return Array.from(set).sort()
  }, [models])

  const filtered = useMemo(() => {
    return models.filter(m => {
      if (filterProvider && m.provider !== filterProvider) return false
      if (search) {
        const q = search.toLowerCase()
        if (!m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [models, search, filterProvider])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-8 py-4" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg border"
              style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none', width: '14rem' }}
            />
          </div>

          {/* Provider filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterProvider(null)}
              className="px-3 py-1 text-xs rounded-full border transition-colors"
              style={{
                borderColor: !filterProvider ? 'var(--accent)' : 'var(--border)',
                color: !filterProvider ? 'var(--accent)' : 'var(--text-muted)',
                background: !filterProvider ? 'var(--overlay-active)' : 'transparent',
              }}
            >
              All
            </button>
            {providers.map(p => (
              <button
                key={p}
                onClick={() => setFilterProvider(p === filterProvider ? null : p)}
                className="px-3 py-1 text-xs rounded-full border transition-colors capitalize"
                style={{
                  borderColor: filterProvider === p ? providerColor(p) : 'var(--border)',
                  color: filterProvider === p ? providerColor(p) : 'var(--text-muted)',
                  background: filterProvider === p ? providerColor(p) + '1a' : 'transparent',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} models</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-base)' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Model', 'Provider', 'Input $/1M', 'Output $/1M', 'Context', 'Tools', 'Vision'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m: ModelConfig) => (
              <React.Fragment key={m.id}>
              <tr
                className="border-b transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--bg-muted)',
                  opacity: m.deprecated ? 0.4 : 1,
                  background: selectedModel === m.id ? 'var(--bg-surface)' : 'transparent',
                }}
                onClick={() => setSelectedModel(selectedModel === m.id ? null : m.id)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}
                onMouseLeave={e => { if (selectedModel !== m.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                    {m.deprecated && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>deprecated</span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>{m.id}</div>
                </td>
                <td className="px-6 py-3">
                  <ProviderBadge provider={m.provider} />
                </td>
                <td className="px-6 py-3 text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {fmtUsd(m.pricing.input_per_1m_tokens)}
                </td>
                <td className="px-6 py-3 text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {fmtUsd(m.pricing.output_per_1m_tokens)}
                </td>
                <td className="px-6 py-3 text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {formatContextWindow(m.context_window)}
                </td>
                <td className="px-6 py-3">
                  {m.supports_tools ? (
                    <span style={{ color: 'var(--green)' }}>✓</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {m.supports_vision ? (
                    <span style={{ color: 'var(--green)' }}>✓</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
              {selectedModel === m.id && (
                <tr>
                  <td colSpan={7} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Full ID</div>
                        <div className="font-mono" style={{ color: 'var(--text-primary)' }}>{m.id}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Provider</div>
                        <div style={{ color: 'var(--text-primary)' }}>{m.provider}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Context Window</div>
                        <div style={{ color: 'var(--text-primary)' }}>{formatContextWindow(m.context_window)} tokens</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Input Pricing</div>
                        <div style={{ color: 'var(--text-primary)' }}>{fmtUsd(m.pricing.input_per_1m_tokens)} / 1M tokens</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Output Pricing</div>
                        <div style={{ color: 'var(--text-primary)' }}>{fmtUsd(m.pricing.output_per_1m_tokens)} / 1M tokens</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Capabilities</div>
                        <div className="flex gap-3" style={{ color: 'var(--text-primary)' }}>
                          <span>{m.supports_tools ? '✓' : '✗'} Tools</span>
                          <span>{m.supports_vision ? '✓' : '✗'} Vision</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
