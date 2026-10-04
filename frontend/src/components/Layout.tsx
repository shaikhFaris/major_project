import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  ChartLineUp, Buildings, Cpu, SignOut, CheckCircle, Car, Gauge, MapPin,
  MagnifyingGlass, ShoppingCart, Scales, ChartBar, Storefront, Robot,
  ArrowsClockwise, Warning, Star
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

const usedCarNavItems = [
  { to: "/used-cars", label: " Dashboard", icon: Gauge, end: true },
  { to: "/used-cars/audit", label: "Data Audit", icon: MagnifyingGlass },
  { to: "/used-cars/market", label: "Market Analysis", icon: ChartBar },
  { to: "/used-cars/demand", label: "Demand Analysis", icon: Star },
  { to: "/used-cars/opportunity", label: "Opportunity Finder", icon: Scales },
  { to: "/used-cars/acquire", label: "What Should I Buy?", icon: ShoppingCart },
  { to: "/used-cars/allocate", label: "Portfolio Allocator", icon: ChartLineUp },
  { to: "/used-cars/inventory", label: "Inventory Manager", icon: Storefront },
  { to: "/used-cars/price-strategy", label: "Pricing Strategy", icon: Car },
  { to: "/used-cars/geographic", label: "Geographic Analysis", icon: MapPin },
  { to: "/used-cars/backtest", label: "Strategy Backtest", icon: ArrowsClockwise },
  { to: "/used-cars/whatif", label: "What-If Simulator", icon: Robot },
  { to: "/used-cars/risk", label: "Risk Dashboard", icon: Warning },
  { to: "/used-cars/explain", label: "ML Explainability", icon: Cpu },
];

function NavSection({ title, items }: { title: string; items: typeof usedCarNavItems }) {
  return (
    <div>
      <p className="px-3.5 pt-4 pb-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{title}</p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end}>
          {({ isActive }) => (
            <span className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
            }`}>
              <item.icon size={16} weight={isActive ? "fill" : "regular"} />
              {item.label}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { activeBusiness, businesses, loading } = useActiveBusiness();
  const location = useLocation();
  const isCreatingBusiness = location.pathname === "/businesses/new";

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-zinc-900/80 border-r border-zinc-800 flex flex-col sticky top-0 h-dvh">
        <div className="flex items-center gap-3 px-5 h-14 border-b border-zinc-800 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ChartLineUp size={18} weight="bold" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-bold text-zinc-100 text-[13px] tracking-tight">Market Sim</p>
            <p className="text-[10px] text-zinc-400 font-medium">Used-Car Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavSection title="Used-Car Reseller" items={usedCarNavItems} />
        </nav>

        <div className="p-2 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="mt-1 w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150">
            <SignOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6 md:p-8 page-enter">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
