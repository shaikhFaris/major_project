import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { CaretDown, TrendDown, TrendUp, WarningCircle } from '@phosphor-icons/react'

/**
 * Shared UI kit - single source of truth for the design system.
 * Shape lock: buttons/inputs rounded-lg (8px), cards rounded-xl (12px), badges/pills full radius.
 * Accent lock: emerald is the only accent; red/sky/amber are semantic (errors, running, data series).
 */

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/* ── Buttons ──────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  href?: string
}

const buttonVariants: Record<ButtonVariant, string> = {
  // emerald-700 keeps white text at WCAG AA (5.4:1); hover darkens to emerald-800
  primary: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-950/50',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60',
  ghost: 'bg-transparent hover:bg-zinc-800/70 text-zinc-300',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
}

export function Button({ variant = 'primary', size = 'md', href, className, ...props }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
    'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none',
    size === 'sm' ? 'text-xs px-2.5 py-1.5' : 'text-sm px-4 py-2',
    buttonVariants[variant],
    className,
  )
  if (href) return <a href={href} className={classes}>{props.children}</a>
  return <button className={classes} {...props} />
}

/* ── Inputs & selects ─────────────────────────────────── */

const inputBase =
  'w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 ' +
  'placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 ' +
  'transition-colors duration-150'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(inputBase, className)} {...props} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(inputBase, 'appearance-none pr-9 cursor-pointer', className)} {...props}>
        {children}
      </select>
      <CaretDown
        size={14}
        weight="bold"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
    </div>
  )
}

/* ── Form field: label above, hint + error below ──────── */

interface FieldProps {
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <WarningCircle size={13} weight="bold" />
          {error}
        </p>
      )}
    </div>
  )
}

/* ── Cards, sections, badges ──────────────────────────── */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900', className)}>{children}</div>
  )
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.14em] mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </Card>
  )
}

type BadgeTone = 'zinc' | 'emerald' | 'red' | 'sky' | 'amber'

const badgeTones: Record<BadgeTone, string> = {
  zinc: 'text-zinc-300 bg-zinc-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  red: 'text-red-400 bg-red-500/10',
  sky: 'text-sky-400 bg-sky-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
}

export function Badge({ tone = 'zinc', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', badgeTones[tone])}>
      {children}
    </span>
  )
}

/* ── Page header & states ─────────────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-zinc-50 tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-sm text-zinc-400 mt-1.5 max-w-[60ch]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
      <WarningCircle size={17} weight="bold" className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-zinc-800">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1.5 max-w-[42ch]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

/* ── Stat cards (mono numerals, cockpit style) ────────── */

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        {trend && (
          <span className={trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
            {trend === 'up' ? <TrendUp size={16} weight="bold" /> : <TrendDown size={16} weight="bold" />}
          </span>
        )}
      </div>
      <p className="font-mono text-[22px] font-semibold text-zinc-50 mt-1.5 tracking-tight tabular-nums">{value}</p>
      {sub &&      <p className="font-mono text-xs text-zinc-400 mt-1">{sub}</p>}
    </Card>
  )
}
