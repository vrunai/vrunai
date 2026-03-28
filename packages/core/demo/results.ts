import type { ComparisonResult, RunResult, TraceEntry, ToolCall } from '@vrunai/types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRun(
  i: number,
  p: {
    path: string[]; tools: string[];
    calls: ToolCall[]; trace: TraceEntry[];
    output: Record<string, unknown>;
    ms: number; inTok: number; outTok: number;
    pathOk: boolean; toolOk: boolean; outcomeOk: boolean;
  },
): RunResult {
  return {
    runIndex: i,
    actualPath: p.path,
    actualTools: p.tools,
    toolCalls: p.calls,
    trace: p.trace,
    finalOutput: p.output,
    latencyMs: p.ms,
    inputTokens: p.inTok,
    outputTokens: p.outTok,
    pathMatch: p.pathOk,
    toolMatch: p.toolOk,
    outcomeMatch: p.outcomeOk,
  }
}

// ── Customer Support Triage ─────────────────────────────────────────────────
//
// late_delivery_auto_refund — straightforward, both models handle well
//   GPT: 5/5, Claude: 5/5
//
// damaged_item_escalated — the mock_override sets eligible_for_refund=false,
//   so the model must escalate instead of refunding.
//   GPT: gets the routing wrong 2/5 times (refunds instead of escalating)
//   Claude: always routes correctly, but 1/5 times the summary wording
//           triggers the wrong agent assignment → outcome mismatch

