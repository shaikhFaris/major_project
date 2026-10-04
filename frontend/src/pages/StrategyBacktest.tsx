import { useState } from "react";
import { ArrowsClockwise, ChartBar, CheckCircle, Warning, Storefront } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Select, Field, StatCard, Badge } from "../components/ui";

const CITIES = ["","delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur"];
const FUELS = ["","petrol","diesel","cng"];
const BODIES = ["","hatchback","sedan","suv","muv","crossover"];
const TRANSMISSIONS = ["","manual","automatic"];

const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

export default function StrategyBacktest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [strategyName, setStrategyName] = useState("");

  const [form, setForm] = useState({
    max_price: 800000,
    max_age: 8,
    max_mileage: 80000,
    min_demand_score: 30,
    min_opportunity_score: 30,
    min_roi_pct: 10,
    city: "",
    fuel_type: "",
    transmission: "",
    body_type: "",
    negotiation_buffer_pct: 8,
    reconditioning_cost: 20000,
    transport_cost: 5000,
    platform_fee_pct: 2,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRun = async () => {
    setLoading(true); setError(null); setSaved(false);
    try {
      const body = { ...form, city: form.city || null, fuel_type: form.fuel_type || null, transmission: form.transmission || null, body_type: form.body_type || null };
      const r = await ucApi.backtest(body);
      if (r.success) setResult(r.data);
      else setError(r.error || "Failed");
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!strategyName) return;
    setSaving(true);
    try {
      const r = await ucApi.saveStrategy({ name: strategyName, parameters: form, backtestResults: result });
      if (r.success) setSaved(true);
    } catch {}
    finally { setSaving(false); }
  };

  const conc = result?.concentration ?? {};

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Strategy Backtest"
        description="Define acquisition rules and see how many vehicles in the market dataset qualify, along with projected portfolio metrics."
      />

      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Strategy Rules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
          <Field label="Max Acquisition Price (₹)"><Input type="number" value={form.max_price} onChange={e => set("max_price", Number(e.target.value))} /></Field>
          <Field label="Max Vehicle Age (yrs)"><Input type="number" value={form.max_age} onChange={e => set("max_age", Number(e.target.value))} /></Field>
          <Field label="Max Mileage (km)"><Input type="number" value={form.max_mileage} onChange={e => set("max_mileage", Number(e.target.value))} /></Field>
          <Field label="Min Demand Score"><Input type="number" min={0} max={100} value={form.min_demand_score} onChange={e => set("min_demand_score", Number(e.target.value))} /></Field>
          <Field label="Min Opportunity Score"><Input type="number" min={0} max={100} value={form.min_opportunity_score} onChange={e => set("min_opportunity_score", Number(e.target.value))} /></Field>
          <Field label="Min ROI (%)"><Input type="number" value={form.min_roi_pct} onChange={e => set("min_roi_pct", Number(e.target.value))} /></Field>
          <Field label="City Focus"><Select value={form.city} onChange={e => set("city", e.target.value)}>{CITIES.map(c => <option key={c} value={c}>{c || "All cities"}</option>)}</Select></Field>
          <Field label="Fuel Type"><Select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>{FUELS.map(f => <option key={f} value={f}>{f || "Any"}</option>)}</Select></Field>
          <Field label="Transmission"><Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>{TRANSMISSIONS.map(t => <option key={t} value={t}>{t || "Any"}</option>)}</Select></Field>
          <Field label="Body Type"><Select value={form.body_type} onChange={e => set("body_type", e.target.value)}>{BODIES.map(b => <option key={b} value={b}>{b || "Any"}</option>)}</Select></Field>
          <Field label="Negotiation Buffer (%)"><Input type="number" value={form.negotiation_buffer_pct} onChange={e => set("negotiation_buffer_pct", Number(e.target.value))} /></Field>
          <Field label="Reconditioning (₹)"><Input type="number" value={form.reconditioning_cost} onChange={e => set("reconditioning_cost", Number(e.target.value))} /></Field>
        </div>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? <><ArrowsClockwise size={14} className="animate-spin" /> Backtesting…</> : <><ArrowsClockwise size={14} /> Run Backtest</>}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {result && !result.error && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Qualifying Vehicles" value={result.vehicles_qualifying?.toLocaleString()} sub={`${result.selection_rate_pct}% of ${result.original_dataset_size?.toLocaleString()} total`} />
            <StatCard label="Avg ROI" value={`${result.avg_roi_pct?.toFixed(1)}%`} trend="up" />
            <StatCard label="Avg Profit / Vehicle" value={inr(result.avg_estimated_profit ?? 0)} trend={(result.avg_estimated_profit ?? 0) >= 0 ? "up" : "down"} />
            <StatCard label="Total Capital Required" value={inr(result.total_capital_required ?? 0)} sub="at estimated acquisition prices" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ChartBar size={14} className="text-emerald-400" /> Portfolio Projections
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Avg Acquisition Price", value: inr(result.avg_acquisition_price ?? 0) },
                  { label: "Avg Estimated Resale", value: inr(result.avg_estimated_resale ?? 0) },
                  { label: "Avg Estimated Profit", value: inr(result.avg_estimated_profit ?? 0) },
                  { label: "Total Capital Required", value: inr(result.total_capital_required ?? 0) },
                  { label: "Total Expected Revenue", value: inr(result.total_estimated_revenue ?? 0) },
                  { label: "Total Expected Profit", value: inr(result.total_estimated_profit ?? 0) },
                  { label: "Avg Demand Score", value: result.avg_demand_score?.toFixed(1) },
                  { label: "Avg Opportunity Score", value: result.avg_opportunity_score?.toFixed(1) },
                  { label: "Avg Risk Score", value: result.avg_risk_score?.toFixed(1) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-zinc-400">{r.label}</span>
                    <span className="font-mono text-zinc-200 font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Portfolio Concentration</h3>
              {[
                { title: "Top Makes", data: conc.top_makes },
                { title: "Top Cities", data: conc.top_cities },
                { title: "Fuel Mix", data: conc.fuel_split },
              ].map(({ title, data }) => (
                <div key={title} className="mb-4">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(data ?? {}).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300">
                        <span className="text-zinc-500 capitalize">{k}</span>
                        <span className="text-emerald-400 font-bold">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Sample vehicles */}
          {result.sample_vehicles?.length > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Storefront size={14} className="text-sky-400" /> Top Qualifying Vehicles (by Opportunity Score)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {["Vehicle", "City", "Year/km", "Acq. Price", "Est. Resale", "Est. Profit", "ROI", "Demand", "Opp."].map(h => (
                        <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.sample_vehicles.map((v: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-2 pr-3 text-zinc-200 font-bold">{v.make} {v.model}</td>
                        <td className="py-2 pr-3 text-zinc-300 capitalize">{v.city}</td>
                        <td className="py-2 pr-3 text-zinc-400 font-mono">{v.make_year}<br /><span className="text-[10px]">{v.mileage?.toLocaleString()} km</span></td>
                        <td className="py-2 pr-3 text-zinc-200 font-mono">{inr(v.acquisition_price ?? 0)}</td>
                        <td className="py-2 pr-3 text-zinc-300 font-mono">{inr(v.estimated_resale_price ?? 0)}</td>
                        <td className="py-2 pr-3 text-emerald-400 font-mono font-bold">{inr(v.estimated_profit ?? 0)}</td>
                        <td className="py-2 pr-3 text-emerald-300 font-mono">{v.estimated_roi_pct?.toFixed(1)}%</td>
                        <td className="py-2 pr-3 text-sky-400 font-mono">{v.demand_score?.toFixed(0)}</td>
                        <td className="py-2 pr-3 text-purple-400 font-mono">{v.opportunity_score?.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Save strategy */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Save This Strategy</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">Strategy Name</label>
                <input
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  value={strategyName}
                  onChange={e => setStrategyName(e.target.value)}
                  placeholder="e.g. Conservative Petrol Strategy"
                />
              </div>
              <Button onClick={handleSave} disabled={saving || !strategyName || saved}>
                {saved ? <><CheckCircle size={14} weight="fill" /> Saved</> : saving ? "Saving…" : "Save Strategy"}
              </Button>
            </div>
          </Card>
        </>
      )}

      {result?.error && (
        <Card className="p-5 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Warning size={16} className="text-amber-400 shrink-0" />
            <p className="text-amber-400 text-sm font-semibold">{result.error}</p>
          </div>
          <p className="text-zinc-400 text-xs mt-1">Loosen your filters — reduce min scores, increase max price, or remove city/fuel constraints.</p>
        </Card>
      )}
    </div>
  );
}
