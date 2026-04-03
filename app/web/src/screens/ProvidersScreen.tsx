import { useState } from 'react'
import type { SavedProvider, ProviderKind } from '../lib/storage'
import { uid } from '@vrunai/core'

interface Props {
  providers: SavedProvider[]
  onAdd: (p: SavedProvider) => void
  onUpdate: (p: SavedProvider) => void
  onDelete: (id: string) => void
}

const KIND_OPTIONS: { value: ProviderKind; label: string; baseUrl: string }[] = [
  { value: 'openai',    label: 'OpenAI',    baseUrl: 'https://api.openai.com/v1' },
  { value: 'anthropic', label: 'Anthropic', baseUrl: 'https://api.anthropic.com' },
  { value: 'google',    label: 'Google',    baseUrl: 'https://generativelanguage.googleapis.com' },
  { value: 'xai',       label: 'xAI (Grok)',   baseUrl: 'https://api.x.ai/v1' },
  { value: 'deepseek',  label: 'DeepSeek',     baseUrl: 'https://api.deepseek.com/v1' },
  { value: 'mistral',   label: 'Mistral',      baseUrl: 'https://api.mistral.ai/v1' },
  { value: 'custom',    label: 'Custom (OpenAI-compatible)', baseUrl: 'http://localhost:11434/v1' },
]

const KIND_COLORS: Record<ProviderKind, string> = {
  openai:    '#10B981',
  anthropic: '#8B5CF6',
  google:    '#3B82F6',
  xai:       '#64748B',
  deepseek:  '#06B6D4',
  mistral:   '#F59E0B',
  custom:    '#64748B',
}

function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 6) + '••••' + key.slice(-4)
}

function ProviderForm({ initial, onSave, onCancel }: {
  initial?: SavedProvider
  onSave: (p: SavedProvider) => void
  onCancel: () => void
}) {
  const [kind, setKind]     = useState<ProviderKind>(initial?.kind ?? 'openai')
  const [name, setName]     = useState(initial?.name ?? '')
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? KIND_OPTIONS[0].baseUrl)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'err' | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  function handleKindChange(k: ProviderKind) {
    setKind(k)
    const opt = KIND_OPTIONS.find(o => o.value === k)!
    if (opt.baseUrl) setBaseUrl(opt.baseUrl)
    setTestResult(null)
    setTestError(null)
  }

  async function runTest(): Promise<void> {
    const url = kind === 'google'
      ? `${baseUrl}/v1beta/models`
      : kind === 'anthropic'
      ? `${baseUrl}/v1/models`
      : `${baseUrl}/models`
    const headers: Record<string, string> = kind === 'anthropic'
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
      : kind === 'google'
      ? { 'x-goog-api-key': apiKey }
      : { Authorization: `Bearer ${apiKey}` }
    const res = await fetch(url, { headers })
    if (!res.ok) {
      const msg = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(`${res.status}: ${msg}`)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    try {
      await runTest()
      setTestResult('ok')
    } catch (e) {
      setTestResult('err')
      setTestError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (kind !== 'custom' && !apiKey.trim()) return
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    let connected: boolean
    try {
      await runTest()
      connected = true
      setTestResult('ok')
    } catch (e) {
      connected = false
      setTestResult('err')
      setTestError(e instanceof Error ? e.message : 'Connection failed')
      setTesting(false)
      return  // keep form open on failure
    }
    setTesting(false)
    const displayName = name.trim() || KIND_OPTIONS.find(o => o.value === kind)!.label
    onSave({
      id:      initial?.id ?? uid(),
      kind,
      name:    displayName,
      apiKey:  apiKey.trim(),
      baseUrl: baseUrl.trim(),
      connected,
    })
  }

  const inputStyle = {
    background: 'var(--input-bg, var(--bg-surface))',
    border: '1px solid var(--input-border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  }

  return (
    <div className="rounded-xl border p-5 mt-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {initial ? 'Edit Provider' : 'Add Provider'}
      </h3>

      <div className="grid gap-4">
        {/* Kind */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Provider</label>
          <select
            value={kind}
            onChange={e => handleKindChange(e.target.value as ProviderKind)}
            style={{ ...inputStyle }}
          >
            {KIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={KIND_OPTIONS.find(o => o.value === kind)?.label}
            style={inputStyle}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={{ ...inputStyle, paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showKey ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder={kind === 'custom' ? 'http://localhost:11434/v1' : ''}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={handleTest}
          disabled={testing}
          className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult === 'ok' && (
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
            <span>✓</span> Connected
          </span>
        )}
        {testResult === 'err' && (
          <span className="text-xs" style={{ color: 'var(--red)' }}>
            {testError ?? 'Connection failed'}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(kind !== 'custom' && !apiKey.trim()) || testing}
            className="px-4 py-1.5 text-sm rounded-lg font-medium transition-colors"
            style={{ background: 'var(--btn-primary-bg)', color: '#FFFFFF', opacity: ((kind !== 'custom' && !apiKey.trim()) || testing) ? 0.5 : 1 }}
          >
            {testing ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderCard({ provider, onEdit, onDelete }: {
  provider: SavedProvider
  onEdit: () => void
  onDelete: () => void
}) {
  const color = KIND_COLORS[provider.kind]
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{provider.name}</div>
            <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>{provider.kind}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {provider.connected === true && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-success-bg)', color: 'var(--green)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              Connected
            </span>
          )}
          {provider.connected === false && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-error-bg)', color: 'var(--red)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
              Connection failed
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          {maskKey(provider.apiKey)}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onEdit}
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
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
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
          Delete
        </button>
      </div>
    </div>
  )
}

export function ProvidersScreen({ providers, onAdd, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<SavedProvider | null>(null)
  const [adding, setAdding] = useState(false)

  function handleSave(p: SavedProvider) {
    if (editing) {
      onUpdate(p)
      setEditing(null)
    } else {
      onAdd(p)
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-8 py-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Providers</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage your LLM API keys and endpoints</p>
          </div>
          {!adding && !editing && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--btn-primary-bg)', color: '#FFFFFF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add Provider
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Privacy notice */}
        <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" stroke="var(--green)" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M5.5 8l1.5 1.5L10.5 6" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            API keys are stored in your browser only - never sent to any server other than the provider APIs.
          </span>
        </div>

        {adding && (
          <div className="mb-6">
            <ProviderForm onSave={handleSave} onCancel={() => setAdding(false)} />
          </div>
        )}

        {providers.length === 0 && !adding ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-9-9M21 3l-9 9" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No providers yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Add an API key to start evaluating</p>
            <button
              onClick={() => setAdding(true)}
              className="px-4 py-2 text-sm rounded-lg font-medium"
              style={{ background: 'var(--btn-primary-bg)', color: '#FFFFFF' }}
            >
              Add Provider
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-4xl">
            {providers.map(p => (
              editing?.id === p.id ? (
                <div key={p.id} className="col-span-2">
                  <ProviderForm
                    initial={editing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  onEdit={() => setEditing(p)}
                  onDelete={() => onDelete(p.id)}
                />
              )
            ))}

            {/* Add card */}
            {!adding && !editing && (
              <button
                onClick={() => setAdding(true)}
                className="rounded-xl border-2 border-dashed p-5 flex items-center justify-center gap-2 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm">Add provider</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