export const customerSupportResults: ComparisonResult[] = [
  {
    model: 'gpt-4.1-mini',
    metrics: [
      {
        scenarioName: 'late_delivery_auto_refund',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        runs: [
          makeRun(0, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 814 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 637 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 702 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2153, inTok: 1243, outTok: 387,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 782 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 691 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 724 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2197, inTok: 1258, outTok: 371,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 847 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 618 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 689 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2154, inTok: 1231, outTok: 392,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 791 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 653 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 718 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2162, inTok: 1249, outTok: 383,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 829 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 671 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 694 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2194, inTok: 1237, outTok: 378,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 2172,
        total_cost_usd: 0.0058,
      },
      {
        // GPT fails 2/5: ignores eligible_for_refund=false, refunds instead of escalating
        // Failing run is at index 0 so detail view shows the actual failure
        scenarioName: 'damaged_item_escalated',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        runs: [
          // ── run 0: FAIL — refunds instead of escalating ──
          makeRun(0, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-9034', reason: 'damaged_item', customer_id: 'CUST-2289' }, output: { success: true, refund_id: 'REF-5502', amount_refunded: 129.00 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 811 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 643 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-9034', reason: 'damaged_item', customer_id: 'CUST-2289' }, output: { success: true, refund_id: 'REF-5502', amount_refunded: 129.00 }, turn: 3, durationMs: 697 },
            ],
            output: { success: true, refund_id: 'REF-5502', amount_refunded: 129.00 },
            ms: 2151, inTok: 1197, outTok: 348,
            pathOk: false, toolOk: false, outcomeOk: false,
          }),
          // ── run 1: pass ──
          makeRun(1, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer received broken item' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 793 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 614 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer received broken item' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 682 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2089, inTok: 1184, outTok: 356,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 2: pass ──
          makeRun(2, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Damaged item reported by customer' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 827 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 601 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Damaged item reported by customer' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 718 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2146, inTok: 1173, outTok: 363,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 3: FAIL — refunds again ──
          makeRun(3, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-9034', reason: 'damaged_item', customer_id: 'CUST-2289' }, output: { success: true, refund_id: 'REF-5503', amount_refunded: 129.00 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 798 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 629 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-9034', reason: 'damaged_item', customer_id: 'CUST-2289' }, output: { success: true, refund_id: 'REF-5503', amount_refunded: 129.00 }, turn: 3, durationMs: 711 },
            ],
            output: { success: true, refund_id: 'REF-5503', amount_refunded: 129.00 },
            ms: 2138, inTok: 1191, outTok: 341,
            pathOk: false, toolOk: false, outcomeOk: false,
          }),
          // ── run 4: pass ──
          makeRun(4, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Broken item in package — customer needs help' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 819 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 647 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Broken item in package — customer needs help' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 693 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2159, inTok: 1178, outTok: 369,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 0.6,
        path_accuracy: 0.6,
        outcome_accuracy: 0.6,
        consistency: 0.6,
        avg_latency_ms: 2137,
        total_cost_usd: 0.0052,
      },
    ],
  },
  {
    model: 'claude-sonnet-4-6',
    metrics: [
      {
        scenarioName: 'late_delivery_auto_refund',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        runs: [
          makeRun(0, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 1127 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 893 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 948 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2968, inTok: 1347, outTok: 418,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 1083 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 921 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 974 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2978, inTok: 1362, outTok: 431,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 1154 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 862 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 931 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2947, inTok: 1339, outTok: 409,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 1098 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 907 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 961 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2966, inTok: 1351, outTok: 422,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['classify', 'lookup', 'auto_refund'],
            tools: ['classify_inquiry', 'lookup_order', 'issue_refund'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 } },
              { toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }, output: { type: 'late_delivery', urgency: 'high', confidence: 0.94 }, turn: 1, durationMs: 1141 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-8821', inquiry_type: 'late_delivery' }, output: { found: true, status: 'in_transit', eligible_for_refund: true, days_since_order: 14 }, turn: 2, durationMs: 879 },
              { step: 'auto_refund', toolName: 'issue_refund', input: { order_id: 'ORD-8821', reason: 'late_delivery', customer_id: 'CUST-1142' }, output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 }, turn: 3, durationMs: 943 },
            ],
            output: { success: true, refund_id: 'REF-5501', amount_refunded: 49.99 },
            ms: 2963, inTok: 1344, outTok: 414,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 2964,
        total_cost_usd: 0.0089,
      },
      {
        // Claude routes correctly every time but 1/5 the summary triggers wrong team
        // Failing run at index 0 so detail view shows the red ✗ on outcome
        scenarioName: 'damaged_item_escalated',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        runs: [
          // ── run 0: FAIL outcome — correct path but wrong agent team ──
          makeRun(0, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Package arrived with broken contents — customer requesting replacement' }, output: { ticket_id: 'TKT-7703', assigned_agent: 'Returns Desk', estimated_wait_minutes: 14 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 1091 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 908 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Package arrived with broken contents — customer requesting replacement' }, output: { ticket_id: 'TKT-7703', assigned_agent: 'Returns Desk', estimated_wait_minutes: 14 }, turn: 3, durationMs: 883 },
            ],
            output: { ticket_id: 'TKT-7703', assigned_agent: 'Returns Desk', estimated_wait_minutes: 14 },
            ms: 2882, inTok: 1304, outTok: 412,
            pathOk: true, toolOk: true, outcomeOk: false,
          }),
          // ── run 1: pass ──
          makeRun(1, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer received damaged item in package' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 1047 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 873 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer received damaged item in package' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 916 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2836, inTok: 1281, outTok: 394,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 2: pass ──
          makeRun(2, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Broken item received, needs quality review' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 1068 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 891 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Broken item received, needs quality review' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 937 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2896, inTok: 1293, outTok: 401,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 3: pass ──
          makeRun(3, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer reports damaged item' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 1034 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 886 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Customer reports damaged item' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 924 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2844, inTok: 1289, outTok: 397,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 4: pass ──
          makeRun(4, {
            path: ['classify', 'lookup', 'escalate'],
            tools: ['classify_inquiry', 'lookup_order', 'escalate_to_agent'],
            calls: [
              { toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 } },
              { toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 } },
              { toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Damaged product — escalate to quality' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 } },
            ],
            trace: [
              { step: 'classify', toolName: 'classify_inquiry', input: { message: 'I received a broken item in my package' }, output: { type: 'damaged_item', urgency: 'high', confidence: 0.91 }, turn: 1, durationMs: 1057 },
              { step: 'lookup', toolName: 'lookup_order', input: { order_id: 'ORD-9034', inquiry_type: 'damaged_item' }, output: { found: true, status: 'delivered', eligible_for_refund: false, days_since_order: 3 }, turn: 2, durationMs: 898 },
              { step: 'escalate', toolName: 'escalate_to_agent', input: { customer_id: 'CUST-2289', inquiry_type: 'damaged_item', urgency: 'high', summary: 'Damaged product — escalate to quality' }, output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 }, turn: 3, durationMs: 941 },
            ],
            output: { ticket_id: 'TKT-7702', assigned_agent: 'Quality Team', estimated_wait_minutes: 8 },
            ms: 2896, inTok: 1297, outTok: 404,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 0.8,
        consistency: 0.8,
        avg_latency_ms: 2871,
        total_cost_usd: 0.0085,
      },
    ],
  },
]

// ── HR Onboarding ───────────────────────────────────────────────────────────
//
// Simple 2-step flow — both models handle it perfectly.
// Only 1 scenario defined in the YAML spec.

