import React from 'react';
import { Box, Text } from 'ink';

// ── Gradient ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
    return Math.round(a + (b - a) * t);
}

// blue → purple → pink  (Tokyo Night palette)
const STOPS: [number, number, number][] = [
    [122, 162, 247],  // #7aa2f7  blue
    [187, 154, 247],  // #bb9af7  purple
    [247, 118, 142],  // #f7768e  pink
];

function gradientColor(t: number): string {
    const seg = t < 0.5 ? 0 : 1;
    const st  = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [r1, g1, b1] = STOPS[seg];
    const [r2, g2, b2] = STOPS[seg + 1];
    const r = lerp(r1, r2, st);
    const g = lerp(g1, g2, st);
    const b = lerp(b1, b2, st);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── ASCII art ─────────────────────────────────────────────────────────────────

const LINES = [
    ' ██╗   ██╗██████╗  ██╗   ██╗███╗   ██╗ █████╗ ██╗  ',
    ' ██║   ██║██╔══██╗ ██║   ██║████╗  ██║██╔══██╗██║  ',
    ' ██║   ██║███████╔╝██║   ██║██╔██╗ ██║███████║██║  ',
    ' ╚██╗ ██╔╝██╔══██╗ ██║   ██║██║╚██╗██║██╔══██║██║  ',
    '  ╚████╔╝ ██║  ██║ ╚██████╔╝██║ ╚████║██║  ██║██║  ',
    '   ╚═══╝  ╚═╝  ╚═╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ',
];

const WIDTH = LINES[0].length;

function GradientLine({ text }: { text: string }) {
    return (
        <Box>
            {text.split('').map((char, i) => (
                <Text key={i} color={gradientColor(i / (WIDTH - 1))}>{char}</Text>
            ))}
        </Box>
    );
}

// ── Logo component ────────────────────────────────────────────────────────────

export function Logo() {
    return (
        <Box flexDirection="column" paddingTop={1}>
            {LINES.map((line, i) => (
                <GradientLine key={i} text={line} />
            ))}
            <Box paddingLeft={2} paddingTop={1}>
                <Text dimColor>Validate & Run AI Agents</Text>
            </Box>
        </Box>
    );
}
