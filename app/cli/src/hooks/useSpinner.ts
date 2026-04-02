import { useState, useEffect } from 'react';
import { spinnerFrames } from '../theme.js';

export function useSpinner(): string {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(f => (f + 1) % spinnerFrames.length), 80);
        return () => clearInterval(id);
    }, []);
    return spinnerFrames[frame];
}
