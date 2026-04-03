import React from 'react';
import { Text } from 'ink';
import { colors, symbols } from '../../theme.js';

export type StatusState = 'success' | 'error' | 'running' | 'pending';

export function StatusIcon({ state, spinner }: { state: StatusState; spinner?: string }) {
    switch (state) {
        case 'success':  return <Text color={colors.success}>{symbols.check}</Text>;
        case 'error':    return <Text color={colors.error}>{symbols.cross}</Text>;
        case 'running':  return <Text color={colors.warning}>{spinner ?? symbols.dot}</Text>;
        case 'pending':  return <Text dimColor>{symbols.dot}</Text>;
    }
}
