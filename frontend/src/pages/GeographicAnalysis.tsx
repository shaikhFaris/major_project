import { useEffect, useState } from "react";
import { MapPin, ArrowRight, FunnelSimple } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Field, Badge, StatCard } from "../components/ui";

const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

export default function GeographicAnalysis() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState({
    transport_cost: 5000,
    reconditioning_cost: 20000,
    platform_fee_pct: 2,
  });
  const [dirty, setDirty] = useState(false);
  const set = (k: string, v: any) => { setParams(p => ({ ...p, [k]: v })); setDirty(true); };

  const load = (p = params) => {
    setLoading(true); setError(null);
    ucApi.geographic(p)
      .then(r => { if (r.success) setData(r.data); else setError(r.error || "Failed"); })
      .catch(() => setError("ML service unreachable"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cities: any[] = data?.city_statistics ?? [];
  const arbitrage: any[] = data?.arbitrage_opportunities ?? [];

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Geographic Analysis"
        description="City-level price comparison and cross-city arbitrage opportunities based on 8,095+ Indian used-car listings."
      />

      {/* Cost assumptions */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FunnelSimple size={14} /> Cost Assumptions
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <Field label="Transport Cost (₹)">
            <Input type="number" value={params.transport_cost} onChange={e => set("transport_cost", Number(e.target.value))} className="w-36" />
          </Field>
          <Field label="Reconditioning Cost (₹)">
            <Input type="number" value={params.reconditioning_cost} onChange={e => set("reconditioning_cost", Number(e.target.value))} className="w-36" />
          </Field>
          <Field label="Platform Fee (%)">
            <Input type="number" step="0.5" value={params.platform_fee_pct} onChange={e => set("platform_fee_pct", Number(e.target.value))} className="w-24" />
          </Field>
          {dirty && (
            <Button onClick={() => { load(params); setDirty(false); }}>
              Recalculate
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : (
        <>
          {/* City price table */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-teal-400" /> City Price Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["City", "Listings", "Avg Price", "Median Price", "Min", "Max", "Std Dev"].map(h => (
                      <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cities.map((c: any) => (
                    <tr key={c.city} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-4 text-zinc-200 font-semibold capitalize">{c.city}</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{Number(c.listings).toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-zinc-200 font-mono">{inr(c.avg_price)}</td>
                      <td className="py-2.5 pr-4 text-emerald-400 font-mono font-bold">{inr(c.median_price)}</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{inr(c.min_price)}</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{inr(c.max_price)}</td>
                      <td className="py-2.5 pr-4 text-zinc-500 font-mono">{inr(c.std_price ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Arbitrage opportunities */}
          <div>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRight size={14} className="text-emerald-400" /> Arbitrage Opportunities
              <Badge tone="zinc">{arbitrage.length} opportunities found</Badge>
            </h2>
            {arbitrage.length === 0 ? (
              <Card className="p-8 text-center text-zinc-500 text-sm">
                No profitable arbitrage opportunities with current cost assumptions.
              </Card>
            ) : (
              <Card className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Vehicle", "Buy City", "Sell City", "Buy Price", "Sell Price", "Price Gap", "Est. Profit", "Est. ROI"].map(h => (
                          <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {arbitrage.slice(0, 30).map((a: any, i: number) => (
                        <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          <td className="py-2.5 pr-4">
                            <p className="text-zinc-200 font-bold">{a.make} {a.model}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-sky-400 capitalize">{a.buy_city}</td>
                          <td className="py-2.5 pr-4 text-purple-400 capitalize">{a.sell_city}</td>
                          <td className="py-2.5 pr-4 text-zinc-300 font-mono">{inr(a.buy_avg_price)}</td>
                          <td className="py-2.5 pr-4 text-zinc-300 font-mono">{inr(a.sell_avg_price)}</td>
                          <td className="py-2.5 pr-4 text-amber-400 font-mono">{inr(a.price_gap)}</td>
                          <td className="py-2.5 pr-4 text-emerald-400 font-mono font-bold">{inr(a.estimated_profit)}</td>
                          <td className="py-2.5 pr-4 text-emerald-300 font-mono">{a.estimated_roi_pct?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-zinc-500 mt-3">
                  {data?.assumptions?.note}
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
