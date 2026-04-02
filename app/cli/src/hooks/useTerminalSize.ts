import { useState, useEffect } from 'react';

export type TerminalSize = { columns: number; rows: number };

/** Returns current terminal dimensions and re-renders on resize. */
export function useTerminalSize(): TerminalSize {
    const [size, setSize] = useState<TerminalSize>({
        columns: process.stdout.columns ?? 80,
        rows: process.stdout.rows ?? 24,
    });

    useEffect(() => {
        function onResize() {
            setSize({
                columns: process.stdout.columns ?? 80,
                rows: process.stdout.rows ?? 24,
            });
        }
        process.stdout.on('resize', onResize);
        return () => { process.stdout.off('resize', onResize); };
    }, []);

    return size;
}
