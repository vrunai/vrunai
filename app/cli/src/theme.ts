// ── Design Tokens ────────────────────────────────────────────────────────────
// Centralized visual constants for the VRunAI TUI.

export const colors = {
    success:  'green',
    error:    'red',
    warning:  'yellow',
    focus:    'cyan',
    tool:     'magenta',
    muted:    'gray',
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
    panel:     'round',
    detail:    'single',
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

/** Truncate a string with ellipsis if it exceeds max length. */
export function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Format a USD cost value for display. */
export function fmtCost(usd: number): string {
    return '$' + usd.toFixed(4);
}
