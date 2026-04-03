import React from 'react';
import { Text } from 'ink';
import { symbols } from '../../theme.js';

export type HelpItem = { key: string; action: string };

export function HelpBar({ items }: { items: HelpItem[] }) {
    const text = items.map(i => `${i.key} ${i.action}`).join(`  ${symbols.dot}  `);
    return <Text dimColor>  {text}</Text>;
}
