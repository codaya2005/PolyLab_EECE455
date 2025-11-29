import { cn } from '@/lib/utils'
import React from 'react'

type Variant = 'default' | 'outline'
type SpanProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }

export function Badge({ className, variant = 'default', ...props }: SpanProps) {
  const variants: Record<Variant, string> = {
    default: 'bg-slate-800 text-slate-200',
    outline: 'border border-slate-700 text-slate-300',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />
  )
}
