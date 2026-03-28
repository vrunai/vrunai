import { describe, it, expect } from 'vitest';
import { evaluateCondition, StepOutputs } from '../runner/conditionEvaluator';

const outputs: StepOutputs = {
    lookup: { eligible_for_refund: true, status: 'in_transit', score: 85 },
    classify: { type: 'billing', urgency: 'low', confidence: 0.72 },
    enrich: { known_threat: false, risk_score: 45 },
};

describe('evaluateCondition', () => {
    describe('== operator', () => {
        it('matches boolean true', () => {
            expect(evaluateCondition('lookup.output.eligible_for_refund == true', outputs)).toBe(true);
        });

        it('matches boolean false', () => {
            expect(evaluateCondition('enrich.output.known_threat == false', outputs)).toBe(true);
        });

        it('matches string value', () => {
            expect(evaluateCondition('lookup.output.status == in_transit', outputs)).toBe(true);
        });

        it('returns false on mismatch', () => {
            expect(evaluateCondition('lookup.output.eligible_for_refund == false', outputs)).toBe(false);
        });
    });

    describe('!= operator', () => {
        it('returns true when values differ', () => {
            expect(evaluateCondition('classify.output.urgency != high', outputs)).toBe(true);
        });

        it('returns false when values match', () => {
            expect(evaluateCondition('classify.output.urgency != low', outputs)).toBe(false);
        });
    });

    describe('> operator', () => {
        it('compares numbers', () => {
            expect(evaluateCondition('enrich.output.risk_score > 70', outputs)).toBe(false);
            expect(evaluateCondition('lookup.output.score > 70', outputs)).toBe(true);
        });
    });

    describe('< operator', () => {
        it('compares numbers', () => {
            expect(evaluateCondition('enrich.output.risk_score < 70', outputs)).toBe(true);
            expect(evaluateCondition('lookup.output.score < 70', outputs)).toBe(false);
        });
    });

    describe('>= operator', () => {
        it('returns true on equal', () => {
            expect(evaluateCondition('lookup.output.score >= 85', outputs)).toBe(true);
        });

        it('returns true on greater', () => {
            expect(evaluateCondition('lookup.output.score >= 50', outputs)).toBe(true);
        });

        it('returns false on less', () => {
            expect(evaluateCondition('enrich.output.risk_score >= 70', outputs)).toBe(false);
        });
    });

    describe('<= operator', () => {
        it('returns true on equal', () => {
            expect(evaluateCondition('enrich.output.risk_score <= 45', outputs)).toBe(true);
        });

        it('returns true on less', () => {
            expect(evaluateCondition('enrich.output.risk_score <= 100', outputs)).toBe(true);
        });

        it('returns false on greater', () => {
            expect(evaluateCondition('lookup.output.score <= 50', outputs)).toBe(false);
        });
    });

    describe('error handling', () => {
        it('throws on unsupported expression', () => {
            expect(() => evaluateCondition('invalid expression', outputs)).toThrow('unsupported expression');
        });

        it('throws on missing step', () => {
            expect(() => evaluateCondition('missing.output.field == true', outputs)).toThrow('no output found');
        });

        it('throws on bad path format', () => {
            expect(() => evaluateCondition('lookup.badkey.field == true', outputs)).toThrow('unsupported path format');
        });
    });
});
