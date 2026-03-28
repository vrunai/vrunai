interface Props {
  on: boolean
  onChange: () => void
}

export function Toggle({ on, onChange }: Props) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 32, height: 18, cursor: 'pointer' }}
      onClick={onChange}
    >
      <div className="absolute inset-0 rounded-full transition-colors duration-150"
        style={{ background: on ? 'var(--overlay-active)' : 'var(--bg-subtle)' }} />
      <div className="absolute rounded-full transition-all duration-150"
        style={{ width: 12, height: 12, top: 3, left: on ? 17 : 3, background: on ? 'var(--accent)' : 'var(--text-muted)' }} />
    </div>
  )
}
