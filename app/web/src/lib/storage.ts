import type { ComparisonResult } from '@vrunai/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProviderKind = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom'

export interface SavedProvider {
  id: string
  kind: ProviderKind
  name: string
  apiKey: string
  baseUrl: string
  connected?: boolean  // undefined = never tested, true = ok, false = failed
}

export interface HistoryEntry {
  id: string
  agentName: string
  savedAt: string // ISO string
  results: ComparisonResult[]
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
  PROVIDERS: 'vrunai:providers',
  HISTORY:   'vrunai:history',
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn(`VRUNAI: failed to write "${key}" to localStorage (quota exceeded?). Data will not persist.`)
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

export function loadProviders(): SavedProvider[] {
  return read<SavedProvider[]>(KEYS.PROVIDERS, [])
}

export function saveProvider(p: SavedProvider): void {
  const list = loadProviders()
  const idx  = list.findIndex(x => x.id === p.id)
  if (idx >= 0) list[idx] = p
  else list.push(p)
  write(KEYS.PROVIDERS, list)
}

export function deleteProvider(id: string): void {
  write(KEYS.PROVIDERS, loadProviders().filter(p => p.id !== id))
}

// ── History ───────────────────────────────────────────────────────────────────

export function loadHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(KEYS.HISTORY, [])
}

export function appendHistory(entry: HistoryEntry): void {
  const list = loadHistory()
  list.unshift(entry) // newest first
  // keep last 50 runs
  write(KEYS.HISTORY, list.slice(0, 50))
}

export function deleteHistoryEntry(id: string): void {
  write(KEYS.HISTORY, loadHistory().filter(e => e.id !== id))
}

export function clearHistory(): void {
  write(KEYS.HISTORY, [])
}
