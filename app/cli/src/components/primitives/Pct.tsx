import React from 'react';
import { Text } from 'ink';
import { metricColor } from '../../theme.js';

export function Pct({ value }: { value: number }) {
    return <Text color={metricColor(value)}>{`${(value * 100).toFixed(0)}%`.padStart(4)}</Text>;
}
