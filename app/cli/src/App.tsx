import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ScenarioRunner, makeProvider as coreProvider, PRESETS as CORE_PRESETS, parseYamlText, EXAMPLES, testConnection, DEMO_RESULTS } from '@vrunai/core';
import { parse, saveResults, autoSaveToHistory, loadModelConfig, validateUserModelConfig } from '@vrunai/core/node';
import type { AgentSpec, ScenarioMetrics, ProviderRef, Scenario, Flow, TraceEntry } from '@vrunai/types';
import type { ModelConfig, Provider, ProviderKind } from '@vrunai/core';
import { Logo } from './components/Logo.js';
import { loadConfig, addProvider, deleteProvider, addRecentPath, type SavedProvider } from './config.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
    | { kind: 'menu' }
    // ── LLM Provider management ──────────────────────────────────────────────
    | { kind: 'providers-list' }
    | { kind: 'providers-detail'; providerName: string; providerIndex: number }
    | { kind: 'providers-preset-select' }
    | { kind: 'providers-form'; preset: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom';
        fields: { name: string; apiKey: string; model: string; baseUrl: string };
        activeField: number }
    // ── Evaluate ─────────────────────────────────────────────────────────────
    | { kind: 'example-select' }
    | { kind: 'input'; value: string; error?: string }
    | { kind: 'provider-select'; spec: AgentSpec; specPath: string }
    | { kind: 'running'; spec: AgentSpec; providers: Provider[] }
    | { kind: 'results'; spec: AgentSpec; results: { model: string; metrics: ScenarioMetrics[] }[]; savedAt?: string; isDemoMode?: boolean }
    // ── Models ───────────────────────────────────────────────────────────────
    | { kind: 'models-list' }
    | { kind: 'models-detail'; modelId: string }
    // ── History ──────────────────────────────────────────────────────────────
    | { kind: 'history' }
    // ── About ────────────────────────────────────────────────────────────────
    | { kind: 'about' };

type ScenarioProgress = { done: number; total: number };

export type AppProps = Record<string, never>;

// ── Provider presets ──────────────────────────────────────────────────────────

const PRESETS = {
    openai:    { label: 'OpenAI',    baseUrl: 'https://api.openai.com/v1',                 defaultModel: 'gpt-4.1-mini' },
    anthropic: { label: 'Anthropic', baseUrl: 'https://api.anthropic.com',                 defaultModel: 'claude-sonnet-4-6' },
    google:    { label: 'Google',    baseUrl: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-2.0-flash' },
    xai:       { label: 'xAI',      baseUrl: 'https://api.x.ai/v1',                      defaultModel: 'grok-3-mini' },
    deepseek:  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1',              defaultModel: 'deepseek-chat' },
    mistral:   { label: 'Mistral',  baseUrl: 'https://api.mistral.ai/v1',                defaultModel: 'mistral-small-latest' },
    custom:    { label: 'Custom',    baseUrl: '',                                          defaultModel: '' },
} as const;

// ── Spinner ───────────────────────────────────────────────────────────────────

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function useSpinner(): string {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 80);
        return () => clearInterval(id);
    }, []);
    return FRAMES[frame];
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function Bar({ done, total, width = 20 }: { done: number; total: number; width?: number }) {
    const filled = total > 0 ? Math.round((done / total) * width) : 0;
    return (
        <Text>
            <Text color="green">{'█'.repeat(filled)}</Text>
            <Text dimColor>{'░'.repeat(width - filled)}</Text>
        </Text>
    );
}

// ── Scenario row ──────────────────────────────────────────────────────────────

function ScenarioRow({ name, progress, spinner }: { name: string; progress: ScenarioProgress; spinner: string }) {
    const { done, total } = progress;
    const finished = done >= total;
    const started  = done > 0;

    const statusIcon = finished ? (
        <Text color="green">✓</Text>
    ) : started ? (
        <Text color="yellow">{spinner}</Text>
    ) : (
        <Text dimColor>·</Text>
    );

    return (
        <Box gap={1}>
            <Box width={2}>{statusIcon}</Box>
            <Box width={32}><Text>{name.slice(0, 32)}</Text></Box>
            <Bar done={done} total={total} />
            <Text dimColor>  {done}/{total}</Text>
        </Box>
    );
}

// ── Step: Menu ────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
    { label: 'Evaluate',        value: 'evaluate' },
    { label: 'LLM Providers',   value: 'providers' },
    { label: 'Model Catalog',   value: 'models' },
    { label: 'History',         value: 'history' },
    { label: 'Try an Example',  value: 'example' },
    { label: 'About',           value: 'about' },
];

function MenuStep({ onSelect }: { onSelect: (value: string) => void }) {
    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text dimColor>What would you like to do?</Text>
            <SelectInput
                items={MENU_ITEMS}
                onSelect={item => onSelect(item.value)}
            />
        </Box>
    );
}

// ── Step: Providers list ──────────────────────────────────────────────────────

function ProvidersListStep({
    onSelect,
    onAdd,
    onBack,
}: {
    onSelect: (name: string, index: number) => void;
    onAdd: () => void;
    onBack: () => void;
}) {
    useInput((_, key) => { if (key.escape) onBack(); });
    const providers = loadConfig().providers;

    const items = [
        ...providers.map((p, i) => ({
            label: `${p.name}  ·  ${p.kind === 'custom' ? p.model : `···${p.apiKey.slice(-4)}`}  ·  ${p.baseUrl}`,
            value: String(i),
            key: `provider-${i}`,
        })),
        { label: '＋ Add provider', value: '__add__', key: '__add__' },
        { label: '← Back',         value: '__back__', key: '__back__' },
    ];

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>LLM Providers</Text>
            {providers.length === 0 && (
                <Text dimColor>No providers saved yet.</Text>
            )}
            <SelectInput
                items={items}
                onSelect={item => {
                    if (item.value === '__add__')   onAdd();
                    else if (item.value === '__back__') onBack();
                    else {
                        const i = Number(item.value);
                        onSelect(providers[i].name, i);
                    }
                }}
            />
            <Text dimColor>  ↑↓ navigate  ·  Enter select  ·  Esc back</Text>
        </Box>
    );
}

// ── Step: Provider detail ─────────────────────────────────────────────────────

function ProvidersDetailStep({
    providerIndex,
    onDelete,
    onBack,
}: {
    providerName: string;
    providerIndex: number;
    onDelete: () => void;
    onBack: () => void;
}) {
    useInput((_, key) => { if (key.escape) onBack(); });
    const provider = loadConfig().providers[providerIndex];

    if (!provider) {
        return (
            <Box paddingLeft={2} paddingTop={1}>
                <Text color="red">Provider not found.</Text>
            </Box>
        );
    }

    const items = [
        { label: '✗ Delete',  value: '__delete__' },
        { label: '← Back',   value: '__back__' },
    ];

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>{provider.name}</Text>
            <Box flexDirection="column" paddingLeft={1} gap={0}>
                <Text dimColor>Model:    <Text color="cyan">{provider.kind === 'custom' ? provider.model : '(preset)'}</Text></Text>
                <Text dimColor>Base URL: {provider.baseUrl}</Text>
                <Text dimColor>API key:  {'*'.repeat(Math.min(provider.apiKey.length, 8))}…</Text>
            </Box>
            <SelectInput
                items={items}
                onSelect={item => {
                    if (item.value === '__delete__') onDelete();
                    else onBack();
                }}
            />
            <Text dimColor>  ↑↓ navigate  ·  Enter select  ·  Esc back</Text>
        </Box>
    );
}

// ── Step: Preset select ───────────────────────────────────────────────────────

