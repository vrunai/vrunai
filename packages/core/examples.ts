// Inline example YAML content for the "Try an example" feature
export const EXAMPLES: { label: string; scenarios: number; tools: number; yaml: string }[] = [
  {
    label: 'Customer Support',
    scenarios: 3,
    tools: 3,
    yaml: `agent:
  name: "Customer Support Triage"
  description: "Classifies customer inquiries, checks order status, issues refunds or escalates to a human agent"
  instruction: "You are a customer support assistant. Analyze the customer's message, look up relevant order data, and either resolve the issue automatically or escalate to a human agent."

tools:
  - name: "classify_inquiry"
    description: "Classifies the customer inquiry by type and urgency"
    input: { message: "string" }
    output: { type: "string", urgency: "string", confidence: "number" }
    mock:
      - input: { message: "My order #ORD-8821 hasn't arrived after 14 days" }
        output: { type: "late_delivery", urgency: "high", confidence: 0.94 }
      - input: { message: "I received a broken item in my package" }
        output: { type: "damaged_item", urgency: "high", confidence: 0.91 }
      - input: { message: "I'd like to cancel my subscription" }
        output: { type: "subscription_cancel", urgency: "medium", confidence: 0.88 }

  - name: "lookup_order"
    description: "Looks up order status and eligibility for automatic resolution"
    input: { order_id: "string", inquiry_type: "string" }
    output: { found: "boolean", status: "string", eligible_for_refund: "boolean", days_since_order: "number" }
    mock:
      - input: { order_id: "ORD-8821", inquiry_type: "late_delivery" }
        output: { found: true, status: "in_transit", eligible_for_refund: true, days_since_order: 14 }
      - input: { order_id: "ORD-9034", inquiry_type: "damaged_item" }
        output: { found: true, status: "delivered", eligible_for_refund: true, days_since_order: 3 }

  - name: "issue_refund"
    description: "Issues an automatic refund or replacement for the order"
    input: { order_id: "string", reason: "string", customer_id: "string" }
    output: { success: "boolean", refund_id: "string", amount_refunded: "number" }
    mock:
      - input: { order_id: "ORD-8821", reason: "late_delivery", customer_id: "CUST-1142" }
        output: { success: true, refund_id: "REF-5501", amount_refunded: 49.99 }
      - input: { order_id: "ORD-9034", reason: "damaged_item", customer_id: "CUST-2289" }
        output: { success: true, refund_id: "REF-5502", amount_refunded: 129.00 }

  - name: "escalate_to_agent"
    description: "Escalates the inquiry to a human support agent"
    input: { customer_id: "string", inquiry_type: "string", urgency: "string", summary: "string" }
    output: { ticket_id: "string", assigned_agent: "string", estimated_wait_minutes: "number" }
    mock:
      - input: { customer_id: "CUST-3301", inquiry_type: "subscription_cancel", urgency: "medium", summary: "Customer wants to cancel subscription" }
        output: { ticket_id: "TKT-7701", assigned_agent: "Retention Team", estimated_wait_minutes: 5 }

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
  - step: "escalate"
    tool: "escalate_to_agent"
    input_from: "classify"

scenarios:
  - name: "late_delivery_auto_refund"
    input: "My order #ORD-8821 hasn't arrived after 14 days"
    context: { order_id: "ORD-8821", customer_id: "CUST-1142" }
    expected_path: ["classify", "lookup", "auto_refund"]
    expected_tools: ["classify_inquiry", "lookup_order", "issue_refund"]
    expected_outcome: { success: true }

  - name: "damaged_item_escalated"
    input: "I received a broken item in my package"
    context: { order_id: "ORD-9034", customer_id: "CUST-2289" }
    mock_override:
      lookup_order:
        output: { found: true, status: "delivered", eligible_for_refund: false, days_since_order: 3 }
    expected_path: ["classify", "lookup", "escalate"]
    expected_tools: ["classify_inquiry", "lookup_order", "escalate_to_agent"]
    expected_outcome: { assigned_agent: "Quality Team" }

scoring:
  runs_per_scenario: 1
`,
  },
  {
    label: 'HR Onboarding',
    scenarios: 4,
    tools: 5,
    yaml: `agent:
  name: "HR Onboarding"
  description: "Validates new hire data, provisions accounts and equipment, or escalates incomplete cases to HR"
  instruction: "You assist with employee onboarding. Validate the new hire's information, provision their IT accounts and equipment, and send a welcome email. If required information is missing or invalid, escalate to HR."

tools:
  - name: "validate_employee"
    description: "Validates the new hire's data completeness and contract status"
    input: { employee_name: "string", start_date: "string", department: "string" }
    output: { valid: "boolean", employee_id: "string", contract_type: "string", missing_fields: "string" }
    mock:
      - input: { employee_name: "Maria Muller", start_date: "2026-04-01", department: "Engineering" }
        output: { valid: true, employee_id: "EMP-2201", contract_type: "permanent", missing_fields: "" }

  - name: "provision_accounts"
    description: "Creates IT accounts for the new employee"
    input: { employee_id: "string", department: "string" }
    output: { email: "string", slack_handle: "string", success: "boolean" }
    mock:
      - input: { employee_id: "EMP-2201", department: "Engineering" }
        output: { email: "m.mueller@company.com", slack_handle: "@m.mueller", success: true }

  - name: "escalate_to_hr"
    description: "Escalates incomplete onboarding to HR team"
    input: { employee_name: "string", reason: "string" }
    output: { ticket_id: "string", assigned_to: "string" }
    mock:
      - input: { employee_name: "Anna Schmidt", reason: "missing start_date" }
        output: { ticket_id: "HR-991", assigned_to: "HR Team" }

flow:
  - step: "validate"
    tool: "validate_employee"
    input_from: "user_input"
  - step: "route"
    condition:
      if: "validate.output.valid == true"
      then: "provision"
      else: "escalate"
  - step: "provision"
    tool: "provision_accounts"
    input_from: "validate"
  - step: "escalate"
    tool: "escalate_to_hr"
    input_from: "validate"

scenarios:
  - name: "valid_new_hire"
    input: "Onboard Maria Muller, starting 2026-04-01 in Engineering"
    context: { employee_name: "Maria Muller", start_date: "2026-04-01", department: "Engineering" }
    expected_path: ["validate", "provision"]
    expected_tools: ["validate_employee", "provision_accounts"]
    expected_outcome: { success: true }

scoring:
  runs_per_scenario: 1
`,
  },
  {
    label: 'Code Review Assistant',
    scenarios: 2,
    tools: 4,
    yaml: `agent:
  name: "Code Review Assistant"
  description: "Analyzes pull requests for code quality issues, security vulnerabilities, and style violations"
  instruction: "You are a code review assistant. Analyze the submitted code changes, check for security issues, style violations, and complexity problems, then produce a structured review with actionable feedback."

tools:
  - name: "fetch_diff"
    description: "Fetches the diff for a pull request"
    input: { pr_id: "string" }
    output: { diff: "string", files_changed: "number", lines_added: "number", lines_removed: "number" }
    mock:
      - input: { pr_id: "PR-441" }
        output: { diff: "- oldCode\\n+ newCode", files_changed: 3, lines_added: 42, lines_removed: 18 }
      - input: { pr_id: "PR-442" }
        output: { diff: "- safeQuery\\n+ rawInput", files_changed: 1, lines_added: 5, lines_removed: 3 }

  - name: "check_security"
    description: "Scans code diff for known security vulnerabilities"
    input: { diff: "string" }
    output: { issues: "string", severity: "string", count: "number" }
    mock:
      - input: { diff: "- oldCode\\n+ newCode" }
        output: { issues: "", severity: "none", count: 0 }
      - input: { diff: "- safeQuery\\n+ rawInput" }
        output: { issues: "SQL injection risk on line 12", severity: "high", count: 1 }

  - name: "check_style"
    description: "Checks code diff against style guidelines"
    input: { diff: "string" }
    output: { violations: "string", count: "number" }
    mock:
      - input: { diff: "- oldCode\\n+ newCode" }
        output: { violations: "Missing type annotation on exported function", count: 1 }
      - input: { diff: "- safeQuery\\n+ rawInput" }
        output: { violations: "", count: 0 }

  - name: "post_review"
    description: "Posts the review summary back to the pull request"
    input: { pr_id: "string", summary: "string", verdict: "string" }
    output: { posted: "boolean", review_id: "string" }
    mock:
      - input: { pr_id: "PR-441", summary: "Style issues found", verdict: "request_changes" }
        output: { posted: true, review_id: "REV-881" }
      - input: { pr_id: "PR-442", summary: "Security vulnerability found", verdict: "request_changes" }
        output: { posted: true, review_id: "REV-882" }

flow:
  - step: "fetch"
    tool: "fetch_diff"
    input_from: "user_input"
  - step: "security"
    tool: "check_security"
    input_from: "fetch"
  - step: "style"
    tool: "check_style"
    input_from: "fetch"
  - step: "review"
    tool: "post_review"
    input_from: "security"

scenarios:
  - name: "style_violation_pr"
    input: "Review PR-441"
    context: { pr_id: "PR-441" }
    expected_path: ["fetch", "security", "style", "review"]
    expected_tools: ["fetch_diff", "check_security", "check_style", "post_review"]
    expected_outcome: { posted: true }

  - name: "security_issue_pr"
    input: "Review PR-442"
    context: { pr_id: "PR-442" }
    expected_path: ["fetch", "security", "style", "review"]
    expected_tools: ["fetch_diff", "check_security", "check_style", "post_review"]
    expected_outcome: { posted: true }

scoring:
  runs_per_scenario: 1
`,
  },
];
