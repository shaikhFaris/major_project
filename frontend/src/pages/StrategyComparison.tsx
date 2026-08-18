import { useState, useEffect } from "react";
import { ArrowsLeftRight, Trophy, Sparkle, Target } from "@phosphor-icons/react";
import { Bar } from "react-chartjs-2";
import { API_BASE, getAuthHeaders } from "../lib/auth";

interface ScenarioResult {
  strategyName: string;
  parameters: {
    sellingPrice: number;
    marketingBudget: number;
    city?: string;
  };
  summary: {
    totalUnitsSold: number;
    totalRevenueLakhs: number;
    totalProfitLakhs: number;
    avgMarketShare: number;
    riskScore: "Low" | "Medium" | "High";
  };
  confidence: {
    scoreLevel: string;
    numericPercentage: number;
  };
}

export default function StrategyComparison() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [topPickName, setTopPickName] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [targetObjective, setTargetObjective] = useState<"profit" | "revenue" | "sales" | "market_share" | "minimize_risk">("profit");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparisonData(targetObjective);
  }, [targetObjective]);

  const fetchComparisonData = async (obj: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/simulations/compare-scenarios`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          targetObjective: obj,
          strategies: [
            { strategyName: "Strategy A (Current Baseline)", sellingPrice: 999, marketingBudget: 50000, timePeriodMonths: 12, city: "Mumbai" },
            { strategyName: "Strategy B (Lower Price ₹899)", sellingPrice: 899, marketingBudget: 50000, timePeriodMonths: 12, city: "Mumbai" },
            { strategyName: "Strategy C (Price Cut + Marketing Boost)", sellingPrice: 899, marketingBudget: 75000, timePeriodMonths: 12, city: "Mumbai" },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setScenarios(json.data.results);
        setTopPickName(json.data.topPickName);
        setRecommendation(json.data.recommendation);
      }
    } catch (err) {
      console.error("Failed to load scenario comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: scenarios.map((s) => s.strategyName),
    datasets: [
      {
        label: "Estimated Profit (₹ Lakhs)",
        data: scenarios.map((s) => s.summary.totalProfitLakhs),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 6,
      },
      {
        label: "Expected Revenue (₹ Lakhs)",
        data: scenarios.map((s) => s.summary.totalRevenueLakhs),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <ArrowsLeftRight size={16} weight="bold" /> Step 11 — Scenario Strategy Comparison
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Side-by-Side Strategy Comparison</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Evaluate multiple business decisions against each other and rank strategies by your key business objective.
          </p>
        </div>

        {/* Objective Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 shrink-0">
            <Target size={16} className="text-emerald-400" /> Rank Objective:
          </label>
          <select
            value={targetObjective}
            onChange={(e) => setTargetObjective(e.target.value as any)}
            className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
          >
            <option value="profit">Maximize Profit (Recommended)</option>
            <option value="revenue">Maximize Revenue</option>
            <option value="sales">Maximize Sales Volume</option>
            <option value="market_share">Maximize Market Share</option>
            <option value="minimize_risk">Minimize Risk</option>
          </select>
        </div>
      </div>

      {/* Top Recommendation Banner */}
      {recommendation && (
        <div className="p-5 bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-zinc-900 border border-emerald-500/30 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Trophy size={24} weight="bold" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Recommended Strategy</span>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">{recommendation}</p>
          </div>
        </div>
      )}

      {/* Comparative Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Sparkle size={18} className="text-emerald-400" /> Comparative Decision Matrix
        </h3>

        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Metric</th>
                {scenarios.map((s, idx) => (
                  <th key={idx} className="px-5 py-3.5 text-center font-bold">
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-100 text-sm">{s.strategyName}</span>
                      {s.strategyName === topPickName && (
                        <span className="mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-zinc-950 uppercase tracking-wider">
                          ★ Top Pick
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Selling Price (₹)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono font-bold text-zinc-100">
                    ₹{s.parameters.sellingPrice}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Monthly Marketing (₹)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono text-zinc-200">
                    ₹{s.parameters.marketingBudget.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Expected Sales (Units)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono text-zinc-100">
                    {s.summary.totalUnitsSold.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Expected Revenue (₹ Lakhs)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono font-bold text-emerald-400">
                    ₹{s.summary.totalRevenueLakhs}L
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Estimated Net Profit (₹ Lakhs)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono font-bold text-blue-400 text-sm">
                    ₹{s.summary.totalProfitLakhs}L
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Market Share (%)</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono font-bold text-purple-400">
                    {s.summary.avgMarketShare}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Risk Profile</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        s.summary.riskScore === "Low"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {s.summary.riskScore}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-zinc-300">Model Confidence</td>
                {scenarios.map((s, idx) => (
                  <td key={idx} className="px-5 py-3 text-center font-mono text-zinc-400">
                    {s.confidence.scoreLevel} ({s.confidence.numericPercentage}%)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-zinc-100 mb-4">Financial Outcome Comparison Across Scenarios</h3>
        <div className="h-64 w-full">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: "#a1a1aa" } } },
              scales: {
                x: { ticks: { color: "#a1a1aa" }, grid: { display: false } },
                y: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
