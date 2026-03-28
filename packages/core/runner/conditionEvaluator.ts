// Evaluates ADL condition expressions like "knowledge_search.output.found == true"
// Format: <stepName>.output.<field> <op> <literal>
// Supported operators: ==, !=, >, <, >=, <=

export type StepOutputs = Record<string, Record<string, unknown>>;

function parseLiteral(raw: string): unknown {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    const n = Number(raw);
    if (!isNaN(n)) return n;
    // Strip surrounding quotes if present
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        return raw.slice(1, -1);
    }
    return raw;
}

function resolveLeft(path: string, stepOutputs: StepOutputs): unknown {
    // Expects pattern: <stepName>.output.<field>
    const parts = path.split('.');
    if (parts.length < 3 || parts[1] !== 'output') {
        throw new Error(`conditionEvaluator: unsupported path format "${path}"`);
    }
    const [stepName, , ...fieldParts] = parts;
    const output = stepOutputs[stepName];
    if (output === undefined) {
        throw new Error(`conditionEvaluator: no output found for step "${stepName}"`);
    }
    // Support nested field access
    let value: unknown = output;
    for (const part of fieldParts) {
        if (value == null) {
            throw new Error(`conditionEvaluator: null/undefined at "${part}" in path "${path}"`);
        }
        value = (value as Record<string, unknown>)[part];
    }
    return value;
}

// Operators ordered longest-first to avoid prefix conflicts (e.g. ">=" before ">")
const OPERATORS = [' >= ', ' <= ', ' != ', ' == ', ' > ', ' < '] as const;

export function evaluateCondition(expression: string, stepOutputs: StepOutputs): boolean {
    for (const op of OPERATORS) {
        const idx = expression.indexOf(op);
        if (idx === -1) continue;

        const left = resolveLeft(expression.slice(0, idx).trim(), stepOutputs);
        const right = parseLiteral(expression.slice(idx + op.length).trim());

        switch (op.trim()) {
            case '==': return left === right;
            case '!=': return left !== right;
            case '>':  return (left as number) > (right as number);
            case '<':  return (left as number) < (right as number);
            case '>=': return (left as number) >= (right as number);
            case '<=': return (left as number) <= (right as number);
        }
    }
    throw new Error(`conditionEvaluator: unsupported expression "${expression}"`);
}
