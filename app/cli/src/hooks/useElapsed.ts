import { useState, useEffect } from 'react';

/** Returns elapsed seconds since mount. Updates every second. */
export function useElapsed(): number {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(id);
    }, []);
    return elapsed;
}

/** Format seconds as mm:ss */
export function fmtElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
