<div align="center">
   <img src="https://raw.githubusercontent.com/vrunai/vrunai/main/logo/mono-light/mark-48.svg" alt="VRUNAI logo" width="48" height="48" />
   <h1>VRUNAI</h1>
   <h3>
      Open-source CLI for evaluating LLM agents beyond output accuracy
   </h3>
   <p>
      Define your agent in YAML. Run against any provider. See exactly where it fails.
   </p>

   <a href="https://github.com/vrunai/vrunai/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="AGPL-3.0 License">
   </a>
   <a href="https://www.npmjs.com/package/vrunai">
      <img src="https://img.shields.io/npm/v/vrunai?color=blue&label=npm" alt="npm version">
   </a>
</div>

## The Problem

Most teams evaluate agents by checking the final output. But agents can produce the correct result via the wrong path — skipping tool calls, hallucinating intermediate values, or taking shortcuts that work in testing but fail in production.

VRUNAI tracks **path accuracy**, **tool accuracy**, and **outcome accuracy** separately — and catches bugs that output-only evaluation misses.

## Install

```bash
npm install -g vrunai
```

## Usage

```bash
vrunai          # Launch the interactive TUI
vrunai web      # Launch the web UI at http://localhost:3120
```

The TUI and web UI share the same evaluation engine. Configure your LLM providers, load a YAML spec, and run evaluations.

### CLI Commands

```bash
vrunai models list          # List all built-in models with pricing
vrunai models show <id>     # Show details for a specific model
vrunai models validate      # Validate your custom models config
vrunai web [port]           # Start the web UI (default port: 3120)
```

## What It Evaluates

| Metric | What it measures |
|--------|-----------------|
| **Path accuracy** | Did the agent follow the expected execution path? |
| **Tool accuracy** | Were the right tools called in the right order? |
| **Outcome accuracy** | Did the agent produce the correct final output? |
| **Consistency** | How often does the agent take the same path across N runs? |
| **Latency** | Average response time per scenario |
| **Cost** | Total cost per scenario per provider |

## Agent Definition Language

Define your agent, tools, execution flow, and test scenarios in a single YAML file:

```yaml
agent:
  name: "Customer Support Triage"
  description: "Classifies inquiries, checks order status, issues refunds or escalates"
  instruction: "You are a customer support assistant..."

tools:
  - name: "classify_inquiry"
    description: "Classifies the customer inquiry by type and urgency"
    input: { message: "string" }
    output: { type: "string", urgency: "string", confidence: "number" }
    mock:
      - input: { message: "My order hasn't arrived after 14 days" }
        output: { type: "late_delivery", urgency: "high", confidence: 0.94 }

  - name: "lookup_order"
    description: "Looks up order status and refund eligibility"
    input: { order_id: "string", inquiry_type: "string" }
    output: { found: "boolean", status: "string", eligible_for_refund: "boolean" }
    mock:
      - input: { order_id: "ORD-8821", inquiry_type: "late_delivery" }
        output: { found: true, status: "in_transit", eligible_for_refund: true }

flow:
  - step: "classify"
    tool: "classify_inquiry"
    input_from: "user_input"
  - step: "lookup"
    tool: "lookup_order"
    input_from: "classify"
  - step: "route"
    condition:
      if: "lookup.output.eligible_for_refund == true"
      then: "auto_refund"
      else: "escalate"
  - step: "auto_refund"
    tool: "issue_refund"
    input_from: "lookup"

scenarios:
  - name: "late_delivery_auto_refund"
    input: "My order #ORD-8821 hasn't arrived after 14 days"
    context: { order_id: "ORD-8821", customer_id: "CUST-1142" }
    expected_path: ["classify", "lookup", "auto_refund"]
    expected_tools: ["classify_inquiry", "lookup_order", "issue_refund"]
    expected_outcome: { success: true }

providers:
  - name: "openai"
    model: "gpt-4o"
  - name: "anthropic"
    model: "claude-sonnet-4-20250514"

scoring:
  runs_per_scenario: 3
```

### Spec Reference

| Key | Required | Description |
|-----|----------|-------------|
| `agent.name` | yes | Display name |
| `agent.description` | yes | Short description of what the agent does |
| `agent.instruction` | yes | System prompt sent to the model |
| `tools[]` | yes | Tool definitions with input/output schemas and mock data |
| `tools[].mock[]` | yes | Input/output pairs used instead of real tool calls |
| `flow[]` | yes | Ordered steps; each maps to a tool or a conditional branch |
| `flow[].condition` | no | `if`/`then`/`else` branch based on a previous step's output |
| `scenarios[]` | yes | Test cases: input, context, expected path/tools/outcome |
| `scenarios[].mock_override` | no | Per-scenario override of a tool's mock output |
| `providers[]` | yes | Models to evaluate; matched against configured API keys |
| `scoring.runs_per_scenario` | no | Times to run each scenario (default: 1) |

## Supported Providers

<p align="center">
   <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
   <img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic" />
   <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
   <img src="https://img.shields.io/badge/xAI-000000?style=for-the-badge&logo=x&logoColor=white" alt="xAI" />
   <img src="https://img.shields.io/badge/DeepSeek-0A6DC2?style=for-the-badge&logo=deepseek&logoColor=white" alt="DeepSeek" />
   <img src="https://img.shields.io/badge/Mistral-FF7000?style=for-the-badge&logo=mistral&logoColor=white" alt="Mistral" />
   <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
</p>

26 built-in models with pricing. Custom base URLs supported for local or self-hosted models. Add your own via `~/.config/vrunai/models.json`.

## Links

- [GitHub](https://github.com/vrunai/vrunai) — source, issues, contributing
- [Example specs](https://github.com/vrunai/vrunai/tree/main/use_cases) — ready-to-run YAML evaluations
- [ADL Schema](https://github.com/vrunai/vrunai/tree/main/adl) — full YAML spec reference

## License

[AGPL-3.0](https://github.com/vrunai/vrunai/blob/main/LICENSE)
