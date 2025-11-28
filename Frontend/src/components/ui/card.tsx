import { cn } from '@/lib/utils'
import React from 'react'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: DivProps) {
  return <div className={cn('rounded-xl border border-slate-800 bg-slate-900/60', className)} {...props} />
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn('p-6', className)} {...props} />
}
