import { useState } from "react";
import { ShoppingCart, CheckCircle, Warning, Info } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Select, Input, Button, Badge, Field, StatCard } from "../components/ui";

export default function AcquisitionStrategy() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    available_capital: 5000000,
    max_vehicles: 10,
    target_roi_pct: 15,
    target_margin_pct: 10,
    city: "",
    max_age: 8,
    max_mileage: 80000,
    fuel_type: "",
    transmission: "",
    risk_tolerance: "medium",
    negotiation_buffer_pct: 8,
    reconditioning_cost: 20000,
    transport_cost: 5000,
    platform_fee_pct: 2,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRun = async () => {
    setLoading(true); setError(null);
    try {
      const body = { ...form, city: form.city || null, fuel_type: form.fuel_type || null, transmission: form.transmission || null };
      const r = await ucApi.acquire(body);
      if (r.success) setResult(r.data);
      else setError(r.error || "No results");
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  const recs = result?.recommendations ?? [];
  const summary = result?.summary ?? {};
  const assumptions = result?.assumptions ?? {};

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="What Should I Buy?"
        description="Enter your available capital and constraints. The engine will recommend the optimal set of vehicles to acquire."
      />

      {/* Strategy Config */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Strategy Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
          <Field label="Available Capital (₹)" hint="Total acquisition budget">
            <Input type="number" value={form.available_capital} onChange={e => set("available_capital", Number(e.target.value))} />
          </Field>
          <Field label="Max Vehicles">
            <Input type="number" min={1} max={50} value={form.max_vehicles} onChange={e => set("max_vehicles", Number(e.target.value))} />
          </Field>
          <Field label="Target ROI (%)">
            <Input type="number" value={form.target_roi_pct} onChange={e => set("target_roi_pct", Number(e.target.value))} />
          </Field>
          <Field label="Target Margin (%)">
            <Input type="number" value={form.target_margin_pct} onChange={e => set("target_margin_pct", Number(e.target.value))} />
          </Field>
          <Field label="Max Vehicle Age (years)">
            <Input type="number" value={form.max_age} onChange={e => set("max_age", Number(e.target.value))} />
          </Field>
          <Field label="Max Mileage (km)">
            <Input type="number" value={form.max_mileage} onChange={e => set("max_mileage", Number(e.target.value))} />
          </Field>
          <Field label="Risk Tolerance">
            <Select value={form.risk_tolerance} onChange={e => set("risk_tolerance", e.target.value)}>
              <option value="low">Low (conservative)</option>
              <option value="medium">Medium (balanced)</option>
              <option value="high">High (aggressive)</option>
            </Select>
          </Field>
          <Field label="City Focus">
            <Select value={form.city} onChange={e => set("city", e.target.value)}>
              <option value="">All cities</option>
              {["delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur"].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Fuel Type">
            <Select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>
              <option value="">Any</option>
              {["petrol","diesel","cng"].map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Transmission">
            <Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
              <option value="">Any</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </Select>
          </Field>
          <Field label="Negotiation Buffer (%)">
            <Input type="number" value={form.negotiation_buffer_pct} onChange={e => set("negotiation_buffer_pct", Number(e.target.value))} />
          </Field>
          <Field label="Reconditioning Cost (₹)">
            <Input type="number" value={form.reconditioning_cost} onChange={e => set("reconditioning_cost", Number(e.target.value))} />
          </Field>
        </div>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? "Analysing market…" : "Generate Acquisition Plan"}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {/* Portfolio Summary */}
      {summary.vehicles_selected > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Vehicles Selected"    value={String(summary.vehicles_selected)} />
            <StatCard label="Capital Deployed"     value={`₹${((summary.capital_deployed ?? 0) / 100000).toFixed(1)}L`} />
            <StatCard label="Est. Total Profit"    value={`₹${((summary.estimated_total_profit ?? 0) / 100000).toFixed(1)}L`} trend="up" />
            <StatCard label="Portfolio ROI"        value={`${summary.estimated_portfolio_roi_pct?.toFixed(1)}%`} trend="up" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Capital Available",    value: `₹${((summary.capital_available ?? 0) / 100000).toFixed(1)}L` },
              { label: "Capital Remaining",    value: `₹${((summary.capital_remaining ?? 0) / 100000).toFixed(1)}L` },
              { label: "Est. Total Revenue",   value: `₹${((summary.estimated_total_revenue ?? 0) / 100000).toFixed(1)}L` },
              { label: "Capital Utilisation",  value: `${summary.capital_utilization_pct?.toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-zinc-500">{s.label}</p>
                <p className="text-zinc-100 font-mono font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Recommendations Table */}
          {loading ? <Skeleton className="h-64 rounded-xl" /> : (
            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShoppingCart size={14} className="text-emerald-400" /> Recommended Acquisitions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {["Vehicle", "City", "Year/Mileage", "Acq. Price", "Est. Resale", "Est. Profit", "ROI", "Demand", "Opportunity", "Action"].map(h => (
                        <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((v: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-2.5 pr-3">
                          <p className="text-zinc-100 font-bold">{v.make} {v.model}</p>
                          <p className="text-zinc-500 text-[10px] capitalize">{v.fuel_type} · {v.body_type} · {v.transmission}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-300 capitalize">{v.city}</td>
                        <td className="py-2.5 pr-3 text-zinc-400 font-mono">
                          {v.make_year}<br />
                          <span className="text-[10px]">{v.mileage?.toLocaleString()} km</span>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-200 font-mono font-bold">₹{((v.acquisition_price ?? 0) / 100000).toFixed(1)}L</td>
                        <td className="py-2.5 pr-3 text-zinc-300 font-mono">₹{((v.estimated_resale_price ?? 0) / 100000).toFixed(1)}L</td>
                        <td className="py-2.5 pr-3 text-emerald-400 font-mono font-bold">₹{((v.estimated_gross_profit ?? 0) / 100000).toFixed(1)}L</td>
                        <td className="py-2.5 pr-3 font-mono text-emerald-300">{v.estimated_roi_pct?.toFixed(1)}%</td>
                        <td className="py-2.5 pr-3 font-mono text-sky-400">{v.demand_score?.toFixed(0)}</td>
                        <td className="py-2.5 pr-3 font-mono text-emerald-400">{v.opportunity_score?.toFixed(0)}</td>
                        <td className="py-2.5 pr-3"><Badge tone="emerald">{v.recommendation}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Assumptions */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400/80">
            <strong className="text-amber-400">Assumptions used:</strong>{" "}
            Negotiation buffer {assumptions.negotiation_buffer_pct}% · Reconditioning ₹{(assumptions.reconditioning_cost / 1000).toFixed(0)}k · Transport ₹{(assumptions.transport_cost / 1000).toFixed(0)}k · Platform fee {assumptions.platform_fee_pct}%.{" "}
            {assumptions.note}
          </div>
        </>
      )}

      {result && recs.length === 0 && (
        <div className="text-center py-10 text-zinc-500">
          <Warning size={32} className="mx-auto mb-3 text-amber-400" />
          <p className="font-semibold text-zinc-300">{summary.error || "No vehicles matched your criteria."}</p>
          <p className="text-sm mt-1">Try relaxing the ROI target, increasing capital, or broadening city/fuel filters.</p>
        </div>
      )}
    </div>
  );
}
