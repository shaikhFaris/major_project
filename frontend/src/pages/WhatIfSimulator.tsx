import { useState } from "react";
import { Robot, TrendUp, TrendDown, ArrowsClockwise, Info } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Select, Field, Badge } from "../components/ui";

const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
const pctColor = (v: number) => v > 5 ? "text-emerald-400" : v < -5 ? "text-red-400" : "text-zinc-300";

const SCENARIOS = [
  { value: "demand_increase", label: "Demand Surge", desc: "Demand scores boosted by the perturbation %" },
  { value: "price_increase", label: "Price Increase", desc: "Acquisition prices rise across the market" },
  { value: "capital_reduction", label: "Capital Reduction", desc: "Your available capital is reduced by the perturbation %" },
  { value: "fuel_shift", label: "Fuel Demand Shift", desc: "Demand shifts between fuel types" },
  { value: "age_restriction", label: "Age Restriction", desc: "Market limited to vehicles newer than max_age" },
  { value: "margin_target", label: "Margin Target Increase", desc: "Raise your minimum acceptable margin %" },
];

export default function WhatIfSimulator() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    scenario: "demand_increase",
    base_capital: 5000000,
    perturbation_pct: 15,
    fuel_shift_from: "petrol",
    fuel_shift_to: "diesel",
    max_age: 7,
    target_margin_pct: 15,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRun = async () => {
    setLoading(true); setError(null);
    try {
      const body: any = {
        scenario: form.scenario,
        base_capital: form.base_capital,
        perturbation_pct: form.perturbation_pct,
        target_margin_pct: form.target_margin_pct,
      };
      if (form.scenario === "fuel_shift") { body.fuel_shift_from = form.fuel_shift_from; body.fuel_shift_to = form.fuel_shift_to; }
      if (form.scenario === "age_restriction") body.max_age = form.max_age;

      const r = await ucApi.whatif(body);
      if (r.success) setResult(r.data);
      else setError(r.error || "Failed");
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  const baseline = result?.baseline ?? {};
  const modified = result?.modified ?? {};
  const impact = result?.impact ?? {};
  const selectedScenario = SCENARIOS.find(s => s.value === form.scenario);

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="What-If Simulator"
        description="Model how market shocks or strategic pivots affect your portfolio. Compare baseline vs scenario outcomes."
      />

      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Scenario Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Scenario" hint={selectedScenario?.desc}>
            <Select value={form.scenario} onChange={e => set("scenario", e.target.value)}>
              {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Base Capital (₹)">
            <Input type="number" value={form.base_capital} onChange={e => set("base_capital", Number(e.target.value))} />
          </Field>
          <Field label="Perturbation (%)" hint="Magnitude of the shock">
            <Input type="number" min={1} max={100} value={form.perturbation_pct} onChange={e => set("perturbation_pct", Number(e.target.value))} />
          </Field>

          {form.scenario === "fuel_shift" && (
            <>
              <Field label="Shift Demand From"><Select value={form.fuel_shift_from} onChange={e => set("fuel_shift_from", e.target.value)}>{["petrol","diesel","cng"].map(f => <option key={f} value={f}>{f}</option>)}</Select></Field>
              <Field label="Shift Demand To"><Select value={form.fuel_shift_to} onChange={e => set("fuel_shift_to", e.target.value)}>{["petrol","diesel","cng"].map(f => <option key={f} value={f}>{f}</option>)}</Select></Field>
            </>
          )}
          {form.scenario === "age_restriction" && (
            <Field label="Max Vehicle Age (yrs)"><Input type="number" min={1} max={15} value={form.max_age} onChange={e => set("max_age", Number(e.target.value))} /></Field>
          )}
          {form.scenario === "margin_target" && (
            <Field label="Target Margin (%)"><Input type="number" min={1} max={50} value={form.target_margin_pct} onChange={e => set("target_margin_pct", Number(e.target.value))} /></Field>
          )}
        </div>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? <><ArrowsClockwise size={14} className="animate-spin" /> Simulating…</> : <><Robot size={14} /> Run What-If Scenario</>}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {result && (
        <>
          {/* Scenario description */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-violet-300">{result.description}</p>
              <p className="text-xs text-zinc-500 mt-1">Perturbation: {result.perturbation_pct}%</p>
            </div>
          </div>

          {/* Comparison table */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Baseline vs Modified Portfolio</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-semibold py-2 pr-6">Metric</th>
                    <th className="text-right text-zinc-500 font-semibold py-2 pr-6">Baseline</th>
                    <th className="text-right text-zinc-500 font-semibold py-2 pr-6">After Scenario</th>
                    <th className="text-right text-zinc-500 font-semibold py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Vehicles in Portfolio", base: baseline.vehicle_count, mod: modified.vehicle_count, impact: impact.vehicle_count_change_pct },
                    { label: "Capital Deployed", base: inr(baseline.capital_deployed ?? 0), mod: inr(modified.capital_deployed ?? 0), impact: null },
                    { label: "Expected Revenue", base: inr(baseline.expected_revenue ?? 0), mod: inr(modified.expected_revenue ?? 0), impact: impact.revenue_change_pct },
                    { label: "Expected Profit", base: inr(baseline.expected_profit ?? 0), mod: inr(modified.expected_profit ?? 0), impact: impact.profit_change_pct },
                    { label: "Portfolio ROI %", base: `${baseline.roi_pct?.toFixed(1)}%`, mod: `${modified.roi_pct?.toFixed(1)}%`, impact: impact.roi_change_pct },
                    { label: "Capital Utilization %", base: `${baseline.capital_utilization?.toFixed(1)}%`, mod: `${modified.capital_utilization?.toFixed(1)}%`, impact: impact.capital_utilization_change },
                    { label: "Avg Demand Score", base: baseline.avg_demand_score?.toFixed(1), mod: modified.avg_demand_score?.toFixed(1), impact: impact.demand_exposure_change_pct },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-6 text-zinc-300">{row.label}</td>
                      <td className="py-2.5 pr-6 text-right font-mono text-zinc-400">{String(row.base ?? "—")}</td>
                      <td className="py-2.5 pr-6 text-right font-mono text-zinc-100 font-bold">{String(row.mod ?? "—")}</td>
                      <td className="py-2.5 text-right font-mono font-bold">
                        {row.impact != null ? (
                          <span className={pctColor(row.impact)}>
                            {row.impact > 0 ? "▲" : row.impact < 0 ? "▼" : "="} {Math.abs(row.impact).toFixed(1)}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Impact summary badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Revenue Impact", value: impact.revenue_change_pct },
              { label: "Profit Impact", value: impact.profit_change_pct },
              { label: "ROI Impact", value: impact.roi_change_pct },
            ].map(m => (
              <div key={m.label} className={`p-4 rounded-xl border text-center ${(m.value ?? 0) >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <p className="text-[10px] text-zinc-500 uppercase font-medium">{m.label}</p>
                <p className={`text-xl font-black font-mono mt-1 flex items-center justify-center gap-1 ${(m.value ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(m.value ?? 0) >= 0 ? <TrendUp size={20} weight="bold" /> : <TrendDown size={20} weight="bold" />}
                  {Math.abs(m.value ?? 0).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
