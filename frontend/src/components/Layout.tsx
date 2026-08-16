import { NavLink, Outlet } from 'react-router-dom'
import { ChartLineUp, Buildings, PlayCircle, SignOut } from '@phosphor-icons/react'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: ChartLineUp, end: true },
  { to: '/businesses', label: 'Businesses', icon: Buildings },
  { to: '/simulations', label: 'Simulations', icon: PlayCircle },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-[100dvh]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-zinc-900/60 border-r border-zinc-800 flex flex-col sticky top-0 h-[100dvh]">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ChartLineUp size={18} weight="bold" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-semibold text-zinc-50 text-[15px] tracking-tight">Market Sim</p>
            <p className="text-[11px] text-zinc-400">Strategy Simulator</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {({ isActive }) => (
                <span
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <item.icon size={17} weight={isActive ? 'fill' : 'regular'} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 text-sm font-medium shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
          >
            <SignOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-zinc-950">
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