export const hrOnboardingResults: ComparisonResult[] = [
  {
    model: 'gpt-4.1-mini',
    metrics: [
      {
        scenarioName: 'valid_new_hire',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        runs: [
          makeRun(0, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 743 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 618 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1361, inTok: 974, outTok: 287,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 712 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 654 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1366, inTok: 988, outTok: 279,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 768 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 631 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1399, inTok: 981, outTok: 293,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 729 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 641 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1370, inTok: 982, outTok: 284,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 751 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 627 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1378, inTok: 977, outTok: 291,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 1375,
        total_cost_usd: 0.0039,
      },
    ],
  },
  {
    model: 'claude-sonnet-4-6',
    metrics: [
      {
        scenarioName: 'valid_new_hire',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        runs: [
          makeRun(0, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 1014 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 847 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1861, inTok: 1083, outTok: 318,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 987 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 861 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1848, inTok: 1091, outTok: 324,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 1038 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 872 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1910, inTok: 1076, outTok: 311,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 1002 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 839 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1841, inTok: 1088, outTok: 316,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['validate', 'provision'],
            tools: ['validate_employee', 'provision_accounts'],
            calls: [
              { toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' } },
              { toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true } },
            ],
            trace: [
              { step: 'validate', toolName: 'validate_employee', input: { employee_name: 'Maria Muller', start_date: '2026-04-01', department: 'Engineering' }, output: { valid: true, employee_id: 'EMP-2201', contract_type: 'permanent', missing_fields: '' }, turn: 1, durationMs: 1021 },
              { step: 'provision', toolName: 'provision_accounts', input: { employee_id: 'EMP-2201', department: 'Engineering' }, output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true }, turn: 2, durationMs: 854 },
            ],
            output: { email: 'm.mueller@company.com', slack_handle: '@m.mueller', success: true },
            ms: 1875, inTok: 1079, outTok: 321,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 1867,
        total_cost_usd: 0.0065,
      },
    ],
  },
]

// ── Code Review Assistant ───────────────────────────────────────────────────
//
// style_violation_pr — straightforward, both models nail it
// security_issue_pr — GPT short-circuits 1/5 times (skips check_style
//   after finding a high-severity security issue); Claude always thorough

export const codeReviewResults: ComparisonResult[] = [
  {
    model: 'gpt-4.1-mini',
    metrics: [
      {
        scenarioName: 'style_violation_pr',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        runs: [
          makeRun(0, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style issues found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 683 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 594 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 547 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style issues found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 623 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 2447, inTok: 1418, outTok: 463,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'One style violation found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 714 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 561 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 578 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'One style violation found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 641 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 2494, inTok: 1437, outTok: 451,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style issues found; missing type annotations', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 698 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 582 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 563 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style issues found; missing type annotations', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 608 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 2451, inTok: 1426, outTok: 472,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style: missing type annotation on export', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 721 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 573 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 556 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style: missing type annotation on export', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 617 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 2467, inTok: 1429, outTok: 458,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'No security issues. 1 style violation found.', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 692 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 589 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 541 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'No security issues. 1 style violation found.', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 631 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 2453, inTok: 1421, outTok: 467,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 2462,
        total_cost_usd: 0.0071,
      },
      {
        // GPT skips check_style on 1/5 runs when it finds a high-severity security issue
        // Failing run at index 0 so the detail view shows the skipped tool
        scenarioName: 'security_issue_pr',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        runs: [
          // ── run 0: FAIL — skips check_style ──
          makeRun(0, {
            path: ['fetch', 'security', 'review'],
            tools: ['fetch_diff', 'check_security', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Critical: SQL injection vulnerability', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 672 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 694 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Critical: SQL injection vulnerability', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 3, durationMs: 617 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 1983, inTok: 1094, outTok: 338,
            pathOk: false, toolOk: false, outcomeOk: true,
          }),
          // ── run 1: pass ──
          makeRun(1, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Security vulnerability found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 651 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 713 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 524 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Security vulnerability found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 638 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 2526, inTok: 1382, outTok: 447,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 2: pass ──
          makeRun(2, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection vulnerability detected', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 661 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 728 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 537 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection vulnerability detected', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 649 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 2575, inTok: 1396, outTok: 443,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 3: pass ──
          makeRun(3, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'High severity: SQL injection risk', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 647 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 701 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 518 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'High severity: SQL injection risk', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 627 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 2493, inTok: 1389, outTok: 439,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          // ── run 4: pass ──
          makeRun(4, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Security: SQL injection on line 12', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 668 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 719 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 531 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Security: SQL injection on line 12', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 643 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 2561, inTok: 1391, outTok: 441,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 0.8,
        path_accuracy: 0.8,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 2428,
        total_cost_usd: 0.0062,
      },
    ],
  },
  {
    model: 'claude-sonnet-4-6',
    metrics: [
      {
        scenarioName: 'style_violation_pr',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        runs: [
          makeRun(0, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: '1 style violation found, no security issues', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 918 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 814 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 762 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: '1 style violation found, no security issues', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 847 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 3341, inTok: 1523, outTok: 508,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style: missing type annotation on export', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 893 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 841 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 791 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style: missing type annotation on export', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 824 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 3349, inTok: 1541, outTok: 497,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'No security issues. 1 style violation: missing type annotation.', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 937 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 803 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 776 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'No security issues. 1 style violation: missing type annotation.', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 861 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 3377, inTok: 1534, outTok: 519,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Found 1 style violation, requesting changes', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 906 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 827 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 783 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Found 1 style violation, requesting changes', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 838 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 3354, inTok: 1528, outTok: 504,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 } },
              { toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 } },
              { toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 } },
              { toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style violation detected: missing type annotation', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-441' }, output: { diff: '- oldCode\n+ newCode', files_changed: 3, lines_added: 42, lines_removed: 18 }, turn: 1, durationMs: 921 },
              { step: 'security', toolName: 'check_security', input: { diff: '- oldCode\n+ newCode' }, output: { issues: '', severity: 'none', count: 0 }, turn: 2, durationMs: 819 },
              { step: 'style', toolName: 'check_style', input: { diff: '- oldCode\n+ newCode' }, output: { violations: 'Missing type annotation on exported function', count: 1 }, turn: 3, durationMs: 771 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-441', summary: 'Style violation detected: missing type annotation', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-881' }, turn: 4, durationMs: 851 },
            ],
            output: { posted: true, review_id: 'REV-881' },
            ms: 3362, inTok: 1531, outTok: 511,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 3357,
        total_cost_usd: 0.0106,
      },
      {
        scenarioName: 'security_issue_pr',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        runs: [
          makeRun(0, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Critical: SQL injection vulnerability on line 12', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 884 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 943 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 704 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Critical: SQL injection vulnerability on line 12', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 862 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 3393, inTok: 1474, outTok: 493,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(1, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection risk detected — requesting changes', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 907 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 918 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 721 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection risk detected — requesting changes', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 841 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 3387, inTok: 1489, outTok: 481,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(2, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'High severity: SQL injection vulnerability found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 871 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 957 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 693 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'High severity: SQL injection vulnerability found', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 878 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 3399, inTok: 1467, outTok: 502,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(3, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection vulnerability on line 12 — must fix before merge', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 897 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 931 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 712 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'SQL injection vulnerability on line 12 — must fix before merge', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 856 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 3396, inTok: 1481, outTok: 498,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
          makeRun(4, {
            path: ['fetch', 'security', 'style', 'review'],
            tools: ['fetch_diff', 'check_security', 'check_style', 'post_review'],
            calls: [
              { toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 } },
              { toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 } },
              { toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 } },
              { toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Blocking: SQL injection risk in query handler', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' } },
            ],
            trace: [
              { step: 'fetch', toolName: 'fetch_diff', input: { pr_id: 'PR-442' }, output: { diff: '- safeQuery\n+ rawInput', files_changed: 1, lines_added: 5, lines_removed: 3 }, turn: 1, durationMs: 913 },
              { step: 'security', toolName: 'check_security', input: { diff: '- safeQuery\n+ rawInput' }, output: { issues: 'SQL injection risk on line 12', severity: 'high', count: 1 }, turn: 2, durationMs: 924 },
              { step: 'style', toolName: 'check_style', input: { diff: '- safeQuery\n+ rawInput' }, output: { violations: '', count: 0 }, turn: 3, durationMs: 708 },
              { step: 'review', toolName: 'post_review', input: { pr_id: 'PR-442', summary: 'Blocking: SQL injection risk in query handler', verdict: 'request_changes' }, output: { posted: true, review_id: 'REV-882' }, turn: 4, durationMs: 869 },
            ],
            output: { posted: true, review_id: 'REV-882' },
            ms: 3414, inTok: 1478, outTok: 496,
            pathOk: true, toolOk: true, outcomeOk: true,
          }),
        ],
        tool_accuracy: 1,
        path_accuracy: 1,
        outcome_accuracy: 1,
        consistency: 1,
        avg_latency_ms: 3398,
        total_cost_usd: 0.0099,
      },
    ],
  },
]

// Map example labels to their pre-recorded results
export const DEMO_RESULTS: Record<string, ComparisonResult[]> = {
  'Customer Support': customerSupportResults,
  'HR Onboarding': hrOnboardingResults,
  'Code Review Assistant': codeReviewResults,
}
