import { useState } from "react";
import { ChartBar } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Badge, Field, StatCard } from "../components/ui";

const bucketColor: Record<string, string> = {
  "High-Demand": "bg-emerald-500",
  "Mid-Market":  "bg-blue-500",
  "High-Margin": "bg-purple-500",
  "High-Risk":   "bg-amber-500",
};

export default function InventoryAllocator() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    available_capital:   5000000,
    high_demand_pct:     40,
    mid_market_pct:      30,
    high_margin_pct:     20,
    high_risk_pct:       10,
    reconditioning_cost: 20000,
  });

  const totalPct = form.high_demand_pct + form.mid_market_pct + form.high_margin_pct + form.high_risk_pct;
  const pctError = totalPct !== 100 ? `Allocation must sum to 100% (currently ${totalPct}%)` : null;

  const set = (k: string, v: number) => setForm(f => ({ ...f, [k]: v }));

  const handleRun = async () => {
    if (pctError) return;
    setLoading(true); setError(null);
    try {
      const r = await ucApi.allocate(form);
      if (r.success) setResult(r.data);
      else setError(r.error);
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  const detail = result?.allocation_detail ?? [];
  const summary = result?.portfolio_summary ?? {};

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Portfolio Allocator"
        description="Distribute your available capital across vehicle segments. The engine selects the best vehicles within each bucket."
      />

      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Allocation Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Total Available Capital (₹)">
            <Input type="number" value={form.available_capital} onChange={e => set("available_capital", Number(e.target.value))} />
          </Field>
          <Field label="Reconditioning Cost per Vehicle (₹)">
            <Input type="number" value={form.reconditioning_cost} onChange={e => set("reconditioning_cost", Number(e.target.value))} />
          </Field>
        </div>

        <h4 className="text-xs font-semibold text-zinc-400 mb-3">Segment Allocation (must sum to 100%)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
          {[
            { key: "high_demand_pct",  label: "High-Demand %",  color: "text-emerald-400" },
            { key: "mid_market_pct",   label: "Mid-Market %",   color: "text-blue-400" },
            { key: "high_margin_pct",  label: "High-Margin %",  color: "text-purple-400" },
            { key: "high_risk_pct",    label: "High-Risk %",    color: "text-amber-400" },
          ].map(s => (
            <Field key={s.key} label={<span className={s.color}>{s.label}</span> as any}>
              <Input type="number" min={0} max={100} value={(form as any)[s.key]} onChange={e => set(s.key, Number(e.target.value))} />
            </Field>
          ))}
        </div>

        {/* Visual allocation bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
          {[
            { pct: form.high_demand_pct, color: "bg-emerald-500" },
            { pct: form.mid_market_pct,  color: "bg-blue-500" },
            { pct: form.high_margin_pct, color: "bg-purple-500" },
            { pct: form.high_risk_pct,   color: "bg-amber-500" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
          ))}
        </div>

        {pctError && <p className="text-xs text-red-400 mb-3">{pctError}</p>}
        <Button onClick={handleRun} disabled={loading || !!pctError}>
          {loading ? "Allocating…" : "Run Allocation"}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {result && (
        <>
          {/* Portfolio KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Vehicles"    value={String(summary.total_vehicles)} />
            <StatCard label="Capital Deployed"  value={`₹${((summary.capital_deployed ?? 0) / 100000).toFixed(1)}L`} />
            <StatCard label="Expected Profit"   value={`₹${((summary.expected_total_profit ?? 0) / 100000).toFixed(1)}L`} trend="up" />
            <StatCard label="Portfolio ROI"     value={`${summary.portfolio_roi_pct?.toFixed(1)}%`} trend="up" />
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { label: "Capital Available",   value: `₹${((summary.capital_available ?? 0) / 100000).toFixed(1)}L` },
              { label: "Capital Remaining",   value: `₹${((summary.capital_remaining ?? 0) / 100000).toFixed(1)}L` },
              { label: "Capital Utilisation", value: `${summary.capital_utilization_pct?.toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-zinc-500">{s.label}</p>
                <p className="text-zinc-100 font-mono font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Bucket Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {detail.map((b: any) => (
              <Card key={b.bucket} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${bucketColor[b.bucket] ?? "bg-zinc-500"}`} />
                    <h4 className="text-sm font-bold text-zinc-100">{b.bucket}</h4>
                  </div>
                  <Badge tone="zinc">{b.allocation_pct?.toFixed(0)}% of capital</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Capital Allocated",  value: `₹${((b.capital_allocated ?? 0) / 100000).toFixed(1)}L` },
                    { label: "Vehicles Selected",  value: b.vehicles_selected },
                    { label: "Capital Deployed",   value: `₹${((b.capital_deployed ?? 0) / 100000).toFixed(1)}L` },
                    { label: "Expected Revenue",   value: `₹${((b.expected_revenue ?? 0) / 100000).toFixed(1)}L` },
                    { label: "Expected Profit",    value: `₹${((b.expected_profit ?? 0) / 100000).toFixed(1)}L` },
                    { label: "ROI",                value: `${b.roi_pct?.toFixed(1)}%` },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-zinc-500">{s.label}</p>
                      <p className="text-zinc-200 font-mono font-bold mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400/80">
            <strong className="text-amber-400">Simulation estimates only.</strong> Resale price = listing price × 1.05. Acquisition = listing price × 0.92. These are market-data-driven estimates, not guaranteed outcomes.
          </div>
        </>
      )}
    </div>
  );
}
