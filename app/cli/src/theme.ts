// ── Design Tokens ────────────────────────────────────────────────────────────
// Centralized visual constants for the VRunAI TUI.

export const colors = {
    success:  'green',
    error:    'red',
    warning:  'yellow',
    focus:    'cyan',
    tool:     'magenta',
} as const;

export const spacing = {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 7,
} as const;

export const symbols = {
    check:     '✓',
    cross:     '✗',
    cursor:    '❯',
    expand:    '▶',
    collapse:  '▼',
    pipe:      '│',
    separator: '─',
    add:       '＋',
    back:      '←',
    arrow:     '→',
    dot:       '·',
    filled:    '█',
    empty:     '░',
    warning:   '⚠',
    disabled:  '–',
} as const;

export const borders = {
    primary:   'round',
    secondary: 'single',
} as const;

export const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

/** Returns a semantic color for a metric value (0–1). */
export function metricColor(v: number): string {
    return v === 1 ? colors.success : v >= 0.8 ? colors.warning : colors.error;
}

/** Format milliseconds as human-readable duration. */
export function msStr(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
}

/** Mask an API key for display. Shows last 4 characters. */
export function maskApiKey(key: string): string {
    return key.length > 4 ? `···${key.slice(-4)}` : '····';
}
