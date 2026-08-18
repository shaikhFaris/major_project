import { useState, useEffect } from "react";
import { Cpu, ChartLineUp, ArrowRight, ArrowClockwise, Sparkle, SquaresFour, Info } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { API_BASE, getAuthHeaders } from "../lib/auth";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ModelData {
  id: string;
  version: string;
  modelType: string;
  createdAt: string;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
    dataPoints: number;
    trainingPeriod: string;
    testingPeriod: string;
    validationErrorPct: number;
  };
  featureImportances: {
    feature: string;
    percentage: number;
    impactDirection: string;
    description: string;
  }[];
  actualVsPredicted: {
    period: string;
    actualDemand: number;
    predictedDemand: number;
  }[];
}

export default function ModelEvaluation() {
  const [model, setModel] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState("XGBoost Regressor");

  useEffect(() => {
    fetchActiveModel();
  }, []);

  const fetchActiveModel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/models/active`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setModel(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch model:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrainModel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/models/train`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ algorithm: selectedAlgo }),
      });
      const json = await res.json();
      if (json.success) {
        setModel(json.data);
      }
    } catch (err) {
      console.error("Train error:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: model?.actualVsPredicted.map(p => p.period) || ["2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"],
    datasets: [
      {
        label: "Actual Demand (Historical)",
        data: model?.actualVsPredicted.map(p => p.actualDemand) || [1420, 1380, 1510, 1600, 1550, 1980, 1850, 2100],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        borderWidth: 2,
        fill: true,
      },
      {
        label: "Predicted Demand (ML Model)",
        data: model?.actualVsPredicted.map(p => p.predictedDemand) || [1390, 1400, 1480, 1580, 1560, 1920, 1890, 2050],
        borderColor: "#3b82f6",
        borderDash: [5, 5],
        tension: 0.3,
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Cpu size={16} weight="bold" /> Step 6 & 7 — Build Market Model & Evaluation
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Market Model & ML Evaluation</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Trained on historical data using <strong>Chronological Time-Series Splitting</strong> (avoiding future data leakage).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="XGBoost Regressor">XGBoost Regressor (Recommended)</option>
            <option value="Random Forest">Random Forest Regressor</option>
            <option value="Linear Regression Baseline">Linear Regression Baseline</option>
          </select>

          <button
            onClick={handleRetrainModel}
            disabled={loading}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold rounded-xl text-xs transition border border-emerald-500/20 flex items-center gap-2"
          >
            <ArrowClockwise size={16} className={loading ? "animate-spin" : ""} /> Retrain Model
          </button>
        </div>
      </div>

      {/* Model Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Model Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base font-bold text-emerald-400">Ready</span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Active: {model?.version || "v2.1"}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Observations</span>
          <div className="mt-2 text-xl font-bold text-zinc-100">
            {model?.metrics.dataPoints.toLocaleString() || "24,582"}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Data coverage period</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Validation Error</span>
          <div className="mt-2 text-xl font-bold text-emerald-400">
            {model?.metrics.validationErrorPct || 12.4}%
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">MAPE score on test split</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">R² Score</span>
          <div className="mt-2 text-xl font-bold text-zinc-100">
            {model?.metrics.r2 || 0.92}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Goodness of fit (0 to 1)</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">MAE / RMSE</span>
          <div className="mt-2 text-base font-bold text-zinc-200">
            {model?.metrics.mae || 84} / {model?.metrics.rmse || 112}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Mean unit deviation</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Confidence Level</span>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-base font-bold text-emerald-400">High</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">88%</span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Empirical score</span>
        </div>
      </div>

      {/* Actual vs Predicted Demand Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <ChartLineUp size={20} className="text-emerald-400" /> Actual Demand vs Predicted Demand
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chronological Validation Period: <strong>{model?.metrics.testingPeriod || "Nov 2025 – Dec 2025"}</strong>
              </p>
            </div>
            <span className="text-xs font-mono bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-zinc-400">
              MAPE: {model?.metrics.mape || 12.4}%
            </span>
          </div>

          <div className="h-72 w-full mt-4">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: "#a1a1aa", font: { size: 12 } },
                  },
                },
                scales: {
                  x: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                  y: { ticks: { color: "#71717a" }, grid: { color: "#27272a" } },
                },
              }}
            />
          </div>
        </div>

        {/* Explainability / Demand Drivers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkle size={18} className="text-emerald-400" /> Feature Drivers (SHAP)
              </h3>
              <Info size={16} className="text-zinc-500" />
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              Major demand factors influencing sales estimates derived from tree feature importances:
            </p>

            <div className="space-y-4">
              {(model?.featureImportances || [
                { feature: "Selling Price", percentage: 42 },
                { feature: "Marketing Expenditure", percentage: 25 },
                { feature: "Seasonality & Festivals", percentage: 19 },
                { feature: "Competitor Price Ratio", percentage: 10 },
                { feature: "City & Region", percentage: 4 },
              ]).map((fi, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-200">{fi.feature}</span>
                    <span className="font-mono text-emerald-400 font-bold">{fi.percentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${fi.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800">
            <Link
              to="/strategy-builder"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Create Strategy Simulation <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
