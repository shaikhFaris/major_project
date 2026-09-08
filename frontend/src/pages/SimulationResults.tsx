import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChartLineUp, ShieldCheck, Printer, ArrowLeft, ArrowsLeftRight, Info, CheckCircle, Warning, Sparkle } from "@phosphor-icons/react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { API_BASE, getAuthHeaders } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface SimulationResultData {
  strategyName: string;
  parameters: {
    sellingPrice: number;
    marketingBudget: number;
    productName?: string;
    city?: string;
    timePeriodMonths?: number;
  };
  summary: {
    totalUnitsSold: number;
    totalRevenue: number;
    totalRevenueLakhs: number;
    totalCost: number;
    totalProfit: number;
    totalProfitLakhs: number;
    avgMarketShare: number;
    riskScore: "Low" | "Medium" | "High";
  };
  uncertainty: {
    unitsSold: { worstCase: number; expectedCase: number; bestCase: number };
    revenueLakhs: { worstCase: number; expectedCase: number; bestCase: number };
    profitLakhs: { worstCase: number; expectedCase: number; bestCase: number };
  };
  confidence: {
    scoreLevel: "High" | "Medium" | "Low";
    numericPercentage: number;
    strengths: string[];
    caveats: string[];
  };
  assumptions: string[];
  baselineComparison: {
    revenueChangePct: number;
    salesChangePct: number;
    profitChangePct: number;
    marketShareChangePct: number;
  };
  periodBreakdown: {
    period: number;
    monthName: string;
    demand: number;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    marketShare: number;
  }[];
  priceElasticityCurve: { price: number; expectedDemand: number }[];
}

