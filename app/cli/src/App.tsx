import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Text, Spacer, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ScenarioRunner, makeProvider as coreProvider, parseYamlText, EXAMPLES, testConnection, DEMO_RESULTS } from '@vrunai/core';
import { parse, saveResults, autoSaveToHistory, loadModelConfig, validateUserModelConfig } from '@vrunai/core/node';
import type { AgentSpec, ScenarioMetrics, ProviderRef, Scenario, Flow, TraceEntry } from '@vrunai/types';
import type { ModelConfig, Provider, ProviderKind } from '@vrunai/core';
import { Logo } from './components/Logo.js';
import { Badge, Bar, Pct, Panel, Separator, StatusBar, StatusIcon, KeyValue, MenuSelect } from './components/primitives/index.js';
import { ScreenLayout } from './components/layout/ScreenLayout.js';
import { useSpinner } from './hooks/useSpinner.js';
import { useElapsed, fmtElapsed } from './hooks/useElapsed.js';
import { colors, symbols, spacing, borders, msStr, maskApiKey, truncate, fmtCost } from './theme.js';
import { loadConfig, addProvider, deleteProvider, addRecentPath, getRecentPaths, type SavedProvider } from './config.js';

const PKG_VERSION = '0.1.1';

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
    | { kind: 'providers-test'; providerName: string }
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

// ── Scenario row ──────────────────────────────────────────────────────────────

function ScenarioRow({ name, progress, spinner }: { name: string; progress: ScenarioProgress; spinner: string }) {
    const { done, total } = progress;
    const finished = done >= total;
    const started  = done > 0;
    const state = finished ? 'success' as const : started ? 'running' as const : 'pending' as const;

    return (
        <Box gap={1}>
            <Box width={2}><StatusIcon state={state} spinner={spinner} /></Box>
            <Box width={32}><Text>{truncate(name, 32)}</Text></Box>
            <Bar done={done} total={total} />
            <Text dimColor>  {done}/{total}</Text>
        </Box>
    );
}

// ── Step: Menu ────────────────────────────────────────────────────────────────

function MenuStep({ onSelect }: { onSelect: (value: string) => void }) {
    const config = loadConfig();
    const providerCount = config.providers.length;
    const providerNames = config.providers.slice(0, 3).map(p => p.name).join(', ');
    const historyCount = scanHistoryEntries().length;
    const lastRun = scanHistoryEntries()[0];

    const menuItems = [
        { label: 'Evaluate',        description: 'Run specs against LLM providers', value: 'evaluate' },
        { label: 'LLM Providers',   description: `${providerCount} configured`,     value: 'providers' },
        { label: 'Model Catalog',   description: 'Browse pricing & capabilities',   value: 'models' },
        { label: 'History',         description: `${historyCount} past runs`,        value: 'history' },
        { label: 'Try an Example',  description: 'Quick demo with built-in specs',  value: 'example' },
        { label: 'About',           description: 'Version, links, license',         value: 'about' },
    ];

    return (
        <Box flexDirection="column" paddingX={1}>
            <Box paddingLeft={spacing.sm}>
                <Text dimColor>Validate & Run AI Agents</Text>
                <Spacer />
                <Text dimColor>v{PKG_VERSION}</Text>
            </Box>
            <Panel>
                <MenuSelect items={menuItems} onSelect={onSelect} />
            </Panel>
            {(providerCount > 0 || lastRun) && (
                <Panel title="Quick Status" titleColor={colors.muted}>
                    <Box>
                        {providerCount > 0 && <Text dimColor>Providers: {providerNames}</Text>}
                        <Spacer />
                        {lastRun && <Text dimColor>Last run: {lastRun.savedAt}</Text>}
                    </Box>
                </Panel>
            )}
            <StatusBar items={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'select' }, { key: 'q', action: 'quit' }]} />
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
    const providers = loadConfig().providers;
    const [cursor, setCursor] = useState(0);
    const totalItems = providers.length + 1; // providers + "Add"

    useInput((_, key) => {
        if (key.escape) onBack();
        if (key.upArrow)   setCursor(i => Math.max(0, i - 1));
        if (key.downArrow) setCursor(i => Math.min(totalItems - 1, i + 1));
        if (key.return) {
            if (cursor < providers.length) onSelect(providers[cursor].name, cursor);
            else onAdd();
        }
    });

    return (
        <ScreenLayout title="LLM Providers"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'detail' }, { key: 'Esc', action: 'back' }]}
            statusLeft={`${providers.length} provider${providers.length !== 1 ? 's' : ''}`}>
            <Panel>
                {providers.length === 0 && (
                    <Text dimColor>No providers saved yet.</Text>
                )}
                {providers.length > 0 && (
                    <Box gap={1}>
                        <Box width={3}><Text> </Text></Box>
                        <Box width={20}><Text dimColor bold>Name</Text></Box>
                        <Box width={12}><Text dimColor bold>Type</Text></Box>
                        <Box width={10}><Text dimColor bold>Key</Text></Box>
                    </Box>
                )}
                {providers.length > 0 && <Separator paddingLeft={spacing.sm} />}
                {providers.map((p, i) => {
                    const focused = i === cursor;
                    return (
                        <Box key={`p-${i}`} gap={1}>
                            <Text color={focused ? colors.focus : undefined}>{focused ? symbols.cursor : ' '}</Text>
                            <Box width={20}><Text color={focused ? colors.focus : undefined}>{truncate(p.name, 19)}</Text></Box>
                            <Box width={12}><Text dimColor={!focused}>{truncate(p.kind === 'predefined' ? p.preset : 'custom', 11)}</Text></Box>
                            <Box width={10}><Text dimColor>{maskApiKey(p.apiKey)}</Text></Box>
                        </Box>
                    );
                })}
                {providers.length > 0 && <Text> </Text>}
                <Box gap={1}>
                    <Text color={cursor === providers.length ? colors.focus : undefined}>
                        {cursor === providers.length ? symbols.cursor : ' '}
                    </Text>
                    <Text color={cursor === providers.length ? colors.focus : undefined}>
                        {symbols.add} Add provider
                    </Text>
                </Box>
            </Panel>
        </ScreenLayout>
    );
}

