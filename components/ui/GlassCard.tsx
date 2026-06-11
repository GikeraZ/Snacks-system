import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  gradient?: boolean
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function GlassCard({ children, className = '', hover = true, padding = 'md', onClick, gradient }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card
        ${paddings[padding]}
        ${hover ? 'cursor-pointer hover:shadow-card-hover' : ''}
        ${gradient ? 'bg-gradient-to-br from-white via-white to-primary-50/40 dark:from-gray-800 dark:via-gray-800 dark:to-primary-900/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
