export function fmtMs(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function fmtUsd(usd: number): string {
    if (usd === 0) return '$0';
    if (usd < 0.0001) return '<$0.0001';
    return `$${usd.toFixed(4)}`;
}

export function fmtPct(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
}

export function fmtDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' \u00b7 '
        + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function uid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function pctColor(ratio: number): string {
    if (ratio >= 0.8) return '#22c55e';
    if (ratio >= 0.5) return '#f59e0b';
    return '#ef4444';
}