// ── Step: Provider detail ─────────────────────────────────────────────────────

function ProvidersDetailStep({
    providerIndex,
    onDelete,
    onTest,
    onBack,
}: {
    providerName: string;
    providerIndex: number;
    onDelete: () => void;
    onTest: () => void;
    onBack: () => void;
}) {
    const provider = loadConfig().providers[providerIndex];
    const [cursor, setCursor] = useState(0);
    const actions = ['test', 'delete'] as const;

    useInput((_, key) => {
        if (key.escape) onBack();
        if (key.upArrow)   setCursor(i => Math.max(0, i - 1));
        if (key.downArrow) setCursor(i => Math.min(actions.length - 1, i + 1));
        if (key.return) {
            if (actions[cursor] === 'test') onTest();
            else onDelete();
        }
    });

    if (!provider) {
        return (
            <ScreenLayout title="Provider Detail" helpItems={[{ key: 'Esc', action: 'back' }]}>
                <Text color={colors.error}>Provider not found.</Text>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="Provider Detail"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'select' }, { key: 'Esc', action: 'back' }]}>
            <Panel title={provider.name} titleColor={colors.focus}>
                <KeyValue label="Provider:">{provider.kind === 'predefined' ? provider.preset : 'custom'}</KeyValue>
                <KeyValue label="Model:"><Text color={colors.focus}>{provider.kind === 'custom' ? provider.model : '(preset)'}</Text></KeyValue>
                <KeyValue label="Base URL:">{provider.baseUrl}</KeyValue>
                <KeyValue label="API key:">{maskApiKey(provider.apiKey)}</KeyValue>
            </Panel>
            <Panel title="Actions">
                {actions.map((action, i) => {
                    const focused = i === cursor;
                    const label = action === 'test' ? 'Test Connection' : 'Delete';
                    const c = action === 'delete' ? colors.error : undefined;
                    return (
                        <Box key={action} gap={1}>
                            <Text color={focused ? colors.focus : undefined}>{focused ? symbols.cursor : ' '}</Text>
                            <Text color={focused ? colors.focus : c}>{label}</Text>
                        </Box>
                    );
                })}
            </Panel>
        </ScreenLayout>
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
        <ScreenLayout title="Add Provider"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'select' }, { key: 'Esc', action: 'back' }]}>
            <Panel>
                <Text dimColor>Select a provider type:</Text>
                <SelectInput
                    items={PRESET_ITEMS}
                    onSelect={item => {
                        onSelect(item.value as 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom');
                    }}
                />
            </Panel>
        </ScreenLayout>
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
        <ScreenLayout title={`Add Provider (${PRESETS[preset].label})`}
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'advance' }, { key: 'Esc', action: 'back' }]}>
            <Panel>
                {!isCustom && (
                    <Text dimColor>Base URL: {PRESETS[preset].baseUrl}</Text>
                )}
                <Box flexDirection="column" gap={0} marginTop={isCustom ? 0 : 1}>
                    {visibleFields.map((key, idx) => {
                        const isActive = idx === activeField;
                        return (
                            <Box key={key} gap={1}>
                                <Box width={14}>
                                    <Text color={isActive ? colors.focus : undefined} dimColor={!isActive}>
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
                {warn && <Text color={colors.warning}>This field is required</Text>}
            </Panel>
        </ScreenLayout>
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
                        <Text color={isFocused && !isDisabled ? colors.focus : undefined}>{isFocused ? symbols.cursor : ' '}</Text>
                        {isDisabled
                            ? <Text dimColor>[{symbols.disabled}]</Text>
                            : <Text color={isSelected ? colors.focus : undefined} dimColor={!isSelected && !isFocused}>{isSelected ? '[x]' : '[ ]'}</Text>
                        }
                        <Text
                            color={isFocused && !isDisabled ? colors.focus : undefined}
                            dimColor={isDisabled || (!isSelected && !isFocused)}
                        >
                            {item.label}
                        </Text>
                    </Box>
                );
            })}
            {warn && (
                <Box marginTop={1}>
                    <Text color={colors.warning}>  Select at least one provider first</Text>
                </Box>
            )}
            {warn ? null : <Box marginTop={1} />}
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
        useInput((_, key) => { if (key.escape) onBack(); });
        return (
            <ScreenLayout title="Select Providers" helpItems={[{ key: 'Esc', action: 'back' }]}>
                <Panel>
                    <Text color={colors.warning}>No matching providers with API keys. Add one via LLM Providers.</Text>
                </Panel>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="Select Providers"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Space', action: 'toggle' }, { key: 'Enter', action: 'run' }, { key: 'Esc', action: 'back' }]}>
            <Text dimColor>{spec.agent.name}</Text>
            {!hasSelectable && (
                <Text color={colors.warning}>No providers configured. Add API keys via LLM Providers.</Text>
            )}
            <Panel>
                <MultiSelectList
                    items={items}
                    initialSelected={eligible.map(e => e.value)}
                    onConfirm={handleConfirm}
                    onBack={onBack}
                />
            </Panel>
        </ScreenLayout>
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
    const recentPaths = useMemo(() => getRecentPaths(), []);

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
        <ScreenLayout title="Evaluate"
            helpItems={[{ key: 'Tab', action: 'cycle' }, { key: 'Enter', action: 'confirm' }, { key: 'Esc', action: 'back' }]}>
            <Panel borderColor={error ? colors.error : colors.muted}>
                <Box gap={1}>
                    <Text dimColor>Path to spec file:</Text>
                    <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
                </Box>
                {error && <Text color={colors.error}>{symbols.cross} {error}</Text>}
                {suggestions.length > 0 && (
                    <Box flexDirection="column" paddingLeft={spacing.sm} marginTop={1}>
                        {suggestions.map((s, i) => (
                            <Box key={s} gap={1}>
                                <Text color={i === selectedIdx ? colors.focus : undefined}>
                                    {i === selectedIdx ? symbols.cursor : ' '}
                                </Text>
                                <Text color={i === selectedIdx ? colors.focus : undefined} dimColor={i !== selectedIdx}>
                                    {s}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Panel>
            {recentPaths.length > 0 && !value && (
                <Panel title="Recent" titleColor={colors.muted}>
                    {recentPaths.slice(0, 3).map(p => (
                        <Box key={p} gap={1}>
                            <Text dimColor>{symbols.dot}</Text>
                            <Text dimColor>{p}</Text>
                        </Box>
                    ))}
                </Panel>
            )}
        </ScreenLayout>
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

    const elapsed = useElapsed();
    const pctDone = totalRuns > 0 ? Math.round((doneTotal / totalRuns) * 100) : 0;

    const eta = doneTotal >= 2 && doneTotal < totalRuns
        ? `ETA: ~${fmtElapsed(Math.round(elapsed * (totalRuns / doneTotal) - elapsed))}`
        : '';

    if (cancelled) {
        return (
            <ScreenLayout title="Running" helpItems={[{ key: 'Esc', action: 'back' }]}>
                <Panel borderColor={colors.warning}>
                    <Text color={colors.warning}>Cancelling… waiting for current run to finish</Text>
                </Panel>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="Running"
            helpItems={[{ key: 'Esc', action: 'cancel' }]}
            statusLeft={`Elapsed: ${fmtElapsed(elapsed)}`}>
            <Text dimColor>{spec.agent.name}  {symbols.dot}  {runsPerScenario} runs/scenario</Text>

            {/* Overall progress panel */}
            <Panel title="Overall" titleColor={colors.focus} borderColor={colors.focus}>
                <Bar done={doneTotal} total={totalRuns} width={Math.min(Math.max(20, (process.stdout.columns ?? 80) - 20), 60)} />
                <Box>
                    <Text dimColor>{doneTotal}/{totalRuns} runs  ({pctDone}%)</Text>
                    <Spacer />
                    {eta && <Text dimColor>{eta}</Text>}
                </Box>
            </Panel>

            {/* Per-provider panels */}
            {providers.map(provider => {
                const model       = provider.getConfig().model;
                const innerMap    = progress.get(model)!;
                return (
                    <Panel key={model} title={model} titleColor={colors.focus}>
                        {spec.scenarios.map(s => (
                            <ScenarioRow
                                key={s.name}
                                name={s.name}
                                progress={innerMap.get(s.name)!}
                                spinner={spinner}
                            />
                        ))}
                    </Panel>
                );
            })}
        </ScreenLayout>
    );
}

// ── Results: scenario summary row ─────────────────────────────────────────────

function ScenarioSummaryRow({ m, isFocused, isExpanded }: {
    m: ScenarioMetrics; isFocused: boolean; isExpanded: boolean;
}) {
    const pass       = m.path_accuracy === 1 && m.tool_accuracy === 1 && m.outcome_accuracy === 1;
    const passedRuns = m.runs.filter(r => r.pathMatch && r.toolMatch && r.outcomeMatch).length;
    return (
        <Box gap={1} paddingLeft={spacing.sm}>
            <Text color={isFocused ? colors.focus : undefined}>{isFocused ? symbols.cursor : ' '}</Text>
            <StatusIcon state={pass ? 'success' : 'error'} />
            <Box width={30}><Text color={isFocused ? colors.focus : undefined}>{truncate(m.scenarioName, 30)}</Text></Box>
            <Pct value={m.path_accuracy} />
            <Pct value={m.tool_accuracy} />
            <Pct value={m.outcome_accuracy} />
            <Text dimColor>{passedRuns}/{m.runs.length}</Text>
            <Text dimColor>{fmtCost(m.total_cost_usd)}</Text>
            <Text dimColor>{isExpanded ? symbols.collapse : symbols.expand}</Text>
        </Box>
    );
}

// ── Results: flow graph (trace overlay) ───────────────────────────────────────

function FlowGraph({ flow, trace, scenario }: {
    flow: Flow[]; trace: TraceEntry[]; scenario: Scenario;
}) {
    /** Truncate a serialized value for display. */
    function truncVal(v: unknown): string {
        const s = JSON.stringify(v);
        return s.length > 60 ? s.slice(0, 57) + '...' : s;
    }
    function fmtEntries(obj: Record<string, unknown>): string {
        return Object.entries(obj).map(([k, v]) => `${k}: ${truncVal(v)}`).join('  ') || '—';
    }

    return (
        <Box flexDirection="column" marginTop={1}>
            <Text dimColor>Flow</Text>
            {flow.map((f, i) => {
                const entry    = trace.find(t => t.step === f.step);
                const expected = scenario.expectedPath?.includes(f.step) ?? false;
                const color    = entry
                    ? (expected ? colors.success : colors.warning)
                    : (expected ? colors.error   : undefined);
                return (
                    <Box key={f.step} flexDirection="column">
                        {i > 0 && <Box paddingLeft={spacing.sm}><Text dimColor>{symbols.pipe}</Text></Box>}
                        <Box gap={1} paddingLeft={spacing.sm}>
                            <Text dimColor>{symbols.collapse}</Text>
                            <Text color={color} bold={!!entry}>[{f.step}]</Text>
                            {f.tool && <Text dimColor>{symbols.arrow} {f.tool}</Text>}
                            {entry && <Text color={colors.success}>{symbols.check} t{entry.turn}  {msStr(entry.durationMs)}</Text>}
                            {!entry && expected  && <Text color={colors.error}>{symbols.cross} not called</Text>}
                            {!entry && !expected && <Text dimColor>{symbols.dot} skipped</Text>}
                        </Box>
                        {entry && (
                            <Box flexDirection="column" paddingLeft={spacing.lg}>
                                <Text dimColor>in:  {fmtEntries(entry.input)}</Text>
                                <Text dimColor>out: {fmtEntries(entry.output)}</Text>
                            </Box>
                        )}
                        {f.condition && (
                            <Box paddingLeft={spacing.lg}>
                                <Text dimColor>if {f.condition.if} {symbols.arrow} then: {f.condition.then}  else: {f.condition.else}</Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
            {trace.filter(t => t.step === '?').map((t, i) => (
                <Box key={i} flexDirection="column">
                    <Box paddingLeft={spacing.sm}><Text dimColor>{symbols.pipe}</Text></Box>
                    <Box gap={1} paddingLeft={spacing.sm}>
                        <Text dimColor>{symbols.collapse}</Text>
                        <Text color={colors.error}>[?]</Text>
                        <Text color={colors.tool}>{t.toolName}</Text>
                        <Text color={colors.error}>{symbols.cross} unexpected</Text>
                    </Box>
                    <Box flexDirection="column" paddingLeft={spacing.lg}>
                        <Text dimColor>in:  {fmtEntries(t.input)}</Text>
                        <Text dimColor>out: {fmtEntries(t.output)}</Text>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

// ── Results: scenario detail (expandable, any scenario) ───────────────────────

function ScenarioDetail({ m, scenario, flow, activeRunIdx, onRunNav }: {
    m: ScenarioMetrics; scenario: Scenario; flow: Flow[];
    activeRunIdx?: number; onRunNav?: (delta: -1 | 1) => void;
}) {
    const failedRuns  = m.runs.filter(r => !r.pathMatch || !r.toolMatch || !r.outcomeMatch);
    const runIdx      = activeRunIdx ?? (failedRuns.length > 0 ? m.runs.indexOf(failedRuns[0]) : 0);
    const run         = m.runs[runIdx];
    const runLabel    = failedRuns.length > 0
        ? `run ${runIdx + 1}/${m.runs.length} ${symbols.dot} ${failedRuns.length} failed`
        : `run ${runIdx + 1}/${m.runs.length} ${symbols.dot} all passed`;
    const hasMultiple = m.runs.length > 1;
    return (
        <Panel borderStyle={borders.detail} borderColor={colors.focus}>
            <Box gap={1}>
                <Text dimColor>{runLabel}</Text>
                {hasMultiple && <Text dimColor>({symbols.back}/{symbols.arrow} runs)</Text>}
            </Box>
            <FlowGraph flow={flow} trace={run.trace} scenario={scenario} />
            {!run.outcomeMatch && (
                <Box flexDirection="column" marginTop={1}>
                    <Text color={colors.error}>{symbols.cross} outcome mismatch</Text>
                    <Text dimColor>  expected: {JSON.stringify(scenario.expectedOutcome)}</Text>
                    <Text dimColor>  actual:   {JSON.stringify(run.finalOutput)}</Text>
                </Box>
            )}
        </Panel>
    );
}

// ── Results: per-model block ───────────────────────────────────────────────────

function ModelResultBlock({ model, metrics, scenarios, flow, focusedSi, expandedSis, runIndices, onRunNav }: {
    model: string;
    metrics: ScenarioMetrics[];
    scenarios: Scenario[];
    flow: Flow[];
    focusedSi: number;
    expandedSis: Set<number>;
    runIndices: Map<number, number>;
    onRunNav: (si: number, delta: -1 | 1) => void;
}) {
    const avgPath    = metrics.reduce((s, m) => s + m.path_accuracy,    0) / metrics.length;
    const avgTool    = metrics.reduce((s, m) => s + m.tool_accuracy,    0) / metrics.length;
    const avgOutcome = metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / metrics.length;
    const avgLatency = metrics.reduce((s, m) => s + m.avg_latency_ms,   0) / metrics.length;
    const totalCost  = metrics.reduce((s, m) => s + m.total_cost_usd,   0);
    const allPass    = metrics.every(m => m.runs.every(r => r.pathMatch && r.toolMatch && r.outcomeMatch));

    const COL_SCENARIO = 34; // 2 (cursor) + 2 (icon+gap) + 30 (name)

    return (
        <Panel borderColor={allPass ? colors.success : colors.error}>
            <Box gap={2}>
                <Text bold color={colors.focus}>{model}</Text>
                <Badge text={allPass ? 'PASS' : 'FAIL'} color={allPass ? colors.success : colors.error} />
                <Spacer />
                <Text dimColor>{msStr(avgLatency)} avg  {symbols.dot}  {fmtCost(totalCost)}</Text>
            </Box>
            <Box gap={1} paddingLeft={spacing.sm} marginTop={1}>
                <Box width={COL_SCENARIO}><Text dimColor>Scenario</Text></Box>
                <Text dimColor>path  tool   out  runs   cost</Text>
            </Box>
            <Separator paddingLeft={spacing.sm} />
            {metrics.map((m, si) => {
                const isFocused  = focusedSi === si;
                const isExpanded = expandedSis.has(si);
                const scenario   = scenarios.find(s => s.name === m.scenarioName);
                return (
                    <Box key={m.scenarioName} flexDirection="column">
                        <ScenarioSummaryRow m={m} isFocused={isFocused} isExpanded={isExpanded} />
                        {isExpanded && scenario && (
                            <ScenarioDetail m={m} scenario={scenario} flow={flow} activeRunIdx={runIndices.get(si)} onRunNav={(delta) => onRunNav(si, delta)} />
                        )}
                    </Box>
                );
            })}
            <Separator paddingLeft={spacing.sm} />
            <Box gap={1} paddingLeft={spacing.md}>
                <Box width={32}><Text bold>Average</Text></Box>
                <Pct value={avgPath} />
                <Pct value={avgTool} />
                <Pct value={avgOutcome} />
            </Box>
        </Panel>
    );
}

// ── Results: comparison table (multi-model) ────────────────────────────────────

function ComparisonTable({ results }: { results: { model: string; metrics: ScenarioMetrics[] }[] }) {
    const scenarioNames = results[0].metrics.map(m => m.scenarioName);
    const maxModelLen = Math.max(...results.map(r => r.model.length));
    const COL = Math.max(20, maxModelLen + 2);
    const NAME_COL = 34;
    return (
        <Panel title="Model Comparison">
            <Box paddingLeft={spacing.sm} marginTop={1}>
                <Box width={NAME_COL}><Text> </Text></Box>
                {results.map(r => <Box key={r.model} width={COL}><Text bold>{truncate(r.model, COL - 2)}</Text></Box>)}
            </Box>
            <Box paddingLeft={spacing.sm}>
                <Box width={NAME_COL}><Text> </Text></Box>
                {results.map(r => <Box key={r.model} width={COL}><Text dimColor>path  tool  out</Text></Box>)}
            </Box>
            <Separator paddingLeft={spacing.sm} />
            {scenarioNames.map(name => (
                <Box key={name} paddingLeft={spacing.sm}>
                    <Box width={NAME_COL}><Text>{truncate(name, 32)}</Text></Box>
                    {results.map(r => {
                        const m = r.metrics.find(x => x.scenarioName === name);
                        return m
                            ? <Box key={r.model} width={COL} gap={1}><Pct value={m.path_accuracy} /><Pct value={m.tool_accuracy} /><Pct value={m.outcome_accuracy} /></Box>
                            : <Box key={r.model} width={COL} />;
                    })}
                </Box>
            ))}
            <Separator paddingLeft={spacing.sm} />
            <Box paddingLeft={spacing.sm}>
                <Box width={NAME_COL}><Text bold>Average</Text></Box>
                {results.map(r => {
                    const avgP = r.metrics.reduce((s, m) => s + m.path_accuracy,    0) / r.metrics.length;
                    const avgT = r.metrics.reduce((s, m) => s + m.tool_accuracy,    0) / r.metrics.length;
                    const avgO = r.metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / r.metrics.length;
                    return <Box key={r.model} width={COL} gap={1}><Pct value={avgP} /><Pct value={avgT} /><Pct value={avgO} /></Box>;
                })}
            </Box>
            <Box paddingLeft={spacing.sm}>
                <Box width={NAME_COL}><Text dimColor>Cost</Text></Box>
                {results.map(r => {
                    const total = r.metrics.reduce((s, m) => s + m.total_cost_usd, 0);
                    return <Box key={r.model} width={COL}><Text dimColor>{fmtCost(total)}</Text></Box>;
                })}
            </Box>
        </Panel>
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
    passed: boolean;
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
                const raw: { model: string; metrics: { scenarioName: string; path_accuracy?: number; tool_accuracy?: number; outcome_accuracy?: number }[] }[] =
                    JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const models = raw.map(r => r.model);
                const passed = raw.every(r => r.metrics.every(m =>
                    (m.path_accuracy ?? 0) === 1 && (m.tool_accuracy ?? 0) === 1 && (m.outcome_accuracy ?? 0) === 1));
                entries.push({
                    filePath,
                    agentName,
                    models: models.length === 1 ? models[0] : `${models[0]} +${models.length - 1}`,
                    scenarioCount: raw[0]?.metrics?.length ?? 0,
                    savedAt: displayDate,
                    sortKey: ts,
                    passed,
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
            <ScreenLayout title="History" helpItems={[{ key: 'Esc', action: 'back' }]}>
                <Panel>
                    <Text dimColor>No runs saved yet. Complete an eval to populate history.</Text>
                </Panel>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="History"
            helpItems={pendingDelete
                ? [{ key: 'y', action: 'confirm delete' }, { key: 'any key', action: 'cancel' }]
                : [{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'open' }, { key: 'd', action: 'delete' }, { key: 'Esc', action: 'back' }]}
            statusLeft={`${entries.length} run${entries.length !== 1 ? 's' : ''}`}>
            <Panel>
                <Box gap={1}>
                    <Box width={4}><Text> </Text></Box>
                    <Box width={30}><Text dimColor bold>Name</Text></Box>
                    <Box width={22}><Text dimColor bold>Model</Text></Box>
                    <Box width={10}><Text dimColor bold>Scenarios</Text></Box>
                    <Text dimColor bold>Date</Text>
                </Box>
                <Separator />
                {entries.map((e, i) => {
                    const focused = i === cursor;
                    return (
                        <Box key={e.filePath} gap={1}>
                            <Text color={focused ? colors.focus : undefined}>{focused ? symbols.cursor : ' '}</Text>
                            <StatusIcon state={e.passed ? 'success' : 'error'} />
                            <Box width={30}><Text color={focused ? colors.focus : undefined}>{truncate(e.agentName, 29)}</Text></Box>
                            <Box width={22}><Text dimColor={!focused}>{truncate(e.models, 21)}</Text></Box>
                            <Box width={10}><Text dimColor={!focused}>{e.scenarioCount}</Text></Box>
                            <Text dimColor={!focused}>{e.savedAt}</Text>
                        </Box>
                    );
                })}
            </Panel>
            {pendingDelete && entries.length > 0 && (
                <Text color={colors.warning}>  Delete "{entries[cursor].agentName}"?</Text>
            )}
        </ScreenLayout>
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
        const lineColor = allPass ? colors.success : allFail ? colors.error : colors.warning;
        const icon      = allPass ? symbols.check : allFail ? symbols.cross : symbols.warning;
        lines.push({ text: `${icon} ${r.model}  ${pctStr(avgPath)} path / ${pctStr(avgTool)} tool / ${pctStr(avgOut)} outcome · ${fmtCost(totalCost)}  ${Math.round(avgLat)}ms avg`, color: lineColor });
        if (!allFail) {
            for (const m of r.metrics) {
                if (m.path_accuracy < 1) {
                    lines.push({ text: `  ${symbols.warning} ${m.scenarioName}: ${pctStr(m.path_accuracy)} path accuracy`, color: colors.warning });
                    break;
                }
            }
            for (const m of r.metrics) {
                if (m.consistency < 1) {
                    lines.push({ text: `  ${symbols.warning} Inconsistent values in ${m.scenarioName} across runs — check trace`, color: colors.warning });
                    break;
                }
            }
        }
    }
    return (
        <Panel title="Summary" borderColor={colors.focus}>
            {lines.map((l, i) => (
                <Text key={i} color={l.color}>{l.text}</Text>
            ))}
        </Panel>
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
    const [runIndices, setRunIndices] = useState(new Map<string, number>());

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

    function handleRunNav(mi: number, si: number, delta: -1 | 1) {
        const key = `${mi}:${si}`;
        const total = results[mi].metrics[si].runs.length;
        setRunIndices(prev => {
            const next = new Map(prev);
            const cur = next.get(key) ?? 0;
            next.set(key, Math.max(0, Math.min(total - 1, cur + delta)));
            return next;
        });
    }

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
        // Left/right: navigate runs if current scenario is expanded, otherwise navigate sections
        const currentItem = allItems[cursorIdx];
        const currentKey = currentItem?.key;
        if (key.leftArrow) {
            if (currentKey && expanded.has(currentKey)) handleRunNav(currentItem.mi, currentItem.si, -1);
            else setSectionIdx(i => Math.max(0, i - 1));
        }
        if (key.rightArrow) {
            if (currentKey && expanded.has(currentKey)) handleRunNav(currentItem.mi, currentItem.si, 1);
            else setSectionIdx(i => Math.min(sections.length - 1, i + 1));
        }
        if (input === 's' && !isDemoMode) setSavedPath(saveResults(results, path.dirname(specPath), path.basename(specPath, path.extname(specPath))));
        if (key.escape) onBack();
    });

    const section = sections[sectionIdx];

    return (
        <ScreenLayout title="Results"
            helpItems={[{ key: '↑↓', action: 'scenario' }, { key: '←→', action: 'section/runs' }, { key: 'Space', action: 'expand' }, { key: 's', action: 'save' }, { key: 'Esc', action: 'menu' }]}>
            {/* Header */}
            <Box gap={2}>
                <Text bold>{spec.agent.name}</Text>
                {isDemoMode && <Badge text="demo mode" color={colors.warning} />}
                {savedAt && <Badge text={`saved ${symbols.dot} ${savedAt}`} color={colors.muted} />}
            </Box>

            {/* Section tabs in panel */}
            <Panel>
                <Box gap={1}>
                    {sections.map((s, i) => {
                        const label = s.type === 'model' ? results[s.mi].model
                            : s.type === 'comparison' ? 'Comparison'
                            : 'Summary';
                        return i === sectionIdx
                            ? <Text key={i} inverse color={colors.focus}> {label} </Text>
                            : <Text key={i} dimColor> {label} </Text>;
                    })}
                </Box>
            </Panel>

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
                        runIndices={new Map(r.metrics.map((_, si) => [si, runIndices.get(`${mi}:${si}`) ?? 0]))}
                        onRunNav={(si, delta) => handleRunNav(mi, si, delta)}
                    />
                );
            })()}

            {section.type === 'comparison' && <ComparisonTable results={results} />}

            {section.type === 'summary' && <SummaryBlock results={results} />}

            {savedPath && <Text color={colors.success}>  {symbols.check} saved {symbols.arrow} {savedPath}</Text>}
        </ScreenLayout>
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

    // Header ≈ 5 rows, footer ≈ 2 rows (no logo on sub-screens)
    const maxVisible = Math.max(4, (process.stdout.rows ?? 24) - 7);

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
            if (r.valid)         setValidateMsg(`${symbols.check} Valid — ${r.count} model(s)`);
            else if (r.missing)  setValidateMsg('No user config at ~/.config/vrunai/models.json');
            else                 setValidateMsg(`${symbols.cross} ${r.errors.join('  ')}`);
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
                <Text color={focused ? colors.focus : undefined}>{focused ? `${symbols.cursor} ` : '  '}</Text>
                <Text color={focused ? colors.focus : undefined} dimColor={m.deprecated}>
                    {truncate(m.id, COL_ID).padEnd(COL_ID)}
                </Text>
                <Text dimColor={!focused}>{truncate(m.name, COL_NAME).padEnd(COL_NAME)}</Text>
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
        <ScreenLayout title="Models"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'detail' }, { key: 'v', action: 'validate config' }, { key: 'Esc', action: 'back' }]}
            statusLeft={`${orderedModels.length} models`}>
            <Panel>
                <Box gap={0}>
                    <Text dimColor>{''.padEnd(2)}</Text>
                    <Text dimColor bold>{'ID'.padEnd(COL_ID)}</Text>
                    <Text dimColor bold>{'Name'.padEnd(COL_NAME)}</Text>
                    <Text dimColor bold>{'Input/1M'.padStart(COL_IN)}</Text>
                    <Text dimColor bold>{'Output/1M'.padStart(COL_OUT)}</Text>
                    <Text dimColor bold>{'Context'.padStart(COL_CTX)}</Text>
                </Box>
                <Separator />
                {showScrollUp && <Text dimColor>  ↑ {viewportStart} more above</Text>}
                {visibleModels.map((m, vi) => {
                    const i = viewportStart + vi;
                    const sepBefore = i === activeModels.length && deprecatedModels.length > 0;
                    return (
                        <Box key={m.id} flexDirection="column" gap={0}>
                            {sepBefore && <Text dimColor>{'  ' + symbols.separator.repeat(2) + ' deprecated ' + symbols.separator.repeat(Math.max(0, COL_ID + COL_NAME + COL_IN + COL_OUT + COL_CTX - 14))}</Text>}
                            <ModelRow m={m} i={i} />
                        </Box>
                    );
                })}
                {showScrollDown && <Text dimColor>  ↓ {orderedModels.length - viewportStart - maxVisible} more below</Text>}
            </Panel>
            {validateMsg && (
                <Text color={validateMsg.startsWith(symbols.check) ? colors.success : colors.warning}>{validateMsg}</Text>
            )}
        </ScreenLayout>
    );
}

// ── Step: Models detail ────────────────────────────────────────────────────────

function ModelsDetailStep({ modelId, onBack }: { modelId: string; onBack: () => void }) {
    const model = loadModelConfig().find(m => m.id === modelId);

    useInput((_, key) => { if (key.escape) onBack(); });

    if (!model) {
        return (
            <ScreenLayout title="Model Detail" helpItems={[{ key: 'Esc', action: 'back' }]}>
                <Text color={colors.error}>Model not found: {modelId}</Text>
            </ScreenLayout>
        );
    }

    const check = (v: boolean) => <StatusIcon state={v ? 'success' : 'error'} />;
    const ctx = model.context_window >= 1_000_000
        ? (model.context_window / 1_000_000).toFixed(0) + 'M tokens'
        : (model.context_window / 1_000).toFixed(0) + 'k tokens';
    const titleSuffix = model.deprecated ? ` [deprecated]` : '';

    return (
        <ScreenLayout title="Model Detail" helpItems={[{ key: 'Esc', action: 'back' }]}>
            <Panel title={`${model.id} — ${model.name}${titleSuffix}`} titleColor={colors.focus}>
                <KeyValue label="Provider:">{model.provider}</KeyValue>
                <KeyValue label="Context:">{ctx}</KeyValue>
                <KeyValue label="Tools:">{check(model.supports_tools)}</KeyValue>
                <KeyValue label="Vision:">{check(model.supports_vision)}</KeyValue>
                <KeyValue label="Input pricing:">${model.pricing.input_per_1m_tokens.toFixed(3)} / 1M tokens</KeyValue>
                <KeyValue label="Output pricing:">${model.pricing.output_per_1m_tokens.toFixed(3)} / 1M tokens</KeyValue>
            </Panel>
        </ScreenLayout>
    );
}

// ── Step: About ───────────────────────────────────────────────────────────────

function AboutStep({ onBack }: { onBack: () => void }) {
    useInput((_, key) => { if (key.escape) onBack(); });
    return (
        <ScreenLayout title="About" helpItems={[{ key: 'Esc', action: 'back' }]}>
            <Panel title="vrunai" titleColor={colors.focus}>
                <KeyValue label="Version:">{PKG_VERSION}</KeyValue>
                <KeyValue label="Website:"><Text color={colors.focus}>https://vrunai.com</Text></KeyValue>
                <KeyValue label="Repository:"><Text color={colors.focus}>https://github.com/vrunai/vrunai</Text></KeyValue>
                <KeyValue label="License:">AGPL-3.0</KeyValue>
            </Panel>
        </ScreenLayout>
    );
}

// ── Step: Example select ──────────────────────────────────────────────────────

function ExampleSelectStep({ onSelect, onBack }: {
    onSelect: (spec: AgentSpec, label: string) => void;
    onBack: () => void;
}) {
    useInput((_, key) => { if (key.escape) onBack(); });
    return (
        <ScreenLayout title="Try an Example"
            helpItems={[{ key: '↑↓', action: 'navigate' }, { key: 'Enter', action: 'select' }, { key: 'Esc', action: 'back' }]}>
            <Panel>
                <Text dimColor>Select an example agent spec:</Text>
                <SelectInput
                    items={EXAMPLES.map((e, i) => ({
                        label: `${e.label}  (${e.scenarios} scenarios, ${e.tools} tools)`,
                        value: String(i),
                    }))}
                    onSelect={item => {
                        try {
                            const ex = EXAMPLES[Number(item.value)];
                            const spec = parseYamlText(ex.yaml);
                            onSelect(spec, ex.label);
                        } catch {
                            onBack();
                        }
                    }}
                />
            </Panel>
        </ScreenLayout>
    );
}

// ── Step: Provider test ───────────────────────────────────────────────────────

function ProviderTestStep({ providerName, onDone }: { providerName: string; onDone: () => void }) {
    const spinner = useSpinner();
    const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

    useInput((_, key) => { if (key.escape || key.return) onDone(); });

    useEffect(() => {
        const saved = loadConfig().providers.find(p => p.name === providerName);
        if (!saved) { setResult({ ok: false, error: 'Provider not found' }); return; }
        const kind = (saved.kind === 'custom' ? 'custom' : saved.kind === 'predefined' ? saved.preset : 'custom') as ProviderKind;
        const provider = coreProvider(kind, {
            model: saved.kind === 'custom' ? saved.model : PRESETS[saved.kind === 'predefined' ? saved.preset : 'openai'].defaultModel,
            apiKey: saved.apiKey,
            baseUrl: saved.baseUrl,
        });
        testConnection(provider).then(setResult);
    // eslint-disable-next-line
    }, []);

    return (
        <ScreenLayout title="Test Connection"
            helpItems={result ? [{ key: 'Enter', action: 'continue' }, { key: 'Esc', action: 'continue' }] : []}>
            <Panel title={providerName} titleColor={colors.focus}
                   borderColor={result?.ok ? colors.success : result && !result.ok ? colors.error : colors.muted}>
                {!result && <Text color={colors.warning}>{spinner} Sending test request…</Text>}
                {result?.ok && <Text color={colors.success}>{symbols.check} Connection successful</Text>}
                {result && !result.ok && (
                    <Box flexDirection="column">
                        <Text color={colors.error}>{symbols.cross} Connection failed</Text>
                        <Text dimColor>  {result.error}</Text>
                    </Box>
                )}
            </Panel>
        </ScreenLayout>
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
            setStep({ kind: 'providers-test', providerName: saved.name });
        }
    }

    return (
        <Box flexDirection="column" paddingX={1}>
            {step.kind === 'menu' && <Logo />}

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
                    onTest={() => setStep({ kind: 'providers-test', providerName: step.providerName })}
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

            {step.kind === 'providers-test' && (
                <ProviderTestStep
                    providerName={step.providerName}
                    onDone={() => setStep({ kind: 'providers-list' })}
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
