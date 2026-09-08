import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Sparkle, Sliders, Target, Buildings, CurrencyInr, CheckCircle } from "@phosphor-icons/react";
import { API_BASE, getAuthHeaders } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

export default function StrategyBuilder() {
  const navigate = useNavigate();
  const { activeBusiness } = useActiveBusiness();
  const baselinePrice = Number(activeBusiness?.sellingPrice || 0);
  const baselineMarketing = Number(activeBusiness?.marketingBudget || 0);

  const [strategyName, setStrategyName] = useState("Price Reduction & Marketing Boost");
  const [productName, setProductName] = useState(activeBusiness?.productName || "");
  const [city, setCity] = useState("Business market");
  const [isNewCityEntry, setIsNewCityEntry] = useState(false);
  const [timePeriodMonths, setTimePeriodMonths] = useState(12);
  const [sellingPrice, setSellingPrice] = useState(baselinePrice);
  const [marketingBudget, setMarketingBudget] = useState(baselineMarketing);
  const [productionCapacity, setProductionCapacity] = useState(activeBusiness?.productionCapacity || 0);
  const [manufacturingCost, setManufacturingCost] = useState(Number(activeBusiness?.manufacturingCost || 0));
  const [targetObjective, setTargetObjective] = useState<"profit" | "revenue" | "sales" | "market_share" | "minimize_risk">("profit");

  useEffect(() => {
    if (activeBusiness) {
      if (activeBusiness.productName) setProductName(activeBusiness.productName);
      if (activeBusiness.sellingPrice) setSellingPrice(Number(activeBusiness.sellingPrice));
      if (activeBusiness.marketingBudget) setMarketingBudget(Number(activeBusiness.marketingBudget));
      if (activeBusiness.productionCapacity) setProductionCapacity(Number(activeBusiness.productionCapacity));
      if (activeBusiness.manufacturingCost) setManufacturingCost(Number(activeBusiness.manufacturingCost));
    }
  }, [activeBusiness]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    "Preparing market model & dataset coefficients...",
    "Running machine learning demand prediction...",
    "Applying production capacity & inventory constraints...",
    "Executing Monte Carlo stochastic uncertainty simulation...",
    "Calculating confidence score & financial metrics...",
  ];

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    try {
      const res = await fetch(`${API_BASE}/simulations/run-advanced`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          strategyName,
          productName,
          city,
          isNewCityEntry,
          timePeriodMonths: Number(timePeriodMonths),
          sellingPrice: Number(sellingPrice),
          marketingBudget: Number(marketingBudget),
          productionCapacity: Number(productionCapacity),
          manufacturingCost: Number(manufacturingCost),
          targetObjective,
          businessId: activeBusiness?.id,
          baselinePrice,
          baselineMarketing,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTimeout(() => {
          clearInterval(interval);
          navigate("/simulations/results", { state: { simulationResult: json.data } });
        }, 3200);
      }
    } catch (err) {
      console.error("Simulation execution error:", err);
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
          <Sliders size={16} weight="bold" /> Step 8 — Strategy Builder
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Create Strategy Simulation</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Test business strategy decisions ("What if I reduce price to ₹899 & boost marketing by 20%?") against your historical market model.
        </p>
      </div>

      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
            <Sparkle size={32} weight="bold" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-100">Running Market Simulation Engine</h3>
            <p className="text-emerald-400 font-medium text-sm transition-all duration-300">
              {steps[loadingStep]}
            </p>
          </div>

          <div className="w-full max-w-md bg-zinc-950 h-2.5 rounded-full overflow-hidden mx-auto border border-zinc-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRunSimulation} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
          {/* Strategy Name & Target Objective */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2">Strategy Title / Label</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2 flex items-center gap-1.5">
                <Target size={14} className="text-emerald-400" /> Target Strategic Objective
              </label>
              <select
                value={targetObjective}
                onChange={(e) => setTargetObjective(e.target.value as any)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
              >
                <option value="profit">Maximize Profit (Recommended)</option>
                <option value="revenue">Maximize Revenue</option>
                <option value="sales">Maximize Sales Volume</option>
                <option value="market_share">Maximize Market Share</option>
                <option value="minimize_risk">Minimize Risk & Volatility</option>
              </select>
            </div>
          </div>

          {/* Product & City Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/80">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2">Product Line</label>
              <select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={activeBusiness?.productName}>{activeBusiness?.productName}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2 flex items-center gap-1.5">
                <Buildings size={14} className="text-emerald-400" /> Target Market / Region
              </label>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsNewCityEntry(e.target.value === "Bengaluru");
                }}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Business market">Business market</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2">Simulation Horizon (Months)</label>
              <select
                value={timePeriodMonths}
                onChange={(e) => setTimePeriodMonths(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (1 Full Year)</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>
          </div>

          {/* Strategy Variables: Price & Marketing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-950/60 border border-zinc-800 p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <CurrencyInr size={16} className="text-emerald-400" /> Proposed Selling Price (₹)
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Baseline: ₹{baselinePrice.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                min={100}
                max={5000}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-lg font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-400">
                {sellingPrice < baselinePrice
                  ? `₹${baselinePrice - sellingPrice} discount (${Math.round(((baselinePrice - sellingPrice) / baselinePrice) * 100)}% price cut to stimulate demand)`
                  : sellingPrice > baselinePrice
                  ? `₹${sellingPrice - baselinePrice} premium price (+${Math.round(((sellingPrice - baselinePrice) / baselinePrice) * 100)}% price increase)`
                  : "Baseline price level"}
              </p>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <CurrencyInr size={16} className="text-emerald-400" /> Monthly Marketing Budget (₹)
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Baseline: ₹{baselineMarketing.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(Number(e.target.value))}
                min={5000}
                max={500000}
                step={5000}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-lg font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-400">
                {marketingBudget > baselineMarketing
                  ? `+${Math.round(((marketingBudget - baselineMarketing) / baselineMarketing) * 100)}% marketing boost above baseline`
                  : "Standard marketing allocation"}
              </p>
            </div>
          </div>

          {/* Business Constraints: Capacity & Unit Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2">Monthly Production Capacity Ceiling (Units)</label>
              <input
                type="number"
                value={productionCapacity}
                onChange={(e) => setProductionCapacity(Number(e.target.value))}
                min={1000}
                max={50000}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Prevents unrealistic sales figures beyond physical factory limits.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-2">Unit Manufacturing Cost (₹)</label>
              <input
                type="number"
                value={manufacturingCost}
                onChange={(e) => setManufacturingCost(Number(e.target.value))}
                min={50}
                max={3000}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Used to compute gross margin per unit sold (e.g. ₹{sellingPrice - manufacturingCost} margin).</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-400" />
              Engine will run 100+ Monte Carlo uncertainty iterations.
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Play size={18} weight="bold" /> Run Strategy Simulation
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
