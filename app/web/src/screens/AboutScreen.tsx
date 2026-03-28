import markDarkSrc from '../assets/mark-dark.svg'
import markLightSrc from '../assets/mark-light.svg'

export function AboutScreen({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-8 py-5" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>About</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl">
          {/* Logo / title */}
          <div className="flex items-center gap-3 mb-8">
            <img src={theme === 'light' ? markDarkSrc : markLightSrc} width={48} height={48} alt="vrunai mark" />
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', fontFamily: 'Inter, system-ui, sans-serif' }}>vrunai</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Agent Evaluation Platform</div>
            </div>
          </div>

          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            VRUNAI evaluates LLM agents against structured YAML specs - testing tool usage,
            execution flow, and outcome accuracy across multiple providers. Everything runs
            in your browser; no data leaves your device except for the LLM API calls.
          </p>

          {/* Feature list */}
          <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Features</h2>
            <div className="flex flex-col gap-3">
              {[
                ['100% Client-Side', 'All evaluation logic runs in your browser — no server required'],
                ['Multi-Provider', 'Compare OpenAI, Anthropic, Google, and custom endpoints side by side'],
                ['ADL Support', 'Define agents, tools, flows, and scenarios in a simple YAML format'],
                ['Detailed Traces', 'Inspect every tool call and step in each evaluation run'],
                ['Cost Tracking', 'Real-time cost estimation per run based on token usage'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--overlay-active)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  </span>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="rounded-xl border p-4 flex items-start gap-3 mb-6" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>
              <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5.5 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Privacy</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                API keys are stored only in your browser's localStorage and are never sent to any
                server other than the provider APIs you configure. No telemetry, no accounts, no backend.
              </p>
            </div>
          </div>

          {/* CLI */}
          <div className="rounded-xl border p-4 flex items-start gap-3 mb-6" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>CLI Available</div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
                Run evaluations from your terminal or CI pipeline.
              </p>
              <code className="text-xs px-2.5 py-1.5 rounded-md select-all" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                npm install -g vrunai
              </code>
            </div>
          </div>

          {/* License */}
          <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>
              <path d="M12 3L2 7l10 4 10-4-10-4z"/><path d="M2 17l10 4 10-4"/><path d="M2 12l10 4 10-4"/>
            </svg>
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>License</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                This project is licensed under{' '}
                <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>AGPL-3.0</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
