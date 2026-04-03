// ── Design Tokens ────────────────────────────────────────────────────────────
// Centralized visual constants for the VRunAI TUI.

// Detect truecolor support (24-bit). Modern terminals (iTerm2, VS Code, kitty,
// Alacritty, WezTerm, Ghostty, Windows Terminal) support it. macOS Terminal.app
// and some older terminals do not — they get named ANSI colors instead.
const truecolor = process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit';

// Tokyo Night palette with ANSI fallback for compatibility.
export const colors = truecolor ? {
    success:   '#9ece6a',  // semantic green — pass, checkmarks
    error:     '#f7768e',  // semantic red — fail, errors
    warning:   '#e0af68',  // semantic amber — caution, medium scores
    focus:     '#7aa2f7',  // brand blue — interactive: cursor, selected, active
    accent:    '#7dcfff',  // cyan — informational: titles, links, labels
    tool:      '#bb9af7',  // purple — tool names in flow graph
    muted:     '#515670',  // muted — borders, secondary text, dim
    highlight: '#7aa2f7',  // blue — info emphasis
} : {
    success:   'green',
    error:     'red',
    warning:   'yellow',
    focus:     'magenta',
    accent:    'magenta',
    tool:      'magenta',
    muted:     'gray',
    highlight: 'blue',
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

/** Returns a semantic color for a metric value (0-1) using 4-tier scoring. */
export function metricColor(v: number): string {
    const pct = v * 100;
    if (pct >= 90) return colors.success;    // 90-100%: excellent
    if (pct >= 70) return colors.highlight;  // 70-89%: good (brand blue)
    if (pct >= 50) return colors.warning;    // 50-69%: needs attention
    return colors.error;                     // 0-49%: poor
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