const PRESET_ITEMS = [
    { label: 'OpenAI',    value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'Google',    value: 'google' },
    { label: 'xAI',       value: 'xai' },
    { label: 'DeepSeek',  value: 'deepseek' },
    { label: 'Mistral',   value: 'mistral' },
    { label: 'Custom',    value: 'custom' },
    { label: '← Back',   value: '__back__' },
];

function ProvidersPresetSelectStep({
    onSelect,
    onBack,
}: {
    onSelect: (preset: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom') => void;
    onBack: () => void;
}) {
    useInput((_, key) => { if (key.escape) onBack(); });
    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>Add Provider</Text>
            <Text dimColor>Select a provider type:</Text>
            <SelectInput
                items={PRESET_ITEMS}
                onSelect={item => {
                    if (item.value === '__back__') onBack();
                    else onSelect(item.value as 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom');
                }}
            />
            <Text dimColor>  ↑↓ navigate  ·  Enter select  ·  Esc back</Text>
        </Box>
    );
}

// ── Step: Provider form ───────────────────────────────────────────────────────

const FORM_FIELDS = ['name', 'model', 'apiKey', 'baseUrl'] as const;
type FieldKey = typeof FORM_FIELDS[number];

const FIELD_LABELS: Record<FieldKey, string> = {
    name:    'Display name',
    model:   'Model',
    apiKey:  'API key',
    baseUrl: 'Base URL',
};

function ProvidersFormStep({
    preset,
    fields,
    activeField,
    onChange,
    onSubmitField,
    onNavigate,
    onBack,
}: {
    preset: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom';
    fields: { name: string; model: string; apiKey: string; baseUrl: string };
    activeField: number;
    onChange: (key: FieldKey, value: string) => void;
    onSubmitField: () => void;
    onNavigate: (delta: -1 | 1) => void;
    onBack: () => void;
}) {
    const isCustom = preset === 'custom';
    const [warn, setWarn] = useState(false);

    const visibleFields: FieldKey[] = isCustom
        ? ['name', 'model', 'apiKey', 'baseUrl']
        : ['name', 'apiKey'];

    const activeKey = visibleFields[activeField];

    function handleSubmit() {
        if (!fields[activeKey]?.trim()) { setWarn(true); return; }
        setWarn(false);
        onSubmitField();
    }

    useInput((_, key) => {
        if (key.escape)    onBack();
        if (key.upArrow)   { setWarn(false); onNavigate(-1); }
        if (key.downArrow) { setWarn(false); onNavigate(1); }
    });

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>Add Provider  <Text dimColor>({PRESETS[preset].label})</Text></Text>
            {!isCustom && (
                <Text dimColor>Base URL: {PRESETS[preset].baseUrl}</Text>
            )}
            <Box flexDirection="column" gap={0} marginTop={1}>
                {visibleFields.map((key, idx) => {
                    const isActive = idx === activeField;
                    return (
                        <Box key={key} gap={1} paddingLeft={1}>
                            <Box width={14}>
                                <Text color={isActive ? 'cyan' : undefined} dimColor={!isActive}>
                                    {FIELD_LABELS[key]}:
                                </Text>
                            </Box>
                            {isActive ? (
                                <TextInput
                                    value={fields[key]}
                                    onChange={v => { onChange(key, v); setWarn(false); }}
                                    onSubmit={handleSubmit}
                                />
                            ) : (
                                <Text dimColor={!fields[key]}>
                                    {fields[key] || '—'}
                                </Text>
                            )}
                        </Box>
                    );
                })}
            </Box>
            {warn && <Text color="yellow">  This field is required</Text>}
            <Text dimColor>  ↑↓ navigate  ·  Enter to advance  ·  Esc to go back</Text>
        </Box>
    );
}

// ── Multi-select list ─────────────────────────────────────────────────────────

function MultiSelectList({
    items,
    initialSelected,
    onConfirm,
    onBack,
}: {
    items: { label: string; value: string; disabled?: boolean }[];
    initialSelected?: string[];
    onConfirm: (selected: string[]) => void;
    onBack: () => void;
}) {
    const [focusIdx, setFocusIdx]   = useState(0);
    const [selected, setSelected]   = useState<Set<string>>(new Set(initialSelected));
    const [warn, setWarn]           = useState(false);

    useInput((input, key) => {
        if (key.upArrow)   setFocusIdx(i => Math.max(0, i - 1));
        if (key.downArrow) setFocusIdx(i => Math.min(items.length - 1, i + 1));
        if (input === ' ') {
            const item = items[focusIdx];
            if (!item || item.disabled) return;
            setSelected(prev => {
                const next = new Set(prev);
                if (next.has(item.value)) next.delete(item.value); else next.add(item.value);
                return next;
            });
            setWarn(false);
        }
        if (key.return) {
            if (selected.size > 0) { setWarn(false); onConfirm([...selected]); }
            else setWarn(true);
        }
        if (key.escape) onBack();
    });

    return (
        <Box flexDirection="column" gap={0}>
            {items.map((item, i) => {
                const isFocused  = i === focusIdx;
                const isSelected = selected.has(item.value);
                const isDisabled = !!item.disabled;
                return (
                    <Box key={item.value} gap={1}>
                        <Text color={isFocused && !isDisabled ? 'cyan' : undefined}>{isFocused ? '❯' : ' '}</Text>
                        {isDisabled
                            ? <Text dimColor>[–]</Text>
                            : <Text color={isSelected ? 'cyan' : undefined} dimColor={!isSelected && !isFocused}>{isSelected ? '[x]' : '[ ]'}</Text>
                        }
                        <Text
                            color={isFocused && !isDisabled ? 'cyan' : undefined}
                            dimColor={isDisabled || (!isSelected && !isFocused)}
                        >
                            {item.label}
                        </Text>
                    </Box>
                );
            })}
            {warn && (
                <Box marginTop={1}>
                    <Text color="yellow">  Select at least one provider first</Text>
                </Box>
            )}
            <Box marginTop={warn ? 0 : 1}>
                <Text dimColor>  ↑↓ navigate  ·  Space to toggle  ·  Enter to run  ·  Esc to go back</Text>
            </Box>
        </Box>
    );
}

// ── Step: Provider select (before running) ────────────────────────────────────

function findSavedEntry(ref: ProviderRef): { apiKey: string; baseUrl: string } | undefined {
    const saved = loadConfig().providers;
    // predefined: match by preset name ('openai', 'anthropic')
    const predefined = saved.find(p => p.kind === 'predefined' && p.preset === ref.name);
    if (predefined) return { apiKey: predefined.apiKey, baseUrl: predefined.baseUrl };
    // custom: match by baseUrl first, then by display name
    const custom = saved.find(
        p => p.kind === 'custom' &&
            (ref.baseUrl ? p.baseUrl === ref.baseUrl : p.name === ref.name)
    );
    if (custom) return { apiKey: custom.apiKey, baseUrl: custom.baseUrl };
    return undefined;
}

function makeProviderFromRef(ref: ProviderRef, apiKey: string, savedBaseUrl: string): Provider {
    // ref.baseUrl takes priority (explicit in spec), then saved config's baseUrl
    const baseUrl = ref.baseUrl ?? savedBaseUrl ?? PRESETS[ref.name as keyof typeof PRESETS]?.baseUrl ?? '';
    const kind = (ref.name in PRESETS ? ref.name : 'custom') as ProviderKind;
    return coreProvider(kind, { model: ref.model, apiKey, baseUrl });
}

