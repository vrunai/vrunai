import React from 'react';
import { Text } from 'ink';

export function Badge({ text, color }: { text: string; color?: string }) {
    return <Text inverse color={color}> {text} </Text>;
}
