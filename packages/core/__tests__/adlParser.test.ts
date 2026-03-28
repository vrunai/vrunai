import { describe, it, expect } from 'vitest';
import { parseYamlText } from '../adlParser';

const VALID_YAML = `
agent:
  name: "Test Agent"
  description: "A test agent"
  instruction: "You are a test agent"

tools:
  - name: "greet"
    description: "Greets the user"
    input:
      name: "string"
    output:
      message: "string"
    mock:
      - input:
          name: "Alice"
        output:
          message: "Hello Alice"

flow:
  - step: "greet_step"
    tool: "greet"
    input_from: "user_input"

scenarios:
  - name: "basic_greeting"
    input: "Greet Alice"
    expected_tools:
      - "greet"
    expected_outcome:
      message: "Hello Alice"

providers:
  - name: "openai"
    model: "gpt-4o"
`;

describe('parseYamlText', () => {
    it('parses valid ADL YAML', () => {
        const spec = parseYamlText(VALID_YAML);
        expect(spec.agent.name).toBe('Test Agent');
        expect(spec.tools).toHaveLength(1);
        expect(spec.tools[0].name).toBe('greet');
        expect(spec.scenarios).toHaveLength(1);
        expect(spec.scenarios[0].name).toBe('basic_greeting');
    });

    it('throws on invalid YAML', () => {
        expect(() => parseYamlText('not: valid: yaml: {')).toThrow();
    });

    it('throws on missing required fields', () => {
        const incomplete = `
agent:
  name: "Test"
`;
        expect(() => parseYamlText(incomplete)).toThrow();
    });

    it('preserves mock data', () => {
        const spec = parseYamlText(VALID_YAML);
        expect(spec.tools[0].mock).toHaveLength(1);
        expect(spec.tools[0].mock![0].input).toEqual({ name: 'Alice' });
        expect(spec.tools[0].mock![0].output).toEqual({ message: 'Hello Alice' });
    });
});
