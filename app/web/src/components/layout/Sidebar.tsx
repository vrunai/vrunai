import type { Screen } from '../../hooks/useAppState'
import { Toggle } from '../ui/Toggle'
import markDarkSrc from '../../assets/mark-dark.svg'
import markLightSrc from '../../assets/mark-light.svg'

interface Props {
  active: Screen
  onNav: (s: Screen) => void
  providerCount: number
  historyCount: number
  totalRunningCount?: number
  onNavToRuns?: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

interface NavEntry {
  screen: Screen
  label: string
  icon: React.ReactNode
  badge?: number
}

function NavIcon({ active, screen, label, icon, badge, onNav }: NavEntry & { active: Screen; onNav: (s: Screen) => void }) {
  const isActive = active === screen
  return (
    <button
      onClick={() => onNav(screen)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 text-left"
      style={{
        background:  isActive ? 'var(--overlay-active)' : 'transparent',
        color:       isActive ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        border: 'none',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function Sidebar({ active, onNav, providerCount, historyCount, totalRunningCount = 0, onNavToRuns, theme, onToggleTheme }: Props) {
  return (
    <aside className="flex flex-col h-full" style={{ width: 224, minWidth: 224, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div style={{ padding: '16px 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <img src={theme === 'light' ? markDarkSrc : markLightSrc} width={32} height={32} alt="vrunai mark" />
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', fontFamily: 'Inter, system-ui, sans-serif' }}>vrunai</span>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-y-auto">
        <NavIcon active={active} onNav={onNav} screen="evaluate" label="Evaluate" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }/>
        <NavIcon active={active} onNav={onNav} screen="providers" label="Providers" badge={providerCount} icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        }/>
        <NavIcon active={active} onNav={onNav} screen="models" label="Models" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="16 2 12 6 8 2"/></svg>
        }/>
        <NavIcon active={active} onNav={onNav} screen="history" label="History" badge={historyCount || undefined} icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        }/>
      </nav>

      {/* Background run hint */}
      {totalRunningCount > 0 && active !== 'running-overview' && (
        <button
          onClick={onNavToRuns}
          style={{
            margin: '0 8px 8px',
            padding: '8px 10px',
            background: 'var(--brand-muted)',
            border: '1px solid var(--border-focus)',
            borderRadius: 8,
            cursor: 'pointer',
            textAlign: 'left',
            width: 'calc(100% - 16px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
              {totalRunningCount === 1 ? 'Evaluation running' : `${totalRunningCount} evaluations running`}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent-light)', marginTop: 2, paddingLeft: 15 }}>
            {totalRunningCount === 1 ? 'Click to return' : 'Click to see all'}
          </div>
        </button>
      )}

      {/* Theme toggle */}
      <div style={{ padding: '4px 8px' }}>
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
          <span className="flex-1">{theme === 'light' ? 'Light' : 'Dark'}</span>
          <Toggle on={theme === 'light'} onChange={onToggleTheme} />
        </div>
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 8px 12px' }}>
        <NavIcon active={active} onNav={onNav} screen="about" label="About" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        }/>
        <a
          href="https://github.com/vrunai/vrunai"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 text-left no-underline"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          <span className="flex-1">GitHub</span>
        </a>
        <div className="px-3 mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>v0.1.0</div>
      </div>
    </aside>
  )
}
