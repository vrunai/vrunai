import { useState, useRef } from 'react'
import type { AgentSpec, ProviderRef } from '@vrunai/types'
import { parseYamlText, EXAMPLES, PRESETS } from '@vrunai/core'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import type { SavedProvider } from '../lib/storage'
import markDarkSrc from '../assets/mark-dark.svg'
import markLightSrc from '../assets/mark-light.svg'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  openai:    '#10a37f',
  anthropic: '#d4742a',
  google:    '#4285f4',
  xai:       '#888',
  deepseek:  '#0066ff',
  mistral:   '#ff6b35',
  custom:    'var(--accent)',
}

function ProviderDot({ kind }: { kind: string }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: 8, height: 8, background: PROVIDER_COLORS[kind] ?? '#888' }}
    />
  )
}

// ── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({ onLoad }: { onLoad: (spec: AgentSpec, yaml: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleYaml(text: string) {
    try {
      const spec = parseYamlText(text)
      setError(null)
      onLoad(spec, text)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 1_000_000) { setError('File too large (max 1 MB)'); return }
    const reader = new FileReader()
    reader.onload = ev => handleYaml(ev.target?.result as string)
    reader.readAsText(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1_000_000) { setError('File too large (max 1 MB)'); return }
    const reader = new FileReader()
    reader.onload = ev => handleYaml(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <div
        className="w-full rounded-2xl p-14 text-center cursor-pointer transition-all duration-150"
        style={{
          maxWidth: 520,
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          background: dragging ? 'rgba(255,255,255,0.03)' : 'var(--bg-surface)',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div>
            <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Drop your YAML spec here</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Supports .yml and .yaml files</div>
          </div>
          <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Browse files
            </Button>
            <Button size="sm" onClick={() => setShowPaste(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
              Paste YAML
            </Button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".yml,.yaml" className="hidden" onChange={onFileChange} />
      </div>

      {error && (
        <div className="w-full max-w-xl rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <strong>Parse error:</strong> {error}
        </div>
      )}

      {/* Paste modal */}
      {showPaste && (
        <Modal title="Paste YAML spec" onClose={() => setShowPaste(false)}>
          <textarea
            className="w-full rounded-lg p-3 text-xs font-mono outline-none resize-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)', height: 300, lineHeight: 1.6 }}
            placeholder="agent:&#10;  name: My Agent&#10;  ..."
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowPaste(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { handleYaml(pasteText); setShowPaste(false) }}>Load spec</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── SpecPreview ───────────────────────────────────────────────────────────────

function SpecPreview({ spec, yaml }: { spec: AgentSpec; yaml: string }) {
  const [showInstruction, setShowInstruction] = useState(false)
  const [showYaml, setShowYaml] = useState(false)
  const [openScenario, setOpenScenario] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-4">
      {/* Agent info */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{spec.agent.name}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{spec.agent.description}</div>
        <button
          className="mt-2 text-xs flex items-center gap-1 transition-opacity"
          style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowInstruction(x => !x)}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {showInstruction ? 'Hide' : 'Show'} system prompt
        </button>
        {showInstruction && (
          <pre className="mt-2 text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {spec.agent.instruction}
          </pre>
        )}
      </div>

      {/* Tools */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Tools</div>
        <div className="flex flex-wrap gap-2">
          {spec.tools.map(t => (
            <span key={t.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* Flow */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Flow</div>
        <div className="flex items-center flex-wrap gap-1">
          {spec.flow.map((f, i) => (
            <div key={f.step} className="flex items-center gap-1">
              {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>}
              <span
                className="px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${f.condition ? 'var(--border-focus)' : 'var(--border)'}`,
                  color: f.condition ? 'var(--text-secondary)' : 'var(--text-primary)',
                  borderStyle: f.condition ? 'dashed' : 'solid',
                }}
              >
                {f.condition ? '◇' : ''}{f.step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          Scenarios ({spec.scenarios.length})
        </div>
        <div className="flex flex-col" style={{ background: 'var(--bg-surface)' }}>
          {spec.scenarios.map((s, i) => {
            const open = openScenario === s.name
            return (
              <div key={s.name} style={{ borderBottom: i < spec.scenarios.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setOpenScenario(open ? null : s.name)}
                >
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5"
                    style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.input}</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {s.expectedPath && s.expectedPath.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        {s.expectedPath.length} steps
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {s.expectedTools.length} tools
                    </span>
                  </div>
                </div>

                {/* Expanded body */}
                {open && (
                  <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                    {/* Input */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-1.5 mt-3" style={{ color: 'var(--text-muted)' }}>Input</div>
                      <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.6 }}>{s.input}</pre>
                    </div>

                    {/* Expected tools */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected tools</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.expectedTools.map(t => (
                          <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expected path */}
                    {s.expectedPath && s.expectedPath.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected path</div>
                        <div className="flex items-center flex-wrap gap-1">
                          {s.expectedPath.map((step, idx) => (
                            <div key={step} className="flex items-center gap-1">
                              {idx > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>}
                              <span className="px-2.5 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected outcome */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected outcome</div>
                      <div className="flex flex-col gap-1">
                        {Object.entries(s.expectedOutcome).map(([k, v]) => (
                          <div key={k} className="flex items-baseline gap-2 text-xs">
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Context */}
                    {s.context && Object.keys(s.context).length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Context</div>
                        <div className="flex flex-col gap-1">
                          {Object.entries(s.context).map(([k, v]) => (
                            <div key={k} className="flex items-baseline gap-2 text-xs">
                              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}:</span>
                              <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* YAML Source */}
      {yaml && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--bg-surface)', borderBottom: showYaml ? '1px solid var(--border)' : 'none' }}
          >
            <button
              className="text-xs flex items-center gap-1 transition-opacity"
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowYaml(x => !x)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {showYaml ? 'Hide' : 'Show'} YAML source
            </button>
            {showYaml && (
              <button
                className="text-xs transition-colors duration-150"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                onClick={() => navigator.clipboard.writeText(yaml)}
              >
                Copy
              </button>
            )}
          </div>
          {showYaml && (
            <pre
              className="overflow-auto text-xs p-4 font-mono leading-relaxed"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', maxHeight: 320, margin: 0 }}
            >{yaml}</pre>
          )}
        </div>
      )}
    </div>
  )
}

// ── RunConfig ─────────────────────────────────────────────────────────────────

export interface ProviderSelection {
  provider: SavedProvider
  model: string
}

// Toggle imported from shared UI component

interface MaxTurnsProps {
  maxTurns: number
  onMaxTurnsChange: (n: number) => void
}

interface RunConfigProps extends MaxTurnsProps {
  spec: AgentSpec
  providers: SavedProvider[]
  runsPerScenario: number
  onRunsChange: (n: number) => void
  onRun: (selections: ProviderSelection[]) => void
  onAddProvider: () => void
}

function RunConfig({ spec, providers, runsPerScenario, onRunsChange, maxTurns, onMaxTurnsChange, onRun, onAddProvider }: RunConfigProps) {
  const yamlProviders = spec.providers ?? []
  const hasYamlProviders = yamlProviders.length > 0

  // ── Mode A: YAML providers ──────────────────────────────────────────────────
  // selectedRefs: indices into yamlProviders that are toggled on
  const KNOWN_KINDS_INIT = new Set(['openai', 'anthropic', 'google'])
  const [selectedRefs, setSelectedRefs] = useState<Set<number>>(() => {
    const s = new Set<number>()
    yamlProviders.forEach((ref, i) => {
      const hasMatch = KNOWN_KINDS_INIT.has(ref.name)
        ? providers.some(p => p.kind === ref.name)
        : providers.some(p => p.kind === 'custom')
      if (hasMatch) s.add(i)
    })
    return s
  })

  // ── Mode B: manual providers ─────────────────────────────────────────────────
  // models keyed by provider.id
  const [manualModels, setManualModels] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const p of providers) {
      m[p.id] = PRESETS[p.kind as keyof typeof PRESETS]?.defaultModel ?? ''
    }
    return m
  })
  const [selectedManual, setSelectedManual] = useState<Set<string>>(
    () => new Set(providers.map(p => p.id))
  )

  // ── Helper: find saved provider matching a YAML ref ──────────────────────────
  const KNOWN_KINDS = new Set(['openai', 'anthropic', 'google'])

  function findSaved(ref: ProviderRef): SavedProvider | undefined {
    if (KNOWN_KINDS.has(ref.name)) {
      return providers.find(p => p.kind === ref.name)
    }
    // Custom/unknown provider: match by baseUrl, then by display name, then any custom
    return (
      providers.find(p => p.kind === 'custom' && !!ref.baseUrl && p.baseUrl === ref.baseUrl) ??
      providers.find(p => p.kind === 'custom' && p.name.toLowerCase() === ref.name.toLowerCase()) ??
      providers.find(p => p.kind === 'custom')
    )
  }

  // ── Build selections for onRun ────────────────────────────────────────────────
  function buildSelections(): ProviderSelection[] {
    if (hasYamlProviders) {
      return yamlProviders
        .filter((_, i) => selectedRefs.has(i))
        .map(ref => {
          const saved = findSaved(ref)!
          // YAML ref.baseUrl takes priority over the saved provider's baseUrl
          const provider = ref.baseUrl ? { ...saved, baseUrl: ref.baseUrl } : saved
          return { provider, model: ref.model }
        })
    }
    return providers
      .filter(p => selectedManual.has(p.id))
      .map(p => ({ provider: p, model: manualModels[p.id] ?? '' }))
  }

  const selections = buildSelections()
  const canRun = selections.length > 0 && selections.every(s => s.model.trim())
  const totalRuns = selections.length * spec.scenarios.length * runsPerScenario

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.375rem',
    padding: '3px 8px',
    fontSize: '0.75rem',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="flex flex-col gap-3" style={{ width: 296, minWidth: 296 }}>
      {/* Models / Providers panel */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          {hasYamlProviders ? 'Models (from YAML)' : 'Models'}
        </div>

        {/* Mode A: YAML-defined provider+model pairs */}
        {hasYamlProviders && (
          <div className="flex flex-col">
            {yamlProviders.map((ref, i) => {
              const saved = findSaved(ref)
              const configured = !!saved
              const on = selectedRefs.has(i) && configured
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{ borderBottom: i < yamlProviders.length - 1 ? '1px solid var(--border)' : 'none', opacity: configured ? 1 : 0.4 }}
                >
                  <ProviderDot kind={ref.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ref.model}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {configured ? ref.name : `${ref.name} (not configured)`}
                    </div>
                  </div>
                  <Toggle
                    on={on}
                    onChange={() => {
                      if (!configured) return
                      setSelectedRefs(prev => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i); else next.add(i)
                        return next
                      })
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Mode B: saved providers with model input */}
        {!hasYamlProviders && (
          <div className="flex flex-col">
            {providers.length === 0 ? (
              <div className="text-sm text-center py-2" style={{ color: 'var(--text-muted)' }}>No providers configured</div>
            ) : (
              providers.map(p => {
                const on = selectedManual.has(p.id)
                return (
                  <div key={p.id} className="py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <ProviderDot kind={p.kind} />
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <Toggle on={on} onChange={() => {
                        setSelectedManual(prev => {
                          const next = new Set(prev)
                          if (next.has(p.id)) next.delete(p.id); else next.add(p.id)
                          return next
                        })
                      }} />
                    </div>
                    {on && (
                      <input
                        type="text"
                        placeholder="Model (e.g. gpt-4o)"
                        value={manualModels[p.id] ?? ''}
                        onChange={e => setManualModels(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={inputStyle}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        <button
          className="w-full mt-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150"
          style={{ background: 'none', border: '1px dashed var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          onClick={onAddProvider}
        >+ Add provider</button>
      </div>

      {/* Runs */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Runs per scenario</div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center rounded-lg text-sm" onClick={() => onRunsChange(Math.max(1, runsPerScenario - 1))} style={{ width: 28, height: 28, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>−</button>
          <span className="text-sm font-semibold min-w-[20px] text-center" style={{ color: 'var(--text-primary)' }}>{runsPerScenario}</span>
          <button className="flex items-center justify-center rounded-lg text-sm" onClick={() => onRunsChange(Math.min(10, runsPerScenario + 1))} style={{ width: 28, height: 28, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>+</button>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Total: {totalRuns} runs</span>
        </div>
      </div>

      {/* Max turns */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Max turns per scenario</div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center rounded-lg text-sm" onClick={() => onMaxTurnsChange(Math.max(1, maxTurns - 1))} style={{ width: 28, height: 28, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>−</button>
          <span className="text-sm font-semibold min-w-[20px] text-center" style={{ color: 'var(--text-primary)' }}>{maxTurns}</span>
          <button className="flex items-center justify-center rounded-lg text-sm" onClick={() => onMaxTurnsChange(Math.min(50, maxTurns + 1))} style={{ width: 28, height: 28, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Run button */}
      <Button variant="primary" disabled={!canRun} onClick={() => onRun(selections)} className="w-full justify-center py-2.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Run Evaluation
      </Button>
    </div>
  )
}

// ── EvaluateScreen ────────────────────────────────────────────────────────────

interface Props {
  spec: AgentSpec | null
  providers: SavedProvider[]
  onLoad: (spec: AgentSpec) => void
  onRun: (selections: ProviderSelection[], runsPerScenario: number, maxTurns: number) => void
  onDemoRun: (spec: AgentSpec, demoLabel: string) => void
  onGoToProviders: () => void
  theme: 'dark' | 'light'
}

export function EvaluateScreen({ spec, providers, onLoad, onRun, onDemoRun, onGoToProviders, theme }: Props) {
  const [runsPerScenario, setRunsPerScenario] = useState(1)
  const [maxTurns, setMaxTurns] = useState(10)
  const [rawYaml, setRawYaml] = useState('')
  const [demoLabel, setDemoLabel] = useState<string | null>(null)

  function handleLoad(s: AgentSpec, yamlText?: string) {
    onLoad(s)
    setRunsPerScenario(s.scoring?.runs_per_scenario ?? 1)
    if (yamlText !== undefined) setRawYaml(yamlText)
    setDemoLabel(null)
  }

  function handleExampleLoad(yaml: string, label: string) {
    try {
      const s = parseYamlText(yaml)
      handleLoad(s, yaml)
      setDemoLabel(label)
    } catch { /* ignore */ }
  }

  // ── Empty state ──
  if (!spec) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 overflow-y-auto p-6">
        <div className="text-center flex flex-col items-center gap-3">
            <img src={theme === 'light' ? markDarkSrc : markLightSrc} width={80} height={80} alt="vrunai mark" />

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Validate &#38; Run AI Agents</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Load a YAML spec to benchmark across LLM providers</p>
        </div>

        <DropZone onLoad={handleLoad} />

        <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginTop: -4, maxWidth: 520 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            VRUNAI runs entirely in your browser. No backend, no data collection. API keys never leave your machine except to call the provider you selected.
          </span>
        </div>

        <div className="w-full max-w-[560px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try an example</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleExampleLoad(ex.yaml, ex.label)}
                  className="group relative text-left cursor-pointer rounded-xl p-4 transition-all duration-200"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--overlay-active)'
                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  <h4 className="text-sm font-semibold leading-snug mb-1.5 min-h-[2.5rem]" style={{ color: 'var(--text-primary)' }}>{ex.label}</h4>
                  <div className="flex flex-wrap gap-1 mb-3.5">
                    <span className="text-[11px] rounded px-1.5 py-0.5" style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>{ex.scenarios} scenarios</span>
                    <span className="text-[11px] rounded px-1.5 py-0.5" style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>{ex.tools} tools</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--green-accent)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M3 2l6 4-6 4V2z" fill="currentColor" />
                    </svg>
                    Run eval
                  </div>
                </button>
            ))}
          </div>
        </div>

        {/* CLI */}
        <div className="flex items-center gap-2 mt-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
          <span className="text-xs font-medium" style={{ background: 'linear-gradient(90deg, #00E5FF, #6338E0, #FF0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Also available as CLI:</span>
          <code className="text-xs px-2 py-0.5 rounded select-all" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>npm install -g vrunai</code>
        </div>
      </div>
    )
  }

  // ── Loaded state ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-12 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          <button className="text-xs font-medium transition-colors" style={{ color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '3px 10px', borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-focus)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            onClick={() => onLoad(null as unknown as AgentSpec)}
          >← Change</button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span>{spec.agent.name}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <SpecPreview spec={spec} yaml={rawYaml} />
          </div>
          {demoLabel ? (
            <div className="flex flex-col gap-3" style={{ width: 296, minWidth: 296 }}>
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Demo Mode</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  This example uses pre-recorded results. No API key or provider configuration needed.
                </p>
              </div>
              <Button variant="primary" onClick={() => onDemoRun(spec, demoLabel)} className="w-full justify-center py-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run Evaluation
              </Button>
            </div>
          ) : (
            <RunConfig
              spec={spec}
              providers={providers}
              runsPerScenario={runsPerScenario}
              onRunsChange={setRunsPerScenario}
              maxTurns={maxTurns}
              onMaxTurnsChange={setMaxTurns}
              onRun={(selections) => onRun(selections, runsPerScenario, maxTurns)}
              onAddProvider={onGoToProviders}
            />
          )}
        </div>
      </div>
    </div>
  )
}
