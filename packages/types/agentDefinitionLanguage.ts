import { z } from 'zod'

// The Agent Definition Language (ADL) consists of several types, which are defined uniformly here.

// General definitions for the schemas
const ValueSchema = z.union([z.string(), z.number(), z.boolean()])

// Type-name schema for tool input/output declarations (e.g. { ticket_text: "string" })
const AdlTypeSchema = z.enum(['string', 'number', 'boolean', 'object', 'array'])


// Agent - defines the name, description and instruction of the agent
export const AgentSchema = z.object({
    name: z.string(),
    description: z.string(),
    instruction: z.string(),
});

// --- Tool Definitions ---

// Mock - Mock data for a single tool (input & output data)
export const MockSchema = z.object({
    input: z.record(z.string(), ValueSchema),
    output: z.record(z.string(), ValueSchema),
});

export const ToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    input: z.record(z.string(), AdlTypeSchema),
    output: z.record(z.string(), AdlTypeSchema),
    mock: z.array(MockSchema).optional()
});

// --- Flow Definitions ---

export const FlowConditionSchema = z.object({
    if: z.string(),
    then: z.string(),
    else: z.string()
});

export const FlowSchema = z.object({
    step: z.string(),
    tool: z.string().optional(),
    input_from: z.string().optional(),
    condition: FlowConditionSchema.optional()
}).transform((val) => ({
    step: val.step,
    tool: val.tool,
    inputFrom: val.input_from,
    condition: val.condition,
}));

// --- Scenario Definition ---

const MockOverrideSchema = z.record(
    z.string(),
    z.object({ output: z.record(z.string(), ValueSchema) })
);

export const ScenarioSchema = z.object({
    name: z.string(),
    input: z.string(),
    context: z.record(z.string(), ValueSchema).optional(),
    expected_path: z.array(z.string()).optional(),
    expected_tools: z.array(z.string()),
    expected_outcome: z.record(z.string(), ValueSchema),
    mock_override: MockOverrideSchema.optional(),
}).transform((val) => ({
    name: val.name,
    input: val.input,
    context: val.context,
    expectedPath: val.expected_path,
    expectedTools: val.expected_tools,
    expectedOutcome: val.expected_outcome,
    mockOverride: val.mock_override,
}))

// --- Provider & Scoring Definitions ---

export const ProviderRefSchema = z.object({
    name: z.string(),
    model: z.string(),
    base_url: z.string().optional(),
}).transform((val) => ({
    name: val.name,
    model: val.model,
    baseUrl: val.base_url,
}));

export const ScoringSchema = z.object({
    runs_per_scenario: z.number().int(),
});

// --- Agent Specification Definition (Agent Definition Language) ---

export const AgentSpecSchema = z.object({
    agent: AgentSchema,
    tools: z.array(ToolSchema),
    flow: z.array(FlowSchema),
    scenarios: z.array(ScenarioSchema),
    providers: z.array(ProviderRefSchema).optional(),
    scoring: ScoringSchema.optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type Mock = z.infer<typeof MockSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type FlowCondition = z.infer<typeof FlowConditionSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type ProviderRef = z.infer<typeof ProviderRefSchema>;
export type Scoring = z.infer<typeof ScoringSchema>;
export type AgentSpec = z.infer<typeof AgentSpecSchema>;



