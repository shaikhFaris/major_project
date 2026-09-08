import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  ChartLineUp,
  Buildings,
  UploadSimple,
  Cpu,
  Sliders,
  ArrowsLeftRight,
  SignOut,
  Sparkle,
  CheckCircle
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: ChartLineUp, end: true },
  { to: "/data-upload", label: "Upload & Validate Data", icon: UploadSimple },
  { to: "/market-model", label: "Market Model & ML", icon: Cpu },
  { to: "/strategy-builder", label: "Strategy Builder", icon: Sliders },
  { to: "/simulations/results", label: "Results & Analytics", icon: Sparkle },
  { to: "/simulations/compare", label: "Compare Scenarios", icon: ArrowsLeftRight },
  { to: "/businesses", label: "Business Projects", icon: Buildings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { activeBusiness, businesses, loading } = useActiveBusiness();
  const location = useLocation();
  const isCreatingBusiness = location.pathname === "/businesses/new";

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-zinc-900/80 border-r border-zinc-800 flex flex-col sticky top-0 h-dvh">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ChartLineUp size={20} weight="bold" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-bold text-zinc-100 text-[15px] tracking-tight">Market Sim</p>
            <p className="text-[11px] text-zinc-400 font-medium">Strategy Flight Simulator</p>
          </div>
        </div>

        {/* Active Business Badge Card */}
        {activeBusiness && (
          <div className="mx-3 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle size={12} weight="fill" /> Active Project
            </div>
            <p className="text-xs font-bold text-zinc-100 truncate mt-0.5">{activeBusiness.companyName}</p>
            <p className="text-[11px] text-zinc-400 truncate">{activeBusiness.productName || activeBusiness.industry}</p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {({ isActive }) => (
                <span
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  }`}
                >
                  <item.icon size={18} weight={isActive ? "fill" : "regular"} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
          >
            <SignOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6 md:p-8 page-enter">
          <Outlet />
        </div>
      </main>

      {!loading && businesses.length === 0 && !isCreatingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-zinc-900 p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><Buildings size={24} weight="bold" /></div>
            <h2 className="mt-4 text-xl font-bold text-zinc-100">Add your first business</h2>
            <p className="mt-2 text-sm text-zinc-400">Create a business project to unlock your dashboard, market model, and simulations.</p>
            <Link to="/businesses/new" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Create business project</Link>
          </div>
        </div>
      )}
    </div>
  );
}
