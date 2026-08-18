import type { ReactNode } from 'react'
import { ChartLineUp } from '@phosphor-icons/react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-zinc-950 px-4 py-10 overflow-hidden">
      {/* Restrained radial tint, not a gradient slop field */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-180 h-120 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(16 185 129 / 0.07), transparent 70%)' }}
      />
      <div className="relative w-full max-w-md page-enter">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
            <ChartLineUp size={22} weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Market Sim</h1>
          <p className="text-sm text-zinc-400 mt-1">Strategy Simulator</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 md:p-7 space-y-5">{children}</div>
      </div>
    </div>
  )
}