export default function SimulationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeBusiness } = useActiveBusiness();

  const [result, setResult] = useState<SimulationResultData | null>(
    location.state?.simulationResult || null
  );

  useEffect(() => {
    if (!result) {
      fetchDefaultResult();
    }
  }, []);

  const fetchDefaultResult = async () => {
    if (!activeBusiness) return;
    try {
      const p = Number(activeBusiness.sellingPrice);
      const m = Number(activeBusiness.marketingBudget);
      const c = Number(activeBusiness.manufacturingCost);
      const cap = activeBusiness.productionCapacity;
      const prodName = activeBusiness.productName;
      const compName = activeBusiness.companyName;

      const res = await fetch(`${API_BASE}/simulations/run-advanced`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          strategyName: `${compName} — Price & Marketing Strategy`,
          productName: prodName,
          businessId: activeBusiness.id,
          city: "Business market",
          timePeriodMonths: 12,
          sellingPrice: p,
          marketingBudget: m,
          productionCapacity: cap,
          manufacturingCost: c,
          baselinePrice: p,
          baselineMarketing: Math.round(m * 0.7),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (err) {
      console.error("Failed to load simulation results:", err);
    }
  };

  if (!result) {
    return (
      <div className="p-12 text-center text-zinc-400 font-medium">
        Loading simulation analytics...
      </div>
    );
  }

  const trendChartData = {
    labels: result.periodBreakdown.map((p) => p.monthName),
    datasets: [
      {
        label: "Expected Revenue (₹)",
        data: result.periodBreakdown.map((p) => p.revenue),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        borderWidth: 2,
        fill: true,
      },
      {
        label: "Estimated Profit (₹)",
        data: result.periodBreakdown.map((p) => p.profit),
        borderColor: "#3b82f6",
        tension: 0.3,
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const elasticityChartData = {
    labels: result.priceElasticityCurve.map((e) => `₹${e.price}`),
    datasets: [
      {
        label: "Estimated Demand (Units)",
        data: result.priceElasticityCurve.map((e) => e.expectedDemand),
        borderColor: "#a855f7",
        backgroundColor: "rgba(168, 85, 247, 0.15)",
        tension: 0.3,
        borderWidth: 2.5,
        fill: true,
      },
    ],
  };

  const monteCarloChartData = {
    labels: ["Worst Case (10th %ile)", "Expected Case (50th %ile)", "Best Case (90th %ile)"],
    datasets: [
      {
        label: "Estimated Sales (Units)",
        data: [
          result.uncertainty.unitsSold.worstCase,
          result.uncertainty.unitsSold.expectedCase,
          result.uncertainty.unitsSold.bestCase,
        ],
        backgroundColor: ["rgba(239, 68, 68, 0.6)", "rgba(16, 185, 129, 0.7)", "rgba(59, 130, 246, 0.7)"],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs text-amber-300 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-amber-400 shrink-0" />
          <span>
            <strong>Non-Predictive Disclaimer:</strong> Results are estimates generated from historical business data, external market signals, and statistical ML demand elasticity models. Results do not guarantee exact future outcomes.
          </span>
        </div>
      </div>

      {/* Top Banner & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkle size={16} weight="bold" /> Step 10 — Simulation Results & Strategy Analysis
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{result.strategyName}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Target Product: <strong>{result.parameters.productName}</strong> | Price: <strong>₹{result.parameters.sellingPrice}</strong> | Marketing: <strong>₹{result.parameters.marketingBudget.toLocaleString()}/mo</strong> | Region: <strong>{result.parameters.city}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={() => navigate("/strategy-builder")}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Edit Strategy
          </button>

          <Link
            to="/simulations/compare"
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-emerald-500/20"
          >
            <ArrowsLeftRight size={16} /> Compare Scenarios
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Printer size={16} weight="bold" /> Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Expected Sales */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Expected Sales Volume</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-zinc-100 font-mono">
              {result.summary.totalUnitsSold.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
              +{result.baselineComparison.salesChangePct}% vs Base
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Units sold over {result.periodBreakdown.length} months</p>
        </div>

        {/* Expected Revenue */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Expected Revenue</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              ₹{result.summary.totalRevenueLakhs}L
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
              +{result.baselineComparison.revenueChangePct}% vs Base
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">₹{(result.summary.totalRevenue / 100000).toFixed(2)} Lakhs total gross</p>
        </div>

        {/* Estimated Profit */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Estimated Net Profit</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-blue-400 font-mono">
              ₹{result.summary.totalProfitLakhs}L
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
              +{result.baselineComparison.profitChangePct}% vs Base
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">After manufacturing & marketing costs</p>
        </div>

        {/* Market Share */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Estimated Market Share</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-400 font-mono">
              {result.summary.avgMarketShare}%
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
              +{result.baselineComparison.marketShareChangePct}% pts
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Average share across competitor market</p>
        </div>
      </div>

      {/* Main Visuals: Revenue Trend + Price Elasticity Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <ChartLineUp size={20} className="text-emerald-400" /> Revenue & Net Profit Trajectory (12 Months)
          </h3>
          <div className="h-64 w-full">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#a1a1aa" } } },
                scales: {
                  x: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                  y: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <Sparkle size={20} className="text-purple-400" /> Price Elasticity Demand Curve (Sensitivity)
          </h3>
          <div className="h-64 w-full">
            <Line
              data={elasticityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#a1a1aa" } } },
                scales: {
                  x: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                  y: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Monte Carlo Uncertainty & Confidence Rationale Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Monte Carlo Risk & Uncertainty Range</h3>
              <p className="text-xs text-zinc-400 mt-0.5">100 stochastic simulation iterations under market volatility</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono">
              Risk: {result.summary.riskScore}
            </span>
          </div>

          <div className="h-56 w-full">
            <Bar
              data={monteCarloChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#a1a1aa" }, grid: { display: false } },
                  y: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                },
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800 text-center text-xs">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-red-400 block text-[10px] uppercase font-bold">Worst Case</span>
              <span className="font-mono text-zinc-200 font-bold">{result.uncertainty.unitsSold.worstCase.toLocaleString()} units</span>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">Expected Case</span>
              <span className="font-mono text-zinc-200 font-bold">{result.uncertainty.unitsSold.expectedCase.toLocaleString()} units</span>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-blue-400 block text-[10px] uppercase font-bold">Best Case</span>
              <span className="font-mono text-zinc-200 font-bold">{result.uncertainty.unitsSold.bestCase.toLocaleString()} units</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" /> Simulation Confidence Score
              </h3>
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-bold text-sm rounded-lg border border-emerald-500/30">
                {result.confidence.scoreLevel} ({result.confidence.numericPercentage}%)
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <span className="text-xs font-semibold text-zinc-300 block uppercase tracking-wider">Confidence Rationale</span>
              {result.confidence.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
              {result.confidence.caveats.map((cav, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-300">
                  <Warning size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{cav}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Dataset Version:</span>
              <span className="text-zinc-200">v2024-2025.1</span>
            </div>
            <div className="flex justify-between">
              <span>Model Algorithm:</span>
              <span className="text-zinc-200">XGBoost Demand Regressor</span>
            </div>
            <div className="flex justify-between">
              <span>Simulation ID:</span>
              <span className="text-zinc-200">sim_{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