function ProviderSelectStep({
    spec,
    onSelect,
    onBack,
}: {
    spec: AgentSpec;
    onSelect: (providers: Provider[]) => void;
    onBack: () => void;
}) {
    type Eligible = { ref: ProviderRef; apiKey: string; baseUrl: string; value: string };
    const eligible: Eligible[] = (spec.providers ?? []).flatMap(ref => {
        const saved = findSavedEntry(ref);
        return saved ? [{ ref, apiKey: saved.apiKey, baseUrl: saved.baseUrl, value: ref.name + '|' + ref.model }] : [];
    });

    const unconfigured = (spec.providers ?? [])
        .filter(ref => !eligible.some(e => e.value === ref.name + '|' + ref.model))
        .map(ref => ({
            label: `${ref.name}  ·  ${ref.model}  (not configured)`,
            value: `__disabled__${ref.name}|${ref.model}`,
            disabled: true as const,
        }));

    const items = [
        ...eligible.map(e => ({ label: `${e.ref.name}  ·  ${e.ref.model}`, value: e.value })),
        ...unconfigured,
    ];

    function handleConfirm(selected: string[]) {
        const providers: Provider[] = selected.flatMap(val => {
            const entry = eligible.find(e => e.value === val);
            return entry ? [makeProviderFromRef(entry.ref, entry.apiKey, entry.baseUrl)] : [];
        });
        if (providers.length > 0) onSelect(providers);
    }

    const hasSelectable = eligible.length > 0;

    if (!hasSelectable && unconfigured.length === 0) {
        return (
            <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
                <Text color="yellow">No matching providers with API keys. Add one via LLM Providers.</Text>
                <SelectInput
                    items={[{ label: '← Back', value: '__back__' }]}
                    onSelect={() => onBack()}
                />
            </Box>
        );
    }

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>Select providers to evaluate</Text>
            <Text dimColor>{spec.agent.name}</Text>
            {!hasSelectable && (
                <Text color="yellow">No providers configured. Add API keys via LLM Providers.</Text>
            )}
            <MultiSelectList
                items={items}
                initialSelected={eligible.map(e => e.value)}
                onConfirm={handleConfirm}
                onBack={onBack}
            />
        </Box>
    );
}

// ── Path autocomplete ─────────────────────────────────────────────────────────

function getSuggestions(input: string): string[] {
    const lastSlash = input.lastIndexOf('/');
    const dir    = lastSlash >= 0 ? input.slice(0, lastSlash + 1) || '/' : './';
    const prefix = lastSlash >= 0 ? input.slice(lastSlash + 1) : input;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries
            .filter(e => e.name.startsWith(prefix))
            .filter(e => e.isDirectory() || e.name.endsWith('.yml') || e.name.endsWith('.yaml'))
            .sort((a, b) => {
                if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
                return a.name.localeCompare(b.name);
            })
            .map(e => dir + e.name + (e.isDirectory() ? '/' : ''))
            .slice(0, 6);
    } catch {
        return [];
    }
}

// ── Step: Path input ──────────────────────────────────────────────────────────

function InputStep({
    value,
    error,
    onChange,
    onSubmit,
    onBack,
}: {
    value: string;
    error?: string;
    onChange: (v: string) => void;
    onSubmit: (v: string) => void;
    onBack: () => void;
}) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(-1);

    useEffect(() => {
        setSuggestions(getSuggestions(value));
        setSelectedIdx(-1);
    }, [value]);

    useInput((_, key) => {
        if (key.escape) { onBack(); return; }
        if (!key.tab || suggestions.length === 0) return;
        const next = (selectedIdx + 1) % suggestions.length;
        setSelectedIdx(next);
        onChange(suggestions[next]);
    });

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Box gap={1}>
                <Text dimColor>Path to spec file:</Text>
                <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
            </Box>
            {suggestions.length > 0 && (
                <Box flexDirection="column" paddingLeft={4}>
                    {suggestions.map((s, i) => (
                        <Box key={s} gap={1}>
                            <Text color={i === selectedIdx ? 'cyan' : undefined}>
                                {i === selectedIdx ? '❯' : ' '}
                            </Text>
                            <Text color={i === selectedIdx ? 'cyan' : undefined} dimColor={i !== selectedIdx}>
                                {s}
                            </Text>
                        </Box>
                    ))}
                </Box>
            )}
            <Text dimColor>  Tab to cycle  ·  Enter to confirm  ·  Esc to go back</Text>
            {error && <Text color="red">✗ {error}</Text>}
        </Box>
    );
}

// ── Step: Running ─────────────────────────────────────────────────────────────

// progress keyed by model → scenarioName
type ProviderProgress = Map<string, Map<string, ScenarioProgress>>;

