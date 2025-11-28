import { cn } from '@/lib/utils'
import React from 'react'

type Variant = 'default' | 'outline' | 'ghost' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<Variant, string> = {
    default: 'bg-cyan-500 text-slate-900 hover:bg-cyan-400',
    outline: 'border border-slate-700 text-slate-200 hover:bg-slate-800/60',
    ghost: 'text-slate-200 hover:bg-slate-800/60',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600',
  }
  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4',
    lg: 'h-10 px-5',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
}
