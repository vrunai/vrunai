// ── Design Tokens ────────────────────────────────────────────────────────────
// Centralized visual constants for the VRunAI TUI.

// Detect truecolor support (24-bit). Modern terminals (iTerm2, VS Code, kitty,
// Alacritty, WezTerm, Ghostty, Windows Terminal) support it. macOS Terminal.app
// and some older terminals do not — they get named ANSI colors instead.
const truecolor = process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit';

// Hex palette derived from logo gradient (cyan → indigo → pink).
// ANSI fallback uses named colors for maximum compatibility.
export const colors = truecolor ? {
    success:   '#34d399',  // soft emerald
    error:     '#f87171',  // soft coral
    warning:   '#fbbf24',  // warm amber
    focus:     '#22d3ee',  // brand cyan — interactive
    accent:    '#a78bfa',  // brand indigo — informational
    tool:      '#c084fc',  // purple
    muted:     '#6b7280',  // gray-500
    highlight: '#f472b6',  // brand pink
} : {
    success:   'green',
    error:     'red',
    warning:   'yellow',
    focus:     'cyan',
    accent:    'magenta',
    tool:      'magenta',
    muted:     'gray',
    highlight: 'magenta',
};

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

/** Returns a semantic color for a metric value (0-1). */
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
