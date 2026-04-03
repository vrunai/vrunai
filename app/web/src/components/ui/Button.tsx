import { type ReactNode, type MouseEvent } from 'react'

type Variant = 'primary' | 'ghost' | 'danger-ghost'
type Size = 'sm' | 'md'

interface Props {
  variant?: Variant
  size?: Size
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  children: ReactNode
  className?: string
  type?: 'button' | 'submit'
  title?: string
}

const BASE = 'inline-flex items-center gap-1.5 font-semibold cursor-pointer border transition-colors duration-150 rounded-lg'

const VARIANTS: Record<Variant, string> = {
  'primary':      'border-transparent text-white [background:var(--btn-primary-bg)] hover:[background:var(--btn-primary-bg-hover)]',
  'ghost':        'bg-transparent border-[var(--border)] text-[var(--btn-secondary-text)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-secondary-hover-bg)]',
  'danger-ghost': 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--red)] hover:text-[var(--red)]',
}

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
}

export function Button({ variant = 'ghost', size = 'md', onClick, disabled, children, className = '', type = 'button', title }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