function RunningStep({
    spec,
    providers,
    onComplete,
    onCancel,
}: {
    spec: AgentSpec;
    providers: Provider[];
    onComplete: (results: { model: string; metrics: ScenarioMetrics[] }[]) => void;
    onCancel: () => void;
}) {
    const spinner         = useSpinner();
    const runsPerScenario = spec.scoring?.runs_per_scenario ?? 1;
    const cancelledRef    = useRef(false);
    const [cancelled, setCancelled] = useState(false);

    const [progress, setProgress] = useState<ProviderProgress>(() => {
        const m: ProviderProgress = new Map();
        for (const p of providers) {
            const inner = new Map<string, ScenarioProgress>();
            for (const s of spec.scenarios) inner.set(s.name, { done: 0, total: runsPerScenario });
            m.set(p.getConfig().model, inner);
        }
        return m;
    });

    const cancelSignal = useRef({ cancelled: false });

    useInput((_, key) => {
        if (key.escape && !cancelled) {
            cancelledRef.current = true;
            cancelSignal.current.cancelled = true;
            setCancelled(true);
        } else if (key.escape && cancelled) {
            onCancel();
        }
    });

    useEffect(() => {
        Promise.all(
            providers.map(provider => {
                const model = provider.getConfig().model;
                const runner = new ScenarioRunner(spec, provider, {
                    maxTurns: 10,
                    cancelSignal: cancelSignal.current,
                    onProgress: ({ scenarioName }) => {
                        if (cancelledRef.current) return;
                        setProgress(prev => {
                            const copy: ProviderProgress = new Map(prev);
                            const inner = new Map(copy.get(model)!);
                            const entry = inner.get(scenarioName)!;
                            inner.set(scenarioName, { ...entry, done: entry.done + 1 });
                            copy.set(model, inner);
                            return copy;
                        });
                    },
                });
                return runner.runAllScenarios(runsPerScenario).then(metrics => ({ model, metrics }));
            })
        ).then(results => {
            if (cancelledRef.current) { onCancel(); } else { onComplete(results); }
        });
    // eslint-disable-next-line
    }, []);

    const totalRuns = providers.length * spec.scenarios.length * runsPerScenario;
    const doneTotal = [...progress.values()]
        .flatMap(inner => [...inner.values()])
        .reduce((s, p) => s + p.done, 0);

    if (cancelled) {
        return (
            <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
                <Text color="yellow">Cancelling… waiting for current run to finish</Text>
                <Text dimColor>  Esc back</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text dimColor>{spec.agent.name}  ·  {runsPerScenario} runs/scenario</Text>

            {providers.map(provider => {
                const model       = provider.getConfig().model;
                const innerMap    = progress.get(model)!;
                return (
                    <Box key={model} flexDirection="column" marginTop={1}>
                        <Text color="cyan">{model}</Text>
                        {spec.scenarios.map(s => (
                            <ScenarioRow
                                key={s.name}
                                name={s.name}
                                progress={innerMap.get(s.name)!}
                                spinner={spinner}
                            />
                        ))}
                    </Box>
                );
            })}

            <Text dimColor>Progress: {doneTotal}/{totalRuns} runs  ·  Esc to cancel</Text>
        </Box>
    );
}

// ── Results helpers ───────────────────────────────────────────────────────────

function msStr(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
}

function metricColor(v: number): string {
    return v === 1 ? 'green' : v >= 0.8 ? 'yellow' : 'red';
}

function Pct({ value }: { value: number }) {
    return <Text color={metricColor(value)}>{`${(value * 100).toFixed(0)}%`.padStart(4)}</Text>;
}

// ── Results: scenario summary row ─────────────────────────────────────────────

function ScenarioSummaryRow({ m, isFocused, isExpanded }: {
    m: ScenarioMetrics; isFocused: boolean; isExpanded: boolean;
}) {
    const pass       = m.path_accuracy === 1 && m.tool_accuracy === 1 && m.outcome_accuracy === 1;
    const passedRuns = m.runs.filter(r => r.pathMatch && r.toolMatch && r.outcomeMatch).length;
    return (
        <Box gap={1} paddingLeft={2}>
            <Text color={isFocused ? 'cyan' : undefined}>{isFocused ? '❯' : ' '}</Text>
            <Text color={pass ? 'green' : 'red'}>{pass ? '✓' : '✗'}</Text>
            <Box width={30}><Text color={isFocused ? 'cyan' : undefined}>{m.scenarioName.slice(0, 30)}</Text></Box>
            <Pct value={m.path_accuracy} />
            <Pct value={m.tool_accuracy} />
            <Pct value={m.outcome_accuracy} />
            <Text dimColor>{passedRuns}/{m.runs.length}</Text>
            <Text dimColor>${m.total_cost_usd.toFixed(4)}</Text>
            <Text dimColor>{isExpanded ? '▼' : '▶'}</Text>
        </Box>
    );
}

// ── Results: flow graph (trace overlay) ───────────────────────────────────────

function FlowGraph({ flow, trace, scenario }: {
    flow: Flow[]; trace: TraceEntry[]; scenario: Scenario;
}) {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text dimColor>Flow</Text>
            {flow.map((f, i) => {
                const entry    = trace.find(t => t.step === f.step);
                const expected = scenario.expectedPath?.includes(f.step) ?? false;
                const color    = entry
                    ? (expected ? 'green' : 'yellow')
                    : (expected ? 'red'   : undefined);
                return (
                    <Box key={f.step} flexDirection="column">
                        {i > 0 && <Box paddingLeft={2}><Text dimColor>│</Text></Box>}
                        <Box gap={1} paddingLeft={2}>
                            <Text dimColor>▼</Text>
                            <Text color={color} bold={!!entry}>[{f.step}]</Text>
                            {f.tool && <Text dimColor>→ {f.tool}</Text>}
                            {entry && <Text color="green">✓ t{entry.turn}  {msStr(entry.durationMs)}</Text>}
                            {!entry && expected  && <Text color="red">✗ not called</Text>}
                            {!entry && !expected && <Text dimColor>· skipped</Text>}
                        </Box>
                        {entry && (
                            <Box flexDirection="column" paddingLeft={7}>
                                <Text dimColor>in:  {Object.entries(entry.input).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('  ') || '—'}</Text>
                                <Text dimColor>out: {Object.entries(entry.output).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('  ') || '—'}</Text>
                            </Box>
                        )}
                        {f.condition && (
                            <Box paddingLeft={7}>
                                <Text dimColor>if {f.condition.if} → then: {f.condition.then}  else: {f.condition.else}</Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
            {trace.filter(t => t.step === '?').map((t, i) => (
                <Box key={i} flexDirection="column">
                    <Box paddingLeft={2}><Text dimColor>│</Text></Box>
                    <Box gap={1} paddingLeft={2}>
                        <Text dimColor>▼</Text>
                        <Text color="red">[?]</Text>
                        <Text color="magenta">{t.toolName}</Text>
                        <Text color="red">✗ unexpected</Text>
                    </Box>
                    <Box flexDirection="column" paddingLeft={7}>
                        <Text dimColor>in:  {Object.entries(t.input).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('  ') || '—'}</Text>
                        <Text dimColor>out: {Object.entries(t.output).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('  ') || '—'}</Text>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

// ── Results: scenario detail (expandable, any scenario) ───────────────────────

function ScenarioDetail({ m, scenario, flow }: {
    m: ScenarioMetrics; scenario: Scenario; flow: Flow[];
}) {
    const failedRuns  = m.runs.filter(r => !r.pathMatch || !r.toolMatch || !r.outcomeMatch);
    const runIdx      = failedRuns.length > 0 ? m.runs.indexOf(failedRuns[0]) : 0;
    const run         = m.runs[runIdx];
    const runLabel    = failedRuns.length > 0
        ? `run ${runIdx + 1}/${m.runs.length} · ${failedRuns.length} failed`
        : `run ${runIdx + 1}/${m.runs.length} · all passed`;
    return (
        <Box flexDirection="column" paddingLeft={2} marginTop={1} borderStyle="single" borderColor="cyan" paddingX={1}>
            <Text dimColor>{runLabel}</Text>
            <FlowGraph flow={flow} trace={run.trace} scenario={scenario} />
            {!run.outcomeMatch && (
                <Box flexDirection="column" marginTop={1}>
                    <Text color="red">✗ outcome mismatch</Text>
                    <Text dimColor>  expected: {JSON.stringify(scenario.expectedOutcome)}</Text>
                    <Text dimColor>  actual:   {JSON.stringify(run.finalOutput)}</Text>
                </Box>
            )}
        </Box>
    );
}

// ── Results: per-model block ───────────────────────────────────────────────────

function ModelResultBlock({ model, metrics, scenarios, flow, focusedSi, expandedSis }: {
    model: string;
    metrics: ScenarioMetrics[];
    scenarios: Scenario[];
    flow: Flow[];
    focusedSi: number;
    expandedSis: Set<number>;
}) {
    const avgPath    = metrics.reduce((s, m) => s + m.path_accuracy,    0) / metrics.length;
    const avgTool    = metrics.reduce((s, m) => s + m.tool_accuracy,    0) / metrics.length;
    const avgOutcome = metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / metrics.length;
    const avgLatency = metrics.reduce((s, m) => s + m.avg_latency_ms,   0) / metrics.length;
    const totalCost  = metrics.reduce((s, m) => s + m.total_cost_usd,   0);
    const allPass    = metrics.every(m => m.runs.every(r => r.pathMatch && r.toolMatch && r.outcomeMatch));

    return (
        <Box flexDirection="column" borderStyle="round" borderColor={allPass ? 'green' : 'red'} paddingX={1} marginBottom={1}>
            <Box gap={2}>
                <Text bold color="cyan">{model}</Text>
                <Text dimColor>{msStr(avgLatency)} avg  ·  ${totalCost.toFixed(4)}</Text>
            </Box>
            <Box gap={1} paddingLeft={2} marginTop={1}>
                <Box width={36}><Text dimColor>Scenario</Text></Box>
                <Text dimColor>path  tool   out  runs   cost</Text>
            </Box>
            <Box paddingLeft={2}><Text dimColor>{'─'.repeat(64)}</Text></Box>
            {metrics.map((m, si) => {
                const isFocused  = focusedSi === si;
                const isExpanded = expandedSis.has(si);
                const scenario   = scenarios.find(s => s.name === m.scenarioName);
                return (
                    <Box key={m.scenarioName} flexDirection="column">
                        <ScenarioSummaryRow m={m} isFocused={isFocused} isExpanded={isExpanded} />
                        {isExpanded && scenario && (
                            <ScenarioDetail m={m} scenario={scenario} flow={flow} />
                        )}
                    </Box>
                );
            })}
            <Box paddingLeft={2}><Text dimColor>{'─'.repeat(64)}</Text></Box>
            <Box gap={1} paddingLeft={4}>
                <Box width={32}><Text bold>Average</Text></Box>
                <Pct value={avgPath} />
                <Pct value={avgTool} />
                <Pct value={avgOutcome} />
            </Box>
        </Box>
    );
}

// ── Results: comparison table (multi-model) ────────────────────────────────────

function ComparisonTable({ results }: { results: { model: string; metrics: ScenarioMetrics[] }[] }) {
    const scenarioNames = results[0].metrics.map(m => m.scenarioName);
    const COL = 16;
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text bold>Model Comparison</Text>
            <Box paddingLeft={2} marginTop={1}>
                <Box width={34}><Text> </Text></Box>
                {results.map(r => <Box key={r.model} width={COL}><Text bold>{r.model.slice(0, COL - 2)}</Text></Box>)}
            </Box>
            <Box paddingLeft={2}>
                <Box width={34}><Text> </Text></Box>
                {results.map(r => <Box key={r.model} width={COL}><Text dimColor>path  out</Text></Box>)}
            </Box>
            <Box paddingLeft={2}><Text dimColor>{'─'.repeat(34 + results.length * COL)}</Text></Box>
            {scenarioNames.map(name => (
                <Box key={name} paddingLeft={2}>
                    <Box width={34}><Text>{name.slice(0, 32)}</Text></Box>
                    {results.map(r => {
                        const m = r.metrics.find(x => x.scenarioName === name);
                        return m
                            ? <Box key={r.model} width={COL} gap={1}><Pct value={m.path_accuracy} /><Pct value={m.outcome_accuracy} /></Box>
                            : <Box key={r.model} width={COL} />;
                    })}
                </Box>
            ))}
            <Box paddingLeft={2}><Text dimColor>{'─'.repeat(34 + results.length * COL)}</Text></Box>
            <Box paddingLeft={2}>
                <Box width={34}><Text bold>Average</Text></Box>
                {results.map(r => {
                    const avgP = r.metrics.reduce((s, m) => s + m.path_accuracy,    0) / r.metrics.length;
                    const avgO = r.metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / r.metrics.length;
                    return <Box key={r.model} width={COL} gap={1}><Pct value={avgP} /><Pct value={avgO} /></Box>;
                })}
            </Box>
            <Box paddingLeft={2}>
                <Box width={34}><Text dimColor>Cost</Text></Box>
                {results.map(r => {
                    const total = r.metrics.reduce((s, m) => s + m.total_cost_usd, 0);
                    return <Box key={r.model} width={COL}><Text dimColor>${total.toFixed(4)}</Text></Box>;
                })}
            </Box>
        </Box>
    );
}

// ── History ────────────────────────────────────────────────────────────────────

type HistoryEntry = {
    filePath: string;
    agentName: string;
    models: string;
    scenarioCount: number;
    savedAt: string;
    sortKey: string;
};

function scanHistoryEntries(): HistoryEntry[] {
    const historyDir = path.join(os.homedir(), '.config', 'vrunai', 'history');
    const dirs = [process.cwd(), historyDir];
    const entries: HistoryEntry[] = [];
    for (const dir of dirs) {
        let files: string[] = [];
        try { files = fs.readdirSync(dir).filter(f => /^.+_-_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}\.json$/.test(f)); }
        catch { continue; }
        for (const file of files) {
            const match = file.match(/^(.+)_-_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})\.json$/);
            if (!match) continue;
            const [, stem, ts] = match;
            const agentName = stem.replace(/_/g, ' ');
            const displayDate = `${ts.slice(0, 10)} ${ts.slice(11, 13)}:${ts.slice(14, 16)}`;
            const filePath = path.join(dir, file);
            try {
                const raw: { model: string; metrics: { scenarioName: string }[] }[] =
                    JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const models = raw.map(r => r.model);
                entries.push({
                    filePath,
                    agentName,
                    models: models.length === 1 ? models[0] : `${models[0]} +${models.length - 1}`,
                    scenarioCount: raw[0]?.metrics?.length ?? 0,
                    savedAt: displayDate,
                    sortKey: ts,
                });
            } catch { continue; }
        }
    }
    const seen = new Set<string>();
    return entries
        .filter(e => { if (seen.has(e.filePath)) return false; seen.add(e.filePath); return true; })
        .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

function HistoryStep({ onOpen, onBack }: {
    onOpen: (entry: HistoryEntry) => void;
    onBack: () => void;
}) {
    const [entries, setEntries]         = useState<HistoryEntry[]>(() => scanHistoryEntries());
    const [cursor, setCursor]           = useState(0);
    const [pendingDelete, setPending]   = useState(false);

    useInput((input, key) => {
        if (pendingDelete) {
            if (input === 'y') {
                const entry = entries[cursor];
                try { fs.unlinkSync(entry.filePath); } catch { /* ignore */ }
                setEntries(prev => prev.filter((_, i) => i !== cursor));
                setCursor(i => Math.min(i, Math.max(0, entries.length - 2)));
                setPending(false);
            } else {
                setPending(false);
            }
            return;
        }
        if (key.upArrow)   setCursor(i => Math.max(0, i - 1));
        if (key.downArrow) setCursor(i => Math.min(entries.length - 1, i + 1));
        if (key.return && entries.length > 0) onOpen(entries[cursor]);
        if (input === 'd' && entries.length > 0) setPending(true);
        if (key.escape) onBack();
    });

    if (entries.length === 0) {
        return (
            <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
                <Text bold>History</Text>
                <Text dimColor>No runs saved yet. Complete an eval to populate history.</Text>
                <Text dimColor>  Esc back</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" paddingLeft={2} paddingTop={1} gap={0}>
            <Text bold>History</Text>
            <Box gap={1} marginTop={1}>
                <Box width={2}><Text> </Text></Box>
                <Box width={32}><Text dimColor>Name</Text></Box>
                <Box width={22}><Text dimColor>Model</Text></Box>
                <Box width={10}><Text dimColor>Scenarios</Text></Box>
                <Text dimColor>Date</Text>
            </Box>
            {entries.map((e, i) => {
                const focused = i === cursor;
                return (
                    <Box key={e.filePath} gap={1}>
                        <Box width={2}><Text color="cyan">{focused ? '❯' : ' '}</Text></Box>
                        <Box width={32}><Text color={focused ? 'cyan' : undefined}>{e.agentName.slice(0, 31)}</Text></Box>
                        <Box width={22}><Text dimColor={!focused}>{e.models.slice(0, 21)}</Text></Box>
                        <Box width={10}><Text dimColor={!focused}>{e.scenarioCount}</Text></Box>
                        <Text dimColor={!focused}>{e.savedAt}</Text>
                    </Box>
                );
            })}
            {pendingDelete && entries.length > 0
                ? <Text color="yellow">  Delete "{entries[cursor].agentName}"? y / any key to cancel</Text>
                : <Text dimColor>  ↑↓ navigate  ·  Enter open  ·  d  delete  ·  Esc back</Text>
            }
        </Box>
    );
}

// ── SummaryBlock ───────────────────────────────────────────────────────────────

function SummaryBlock({ results }: { results: { model: string; metrics: ScenarioMetrics[] }[] }) {
    function pctStr(v: number) { return Math.round(v * 100) + '%'; }
    const lines: { text: string; color?: string }[] = [];
    for (const r of results) {
        const n = r.metrics.length;
        const totalCost = r.metrics.reduce((s, m) => s + m.total_cost_usd, 0);
        const avgLat    = r.metrics.reduce((s, m) => s + m.avg_latency_ms, 0) / n;
        const avgPath   = r.metrics.reduce((s, m) => s + m.path_accuracy, 0) / n;
        const avgTool   = r.metrics.reduce((s, m) => s + m.tool_accuracy, 0) / n;
        const avgOut    = r.metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / n;
        const allPass   = avgPath === 1 && avgTool === 1 && avgOut === 1;
        const allFail   = avgPath === 0 && avgTool === 0 && avgOut === 0;
        const lineColor = allPass ? 'green' : allFail ? 'red' : 'yellow';
        const icon      = allPass ? '✓' : allFail ? '✗' : '⚠';
        lines.push({ text: `${icon} ${r.model}  ${pctStr(avgPath)} path / ${pctStr(avgTool)} tool / ${pctStr(avgOut)} outcome · $${totalCost.toFixed(4)}  ${Math.round(avgLat)}ms avg`, color: lineColor });
        if (!allFail) {
            for (const m of r.metrics) {
                if (m.path_accuracy < 1) {
                    lines.push({ text: `  ⚠ ${m.scenarioName}: ${pctStr(m.path_accuracy)} path accuracy`, color: 'yellow' });
                    break;
                }
            }
            for (const m of r.metrics) {
                if (m.consistency < 1) {
                    lines.push({ text: `  ⚠ Inconsistent values in ${m.scenarioName} across runs — check trace`, color: 'yellow' });
                    break;
                }
            }
        }
    }
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
            <Text dimColor>Summary</Text>
            {lines.map((l, i) => (
                <Text key={i} color={l.color}>{l.text}</Text>
            ))}
        </Box>
    );
}

// ── Step: Results ──────────────────────────────────────────────────────────────

function ResultsStep({ spec, results, specPath, onBack, savedAt, isDemoMode }: {
    spec: AgentSpec;
    results: { model: string; metrics: ScenarioMetrics[] }[];
    specPath: string;
    onBack: () => void;
    savedAt?: string;
    isDemoMode?: boolean;
}) {

    const allItems = results.flatMap((r, mi) =>
        r.metrics.map((_, si) => ({ mi, si, key: `${mi}:${si}` })));

    const [cursorIdx, setCursorIdx] = useState(0);
    const [expanded, setExpanded]   = useState(new Set<string>());
    const [savedPath, setSavedPath] = useState<string | null>(null);

    // ── Viewport scrolling ───────────────────────────────────────────────────
    // Each section is a "page": header, each model block, comparison, summary, footer.
    // We track which page is visible and scroll between pages with ←/→ or PgUp/PgDn.

    type Section =
        | { type: 'model'; mi: number }
        | { type: 'comparison' }
        | { type: 'summary' };

    const sections: Section[] = [
        ...results.map((_, mi): Section => ({ type: 'model', mi })),
        ...(results.length > 1 ? [{ type: 'comparison' as const }] : []),
        { type: 'summary' },
    ];

    const [sectionIdx, setSectionIdx] = useState(0);

    // Auto-scroll to the section containing the focused item
    useEffect(() => {
        const item = allItems[cursorIdx];
        if (item) {
            const target = sections.findIndex(s => s.type === 'model' && s.mi === item.mi);
            if (target >= 0 && target !== sectionIdx) setSectionIdx(target);
        }
    }, [cursorIdx]);

    useInput((input, key) => {
        if (key.upArrow)   setCursorIdx(i => Math.max(0, i - 1));
        if (key.downArrow) setCursorIdx(i => Math.min(allItems.length - 1, i + 1));
        if (input === ' ' || key.return) {
            const k = allItems[cursorIdx]?.key;
            if (k) setExpanded(prev => {
                const next = new Set(prev);
                next.has(k) ? next.delete(k) : next.add(k);
                return next;
            });
        }
        if (key.leftArrow)  setSectionIdx(i => Math.max(0, i - 1));
        if (key.rightArrow) setSectionIdx(i => Math.min(sections.length - 1, i + 1));
        if (input === 's' && !isDemoMode) setSavedPath(saveResults(results, path.dirname(specPath), path.basename(specPath, path.extname(specPath))));
        if (key.escape) onBack();
    });

    const section = sections[sectionIdx];

    return (
        <Box flexDirection="column" paddingTop={1} gap={1}>
            {/* Header */}
            <Box gap={2}>
                <Text bold>{spec.agent.name}</Text>
                {isDemoMode && <Text color="yellow">[demo mode]</Text>}
                {savedAt && <Text dimColor>[saved · {savedAt}]</Text>}
            </Box>

            {/* Section indicator */}
            <Box gap={1} paddingLeft={2}>
                {sections.map((s, i) => {
                    const label = s.type === 'model' ? results[s.mi].model
                        : s.type === 'comparison' ? 'Comparison'
                        : 'Summary';
                    return (
                        <Text key={i} color={i === sectionIdx ? 'cyan' : undefined} dimColor={i !== sectionIdx}>
                            {i === sectionIdx ? `[${label}]` : ` ${label} `}
                        </Text>
                    );
                })}
            </Box>

            {/* Active section content */}
            {section.type === 'model' && (() => {
                const mi = section.mi;
                const r = results[mi];
                return (
                    <ModelResultBlock
                        key={r.model}
                        model={r.model}
                        metrics={r.metrics}
                        scenarios={spec.scenarios}
                        flow={spec.flow}
                        focusedSi={allItems[cursorIdx]?.mi === mi ? allItems[cursorIdx].si : -1}
                        expandedSis={new Set(r.metrics
                            .map((_, si) => expanded.has(`${mi}:${si}`) ? si : -1)
                            .filter(x => x >= 0))}
                    />
                );
            })()}

            {section.type === 'comparison' && <ComparisonTable results={results} />}

            {section.type === 'summary' && <SummaryBlock results={results} />}

            {savedPath && <Text color="green">  ✓ saved → {savedPath}</Text>}
            <Text dimColor>  ↑↓ scenario  ·  ←→ section  ·  Space expand/collapse  ·  s save  ·  Esc menu</Text>
        </Box>
    );
}

// ── Step: Models list ─────────────────────────────────────────────────────────

function ModelsListStep({ onShow, onBack }: {
    onShow: (id: string) => void;
    onBack: () => void;
}) {
    const models = loadModelConfig();
    const [cursorIdx, setCursorIdx] = useState(0);
    const [viewportStart, setViewportStart] = useState(0);
    const [validateMsg, setValidateMsg] = useState<string | null>(null);

    const activeModels     = models.filter(m => !m.deprecated);
    const deprecatedModels = models.filter(m => m.deprecated);
    const orderedModels    = [...activeModels, ...deprecatedModels];

    // Logo ≈ 9 rows, component header ≈ 4 rows (paddingTop + title + headers + gap), footer ≈ 2 rows
    const maxVisible = Math.max(4, (process.stdout.rows ?? 24) - 15);

    useInput((input, key) => {
        if (key.upArrow) {
            const next = Math.max(0, cursorIdx - 1);
            setCursorIdx(next);
            setViewportStart(s => Math.min(s, next));
        }
        if (key.downArrow) {
            const next = Math.min(orderedModels.length - 1, cursorIdx + 1);
            setCursorIdx(next);
            setViewportStart(s => (next >= s + maxVisible ? next - maxVisible + 1 : s));
        }
        if (key.return) onShow(orderedModels[cursorIdx]!.id);
        if (input === 'v') {
            const r = validateUserModelConfig();
            if (r.valid)         setValidateMsg(`✓ Valid — ${r.count} model(s)`);
            else if (r.missing)  setValidateMsg('No user config at ~/.config/vrunai/models.json');
            else                 setValidateMsg(`✗ ${r.errors.join('  ')}`);
        }
        if (key.escape) onBack();
    });

    const termCols  = process.stdout.columns ?? 80;
    const COL_ID    = Math.min(34, Math.max(20, termCols - 52));
    const COL_NAME  = 20;
    const COL_IN    = 10;
    const COL_OUT   = 10;
    const COL_CTX   = 8;

    function ModelRow({ m, i }: { m: ModelConfig; i: number }) {
        const focused = i === cursorIdx;
        const ctx     = m.context_window >= 1_000_000
            ? (m.context_window / 1_000_000).toFixed(0) + 'M'
            : (m.context_window / 1_000).toFixed(0) + 'k';
        return (
            <Box key={m.id} gap={0}>
                <Text color={focused ? 'cyan' : undefined}>{focused ? '❯ ' : '  '}</Text>
                <Text color={focused ? 'cyan' : undefined} dimColor={m.deprecated}>
                    {m.id.slice(0, COL_ID).padEnd(COL_ID)}
                </Text>
                <Text dimColor={!focused}>{m.name.slice(0, COL_NAME).padEnd(COL_NAME)}</Text>
                <Text dimColor>{'$' + m.pricing.input_per_1m_tokens.toFixed(3).padStart(COL_IN - 1)}</Text>
                <Text dimColor>{'$' + m.pricing.output_per_1m_tokens.toFixed(3).padStart(COL_OUT - 1)}</Text>
                <Text dimColor>{ctx.padStart(COL_CTX)}</Text>
            </Box>
        );
    }

    const visibleModels = orderedModels.slice(viewportStart, viewportStart + maxVisible);
    const showScrollUp   = viewportStart > 0;
    const showScrollDown = viewportStart + maxVisible < orderedModels.length;

    return (
        <Box flexDirection="column" paddingLeft={2} paddingTop={1} gap={1}>
            <Text bold>Models</Text>
            <Box gap={0}>
                <Text dimColor>{''.padEnd(2)}</Text>
                <Text dimColor bold>{'ID'.padEnd(COL_ID)}</Text>
                <Text dimColor bold>{'Name'.padEnd(COL_NAME)}</Text>
                <Text dimColor bold>{'Input/1M'.padStart(COL_IN)}</Text>
                <Text dimColor bold>{'Output/1M'.padStart(COL_OUT)}</Text>
                <Text dimColor bold>{'Context'.padStart(COL_CTX)}</Text>
            </Box>
            {showScrollUp && <Text dimColor>  ↑ {viewportStart} more above</Text>}
            {visibleModels.map((m, vi) => {
                const i = viewportStart + vi;
                const sepBefore = i === activeModels.length && deprecatedModels.length > 0;
                return (
                    <Box key={m.id} flexDirection="column" gap={0}>
                        {sepBefore && <Text dimColor>{'  ── deprecated ' + '─'.repeat(Math.max(0, COL_ID + COL_NAME + COL_IN + COL_OUT + COL_CTX - 14))}</Text>}
                        <ModelRow m={m} i={i} />
                    </Box>
                );
            })}
            {showScrollDown && <Text dimColor>  ↓ {orderedModels.length - viewportStart - maxVisible} more below</Text>}
            {validateMsg && (
                <Text color={validateMsg.startsWith('✓') ? 'green' : 'yellow'}>{validateMsg}</Text>
            )}
            <Text dimColor>  ↑↓ navigate  ·  Enter show detail  ·  v validate user config  ·  Esc back</Text>
        </Box>
    );
}

// ── Step: Models detail ────────────────────────────────────────────────────────

function ModelsDetailStep({ modelId, onBack }: { modelId: string; onBack: () => void }) {
    const model = loadModelConfig().find(m => m.id === modelId);

    useInput((_, key) => { if (key.escape) onBack(); });

    if (!model) {
        return (
            <Box paddingLeft={2} paddingTop={1}>
                <Text color="red">Model not found: {modelId}</Text>
            </Box>
        );
    }

    const check = (v: boolean) => <Text color={v ? 'green' : 'red'}>{v ? '✓' : '✗'}</Text>;
    const ctx = model.context_window >= 1_000_000
        ? (model.context_window / 1_000_000).toFixed(0) + 'M tokens'
        : (model.context_window / 1_000).toFixed(0) + 'k tokens';

    return (
        <Box flexDirection="column" paddingLeft={2} paddingTop={1} gap={1}>
            <Box gap={1}>
                <Text bold>{model.id}</Text>
                <Text dimColor>—</Text>
                <Text>{model.name}</Text>
                {model.deprecated && <Text color="yellow">[deprecated]</Text>}
            </Box>
            <Box flexDirection="column" gap={0} paddingLeft={2}>
                <Box gap={1}><Text dimColor>{'Provider:'.padEnd(16)}</Text><Text>{model.provider}</Text></Box>
                <Box gap={1}><Text dimColor>{'Context:'.padEnd(16)}</Text><Text>{ctx}</Text></Box>
                <Box gap={1}><Text dimColor>{'Tools:'.padEnd(16)}</Text>{check(model.supports_tools)}</Box>
                <Box gap={1}><Text dimColor>{'Vision:'.padEnd(16)}</Text>{check(model.supports_vision)}</Box>
                <Box gap={1}>
                    <Text dimColor>{'Input pricing:'.padEnd(16)}</Text>
                    <Text>${model.pricing.input_per_1m_tokens.toFixed(3)} / 1M tokens</Text>
                </Box>
                <Box gap={1}>
                    <Text dimColor>{'Output pricing:'.padEnd(16)}</Text>
                    <Text>${model.pricing.output_per_1m_tokens.toFixed(3)} / 1M tokens</Text>
                </Box>
            </Box>
            <SelectInput
                items={[{ label: '← Back', value: '__back__' }]}
                onSelect={onBack}
            />
            <Text dimColor>  Enter / Esc back</Text>
        </Box>
    );
}

// ── Step: About ───────────────────────────────────────────────────────────────

function AboutStep({ onBack }: { onBack: () => void }) {
    useInput((_, key) => { if (key.escape) onBack(); });
    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>About vrunai</Text>
            <Box flexDirection="column" gap={0}>
                <Box gap={2}>
                    <Text dimColor>Version   </Text>
                    <Text>0.1.0</Text>
                </Box>
                <Box gap={2}>
                    <Text dimColor>Website   </Text>
                    <Text color="cyan">https://vrunai.com</Text>
                </Box>
                <Box gap={2}>
                    <Text dimColor>Repository</Text>
                    <Text color="cyan">https://github.com/vrunai/vrunai</Text>
                </Box>
                <Box gap={2}>
                    <Text dimColor>License   </Text>
                    <Text>AGPL-3.0</Text>
                </Box>
            </Box>
            <Text dimColor>Esc  back</Text>
        </Box>
    );
}

// ── Step: Example select ──────────────────────────────────────────────────────

function ExampleSelectStep({ onSelect, onBack }: {
    onSelect: (spec: AgentSpec, label: string) => void;
    onBack: () => void;
}) {
    useInput((_, key) => { if (key.escape) onBack(); });
    return (
        <Box flexDirection="column" gap={1} paddingLeft={2} paddingTop={1}>
            <Text bold>Try an Example</Text>
            <Text dimColor>Select an example agent spec:</Text>
            <SelectInput
                items={[
                    ...EXAMPLES.map((e, i) => ({
                        label: `${e.label}  (${e.scenarios} scenarios, ${e.tools} tools)`,
                        value: String(i),
                    })),
                    { label: '← Back', value: '__back__' },
                ]}
                onSelect={item => {
                    if (item.value === '__back__') { onBack(); return; }
                    try {
                        const ex = EXAMPLES[Number(item.value)];
                        const spec = parseYamlText(ex.yaml);
                        onSelect(spec, ex.label);
                    } catch {
                        onBack();
                    }
                }}
            />
            <Text dimColor>  ↑↓ navigate  ·  Enter select  ·  Esc back</Text>
        </Box>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
    const [step, setStep] = useState<Step>({ kind: 'menu' });
    const specPathRef = useRef('');

    function handleMenuSelect(value: string) {
        if (value === 'evaluate')  setStep({ kind: 'input', value: '' });
        if (value === 'example')   setStep({ kind: 'example-select' });
        if (value === 'providers') setStep({ kind: 'providers-list' });
        if (value === 'models')    setStep({ kind: 'models-list' });
        if (value === 'history')   setStep({ kind: 'history' });
        if (value === 'about')     setStep({ kind: 'about' });
    }

    function openHistoryEntry(entry: HistoryEntry) {
        const raw: { model: string; metrics: ScenarioMetrics[] }[] =
            JSON.parse(fs.readFileSync(entry.filePath, 'utf8'));
        // Reconstruct flow from traces (deduplicated, first-seen order across all models/scenarios)
        const stepMap = new Map<string, { step: string; tool?: string }>();
        for (const r of raw)
            for (const m of r.metrics)
                for (const run of m.runs ?? [])
                    for (const t of (run.trace ?? []) as TraceEntry[])
                        if (!stepMap.has(t.step)) stepMap.set(t.step, { step: t.step, tool: t.toolName });
        const mockSpec: AgentSpec = {
            agent: { name: entry.agentName, description: '', instruction: '' },
            tools: [],
            flow: [...stepMap.values()].map(s => ({ step: s.step, tool: s.tool, inputFrom: undefined, condition: undefined })),
            scenarios: raw.flatMap(r => r.metrics.map(m => ({
                name: m.scenarioName,
                input: '',
                context: {},
                expectedPath: [...new Set(m.runs.flatMap(run => (run.trace ?? []).map((t: TraceEntry) => t.step)))],
                expectedTools: [],
                expectedOutcome: {},
                mockOverride: undefined,
            }))),
            providers: [],
        };
        setStep({ kind: 'results', spec: mockSpec, results: raw, savedAt: entry.savedAt });
    }

    function handlePathSubmit(filePath: string) {
        const trimmed = filePath.trim();
        if (!trimmed) return;
        specPathRef.current = trimmed;
        try {
            const spec = parse(trimmed);
            setStep({ kind: 'provider-select', spec, specPath: trimmed });
            addRecentPath(trimmed);
        } catch (e) {
            setStep({ kind: 'input', value: trimmed, error: String(e instanceof Error ? e.message : e) });
        }
    }

    function handleProvidersSelected(providers: Provider[], spec: AgentSpec) {
        setStep({ kind: 'running', spec, providers });
    }

    // ── Provider form helpers ────────────────────────────────────────────────

    function startProviderForm(preset: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom') {
        const p = PRESETS[preset];
        setStep({
            kind: 'providers-form',
            preset,
            fields: {
                name:    p.label,
                model:   p.defaultModel,
                apiKey:  '',
                baseUrl: p.baseUrl,
            },
            activeField: 0,
        });
    }

    function handleFormFieldSubmit(step: Extract<Step, { kind: 'providers-form' }>) {
        const isCustom = step.preset === 'custom';
        const totalFields = isCustom ? 4 : 2;  // preset: name + apiKey only

        if (step.activeField < totalFields - 1) {
            setStep({ ...step, activeField: step.activeField + 1 });
        } else {
            // All fields filled — build correct SavedProvider variant
            const saved: SavedProvider = isCustom
                ? { kind: 'custom', name: step.fields.name, model: step.fields.model,
                    apiKey: step.fields.apiKey, baseUrl: step.fields.baseUrl }
                : { kind: 'predefined', preset: step.preset as 'openai' | 'anthropic' | 'google',
                    name: step.fields.name, apiKey: step.fields.apiKey,
                    baseUrl: PRESETS[step.preset].baseUrl };
            addProvider(saved);
            setStep({ kind: 'providers-list' });
        }
    }

    return (
        <Box flexDirection="column" paddingX={2}>
            <Logo />

            {step.kind === 'menu' && (
                <MenuStep onSelect={handleMenuSelect} />
            )}

            {step.kind === 'example-select' && (
                <ExampleSelectStep
                    onSelect={(spec, label) => {
                        specPathRef.current = `example:${label}`;
                        const demoResults = DEMO_RESULTS[label];
                        if (demoResults) {
                            setStep({ kind: 'results', spec, results: demoResults, isDemoMode: true });
                        } else {
                            setStep({ kind: 'provider-select', spec, specPath: specPathRef.current });
                        }
                    }}
                    onBack={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'providers-list' && (
                <ProvidersListStep
                    onSelect={(name, index) => setStep({ kind: 'providers-detail', providerName: name, providerIndex: index })}
                    onAdd={() => setStep({ kind: 'providers-preset-select' })}
                    onBack={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'providers-detail' && (
                <ProvidersDetailStep
                    providerName={step.providerName}
                    providerIndex={step.providerIndex}
                    onDelete={() => {
                        deleteProvider(step.providerIndex);
                        setStep({ kind: 'providers-list' });
                    }}
                    onBack={() => setStep({ kind: 'providers-list' })}
                />
            )}

            {step.kind === 'providers-preset-select' && (
                <ProvidersPresetSelectStep
                    onSelect={startProviderForm}
                    onBack={() => setStep({ kind: 'providers-list' })}
                />
            )}

            {step.kind === 'providers-form' && (
                <ProvidersFormStep
                    preset={step.preset}
                    fields={step.fields}
                    activeField={step.activeField}
                    onChange={(key, value) =>
                        setStep({ ...step, fields: { ...step.fields, [key]: value } })
                    }
                    onSubmitField={() => handleFormFieldSubmit(step)}
                    onNavigate={delta => {
                        const totalFields = step.preset === 'custom' ? 4 : 2;
                        const next = Math.max(0, Math.min(totalFields - 1, step.activeField + delta));
                        setStep({ ...step, activeField: next });
                    }}
                    onBack={() => setStep({ kind: 'providers-preset-select' })}
                />
            )}

            {step.kind === 'input' && (
                <InputStep
                    value={step.value}
                    error={step.error}
                    onChange={v => setStep({ kind: 'input', value: v })}
                    onSubmit={handlePathSubmit}
                    onBack={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'provider-select' && (
                <ProviderSelectStep
                    spec={step.spec}
                    onSelect={providers => handleProvidersSelected(providers, step.spec)}
                    onBack={() => setStep({ kind: 'input', value: step.specPath })}
                />
            )}

            {step.kind === 'running' && (
                <RunningStep
                    spec={step.spec}
                    providers={step.providers}
                    onComplete={r => {
                        const baseName = path.basename(specPathRef.current, path.extname(specPathRef.current));
                        autoSaveToHistory(r, baseName);
                        const savedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
                        setStep({ kind: 'results', spec: step.spec, results: r, savedAt });
                    }}
                    onCancel={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'results' && (
                <ResultsStep spec={step.spec} results={step.results} specPath={specPathRef.current} savedAt={step.savedAt} isDemoMode={step.isDemoMode} onBack={() => setStep({ kind: 'menu' })} />
            )}

            {step.kind === 'history' && (
                <HistoryStep
                    onOpen={openHistoryEntry}
                    onBack={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'models-list' && (
                <ModelsListStep
                    onShow={id => setStep({ kind: 'models-detail', modelId: id })}
                    onBack={() => setStep({ kind: 'menu' })}
                />
            )}

            {step.kind === 'models-detail' && (
                <ModelsDetailStep
                    modelId={step.modelId}
                    onBack={() => setStep({ kind: 'models-list' })}
                />
            )}

            {step.kind === 'about' && (
                <AboutStep onBack={() => setStep({ kind: 'menu' })} />
            )}
        </Box>
    );
}
