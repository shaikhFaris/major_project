import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car, ChartBar, Gauge, MapPin, ShoppingCart, Star,
  ArrowsClockwise, Robot, Warning, MagnifyingGlass,
  TrendUp, TrendDown, Scales, Storefront, Cpu, CurrencyInr
} from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { Card, PageHeader, Skeleton, ErrorBanner, Badge, StatCard } from "../components/ui";

const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n?.toFixed(1)}%`;

const quickLinks = [
  { to: "/used-cars/audit",         label: "Dataset Audit",      icon: MagnifyingGlass, color: "text-sky-400",    bg: "bg-sky-500/10",    desc: "8,095 records · 14 columns" },
  { to: "/used-cars/market",        label: "Market Analysis",    icon: ChartBar,        color: "text-purple-400", bg: "bg-purple-500/10", desc: "EDA · brand · city · price" },
  { to: "/used-cars/demand",        label: "Demand Analysis",    icon: Star,            color: "text-amber-400",  bg: "bg-amber-500/10",  desc: "Listing-frequency demand proxy" },
  { to: "/used-cars/opportunity",   label: "Opportunity Finder", icon: Scales,          color: "text-emerald-400",bg: "bg-emerald-500/10",desc: "Score · margin · risk rank" },
  { to: "/used-cars/acquire",       label: "What Should I Buy?", icon: ShoppingCart,    color: "text-green-400",  bg: "bg-green-500/10",  desc: "Capital → vehicle recommendations" },
  { to: "/used-cars/allocate",      label: "Portfolio Allocator",icon: ChartBar,        color: "text-blue-400",   bg: "bg-blue-500/10",   desc: "Distribute capital by segment" },
  { to: "/used-cars/inventory",     label: "Inventory Manager",  icon: Storefront,      color: "text-orange-400", bg: "bg-orange-500/10", desc: "Track your purchased vehicles" },
  { to: "/used-cars/price-strategy",label: "Pricing Strategy",   icon: Car,             color: "text-pink-400",   bg: "bg-pink-500/10",   desc: "What should I list this car for?" },
  { to: "/used-cars/geographic",    label: "Geographic Analysis",icon: MapPin,          color: "text-teal-400",   bg: "bg-teal-500/10",   desc: "City prices · arbitrage" },
  { to: "/used-cars/backtest",      label: "Strategy Backtest",  icon: ArrowsClockwise, color: "text-indigo-400", bg: "bg-indigo-500/10", desc: "Test strategy on historical data" },
  { to: "/used-cars/whatif",        label: "What-If Simulator",  icon: Robot,           color: "text-violet-400", bg: "bg-violet-500/10", desc: "Scenario perturbation engine" },
  { to: "/used-cars/risk",          label: "Risk Dashboard",     icon: Warning,         color: "text-red-400",    bg: "bg-red-500/10",    desc: "Price · demand · inventory risk" },
  { to: "/used-cars/explain",       label: "ML Explainability",  icon: Cpu,             color: "text-cyan-400",   bg: "bg-cyan-500/10",   desc: "SHAP · feature importance" },
];

export default function UsedCarDashboard() {
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ucApi.market()
      .then(r => { if (r.success) setMarket(r.data); else setError(r.error || "Failed to load market data"); })
      .catch(() => setError("ML service unreachable. Start it with: python -m uvicorn main:app --reload --port 8000"))
      .finally(() => setLoading(false));
  }, []);

  const topBrands = market?.brand_distribution?.slice(0, 5) ?? [];
  const fuelStats = market?.fuel_type_stats ?? [];
  const bodyStats = market?.body_type_stats ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/50 border border-zinc-800 rounded-2xl p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3">
            <Car size={16} weight="bold" />
            Used-Car Market Simulation & Strategy Platform
          </div>
          <h1 className="text-3xl font-black text-zinc-100 leading-tight">
            Indian Used-Car<br />
            <span className="text-emerald-400">Reseller Intelligence</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 max-w-xl">
            Data-driven acquisition, pricing, and inventory strategy for used-car resellers.
            Based on <strong className="text-zinc-200">8,095 real Indian listings</strong> across 16 cities, 21 brands.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Link to="/used-cars/acquire" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2">
              <ShoppingCart size={14} weight="bold" /> What Should I Buy?
            </Link>
            <Link to="/used-cars/backtest" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700">
              <ArrowsClockwise size={14} /> Test a Strategy
            </Link>
          </div>
        </div>
      </div>

      {/* ML Model Status */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Cpu size={18} weight="bold" /></div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Price Prediction Model</h3>
              <p className="text-xs text-zinc-400">Gradient Boosting · Trained on 8,095 Indian listings</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ready
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Best Algorithm",  value: "Gradient Boosting" },
            { label: "R² Score",        value: "0.8882" },
            { label: "MAE",             value: "₹93,394" },
            { label: "MAPE",            value: "13.6%" },
          ].map(m => (
            <div key={m.label} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">{m.label}</span>
              <span className="text-sm font-bold font-mono text-zinc-200 mt-1 block">{m.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Market KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Listings" value={market?.total_listings?.toLocaleString() ?? "—"} sub="active used-car listings" />
          <StatCard label="Median Price" value={`₹${((market?.median_price ?? 0) / 100000).toFixed(1)}L`} sub="market listing price" />
          <StatCard label="Avg Mileage" value={`${Math.round(market?.avg_mileage ?? 0).toLocaleString()} km`} sub="across all listings" />
          <StatCard label="Avg Vehicle Age" value={`${market?.avg_vehicle_age?.toFixed(1) ?? "—"} yrs`} sub="make year vs 2025" />
        </div>
      )}

      {/* Market Snapshot Charts */}
      {market && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Brands */}
          <Card className="p-5 col-span-1">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Top Brands by Listings</h3>
            <div className="space-y-3">
              {topBrands.map((b: any, i: number) => {
                const max = topBrands[0]?.listings || 1;
                const pct = (b.listings / max * 100).toFixed(0);
                return (
                  <div key={b.brand}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300 font-medium">{b.brand}</span>
                      <span className="text-zinc-400 font-mono">{b.listings}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Fuel Type Split */}
          <Card className="p-5 col-span-1">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Fuel Type Breakdown</h3>
            <div className="space-y-3">
              {fuelStats.map((f: any) => (
                <div key={f.fuel_type} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-200 capitalize">{f.fuel_type}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Median ₹{(f.median / 100000).toFixed(1)}L · {f.count} listings</p>
                  </div>
                  <span className="text-xs font-mono text-zinc-300">₹{(f.mean / 100000).toFixed(1)}L avg</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Body Type Split */}
          <Card className="p-5 col-span-1">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Body Type Breakdown</h3>
            <div className="space-y-3">
              {bodyStats.map((b: any) => (
                <div key={b.body_type} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 capitalize">{b.body_type}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{b.count} listings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-zinc-300">₹{(b.mean / 100000).toFixed(1)}L avg</p>
                    <p className="text-[10px] text-zinc-500">Median ₹{(b.median / 100000).toFixed(1)}L</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Module Navigation Grid */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="group p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/40 hover:bg-zinc-800/60 transition-all duration-200 space-y-2.5"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${link.bg}`}>
                <link.icon size={18} className={link.color} weight="bold" />
              </div>
              <div>
                <h4 className={`text-sm font-bold text-zinc-200 group-hover:${link.color} transition`}>{link.label}</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Data Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-400/80 font-medium">
          <strong className="text-amber-400">Data disclaimer:</strong>{" "}
          All analysis is based on <strong>active listing data</strong> (not actual sales). Demand scores reflect listing frequency, not consumer transactions.
          Acquisition prices, resale values, ROI, and profit figures are <strong>simulation estimates</strong> — not guaranteed outcomes.
          Transport, reconditioning, and platform costs are user-configurable assumptions.
        </p>
      </div>
    </div>
  );
}
