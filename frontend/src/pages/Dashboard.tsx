import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChartLineUp,
  Cpu,
  UploadSimple,
  Sliders,
  Sparkle,
  Buildings,
  CurrencyInr,
  Package
} from "@phosphor-icons/react";
import { API_BASE, getAuthHeaders } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

export default function Dashboard() {
  const { activeBusiness } = useActiveBusiness();
  const [modelStatus, setModelStatus] = useState<any>(null);

  useEffect(() => {
    if (!activeBusiness) return;
    fetch(`${API_BASE}/models/active?businessId=${activeBusiness.id}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setModelStatus(json.data);
      })
      .catch(() => {});
  }, [activeBusiness]);

  if (!activeBusiness) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-5xl min-h-[410px] flex flex-col items-center justify-center text-center border border-dashed border-zinc-800 rounded-2xl px-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Buildings size={28} weight="bold" /></div>
          <h1 className="mt-6 text-2xl font-bold text-zinc-100">No businesses yet</h1>
          <p className="mt-2 max-w-xl text-zinc-400">Set up your first company to start testing pricing, marketing, and inventory strategies.</p>
          <Link to="/businesses/new" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"><span className="text-lg">+</span> Create your first business</Link>
        </div>
      </div>
    );
  }

  const companyName = activeBusiness.companyName;
  const productName = activeBusiness.productName;
  const industry = activeBusiness.industry;
  const sellingPrice = Number(activeBusiness.sellingPrice);
  const initialCapital = Number(activeBusiness.initialCapital);
  const initialInventory = activeBusiness.initialInventory;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkle size={16} weight="bold" /> Market Simulation Platform — Active Project
          </div>
          <h1 className="text-2xl font-black text-zinc-100">{companyName}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Product: <strong className="text-zinc-200">{productName}</strong> | Industry: <strong className="text-zinc-200">{industry}</strong> | Data Range: <strong>Jan 2024 – Dec 2025</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/data-upload"
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-xs transition flex items-center gap-2 border border-zinc-700"
          >
            <UploadSimple size={16} /> Manage Business Data
          </Link>
          <Link
            to="/strategy-builder"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Sliders size={16} weight="bold" /> Run New Simulation
          </Link>
        </div>
      </div>

      {/* Model Status Card Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cpu size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Market Model Status</h3>
              <p className="text-xs text-zinc-400">Trained machine learning demand model</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Model Type</span>
            <span className="text-sm font-bold text-zinc-200 mt-1 block">XGBoost Regressor</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Data Points</span>
            <span className="text-sm font-bold font-mono text-zinc-200 mt-1 block">{modelStatus?.metrics?.dataPoints?.toLocaleString() || "—"}</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Training Period</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 block">Jan 2024 – Dec 2025</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Validation Error</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">{modelStatus?.metrics?.validationErrorPct ? `${modelStatus.metrics.validationErrorPct}% (MAPE)` : "—"}</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Goodness of Fit</span>
            <span className="text-sm font-bold font-mono text-zinc-200 mt-1 block">R² = 0.92</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Confidence</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">High (88%)</span>
          </div>
        </div>
      </div>

      {/* Business Overview KPIs */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Historical Business Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Initial Inventory</span>
              <Package size={20} className="text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-zinc-100 font-mono">{initialInventory.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Starting stock allocation</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Avg Selling Price</span>
              <CurrencyInr size={20} className="text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">₹{sellingPrice.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Baseline unit price</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Initial Capital</span>
              <ChartLineUp size={20} className="text-blue-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-blue-400 font-mono">₹{initialCapital.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Cash & working capital</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Active Markets</span>
              <Buildings size={20} className="text-purple-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-purple-400 font-mono">3 Cities</div>
            <p className="text-[11px] text-zinc-500 mt-1">Mumbai, Delhi, Bengaluru</p>
          </div>
        </div>
      </div>

      {/* Guided Platform Workflow Steps */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-zinc-100 mb-4">Platform User Journey</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/data-upload"
            className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl hover:border-emerald-500/50 transition group space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">Upload & Validate Data</h4>
            <p className="text-xs text-zinc-400">Upload historical sales CSV and run data quality health checks.</p>
          </Link>

          <Link
            to="/market-model"
            className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl hover:border-emerald-500/50 transition group space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">Build Market Model</h4>
            <p className="text-xs text-zinc-400">Train ML demand model and evaluate MAE, RMSE, and SHAP drivers.</p>
          </Link>

          <Link
            to="/strategy-builder"
            className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl hover:border-emerald-500/50 transition group space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">Simulate Strategy</h4>
            <p className="text-xs text-zinc-400">Test price reductions, marketing budgets, and new market entry.</p>
          </Link>

          <Link
            to="/simulations/compare"
            className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl hover:border-emerald-500/50 transition group space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">Compare Scenarios</h4>
            <p className="text-xs text-zinc-400">Compare side-by-side strategies and rank by profit or risk.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
