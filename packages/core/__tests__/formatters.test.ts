import { describe, it, expect } from 'vitest';
import { fmtMs, fmtUsd, fmtPct, pctColor, uid } from '../formatters';

describe('fmtMs', () => {
    it('formats milliseconds below 1s', () => {
        expect(fmtMs(42)).toBe('42ms');
        expect(fmtMs(999)).toBe('999ms');
    });

    it('formats seconds', () => {
        expect(fmtMs(1000)).toBe('1.0s');
        expect(fmtMs(2500)).toBe('2.5s');
        expect(fmtMs(12345)).toBe('12.3s');
    });

    it('rounds sub-millisecond values', () => {
        expect(fmtMs(0)).toBe('0ms');
        expect(fmtMs(0.4)).toBe('0ms');
    });
});

describe('fmtUsd', () => {
    it('formats zero', () => {
        expect(fmtUsd(0)).toBe('$0');
    });

    it('formats very small amounts', () => {
        expect(fmtUsd(0.00001)).toBe('<$0.0001');
    });

    it('formats normal amounts', () => {
        expect(fmtUsd(0.0123)).toBe('$0.0123');
        expect(fmtUsd(1.5)).toBe('$1.5000');
    });
});

describe('fmtPct', () => {
    it('converts ratio to percentage', () => {
        expect(fmtPct(0)).toBe('0%');
        expect(fmtPct(0.5)).toBe('50%');
        expect(fmtPct(1)).toBe('100%');
        expect(fmtPct(0.333)).toBe('33%');
    });
});

describe('pctColor', () => {
    it('returns green for >= 90%', () => {
        expect(pctColor(0.9)).toBe('#9ece6a');
        expect(pctColor(1.0)).toBe('#9ece6a');
    });

    it('returns blue for >= 70%', () => {
        expect(pctColor(0.7)).toBe('#7aa2f7');
        expect(pctColor(0.89)).toBe('#7aa2f7');
    });

    it('returns orange for >= 50%', () => {
        expect(pctColor(0.5)).toBe('#e0af68');
        expect(pctColor(0.69)).toBe('#e0af68');
    });

    it('returns red for < 50%', () => {
        expect(pctColor(0.49)).toBe('#f7768e');
        expect(pctColor(0)).toBe('#f7768e');
    });
});

describe('uid', () => {
    it('returns a non-empty string', () => {
        expect(uid().length).toBeGreaterThan(0);
    });

    it('returns unique values', () => {
        const ids = new Set(Array.from({ length: 100 }, () => uid()));
        expect(ids.size).toBe(100);
    });
});
