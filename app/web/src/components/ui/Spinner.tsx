export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: size,
        height: size,
        borderColor: 'var(--border)',
        borderTopColor: 'var(--accent)',
        flexShrink: 0,
      }}
    />
  )
}
