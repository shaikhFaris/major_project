import { useEffect, useState } from "react";
import { Star, FunnelSimple, Info } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Select, Badge, Button } from "../components/ui";

const demandBadge = (s: number) => s >= 70 ? "emerald" : s >= 40 ? "sky" : "zinc";
const demandLabel = (s: number) => s >= 70 ? "High" : s >= 40 ? "Medium" : "Low";

export default function DemandAnalysis() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [fuel, setFuel] = useState("");
  const [body, setBody] = useState("");

  const load = (c?: string, f?: string, b?: string) => {
    setLoading(true);
    ucApi.demand({ city: c || null, fuel_type: f || null, body_type: b || null })
      .then(r => { if (r.success) setData(r.data); else setError(r.error); })
      .catch(() => setError("ML service unreachable"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = () => load(city, fuel, body);
  const handleReset = () => { setCity(""); setFuel(""); setBody(""); load(); };

  const topVehicles: any[] = data?.top_demand_vehicles ?? [];

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Demand Analysis"
        description="Which cars are most in demand right now? Demand score is a listing-frequency proxy (0–100) — not actual consumer sales data."
      />

      {/* Disclaimer */}
      <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-3 flex items-start gap-3">
        <Info size={14} className="text-sky-400 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-300/80">
          <strong className="text-sky-300">Demand Score</strong> = normalized listing frequency per vehicle model (0–100).
          More listings in this dataset = higher market activity = higher score. This is NOT actual consumer demand data.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-36">
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">City</label>
            <Select value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All cities</option>
              {["delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur","chandigarh","lucknow"].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">Fuel Type</label>
            <Select value={fuel} onChange={e => setFuel(e.target.value)}>
              <option value="">All fuel types</option>
              {["petrol","diesel","cng","petrol+cng","hybrid"].map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">Body Type</label>
            <Select value={body} onChange={e => setBody(e.target.value)}>
              <option value="">All body types</option>
              {["hatchback","suv","sedan","muv","crossover"].map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFilter} disabled={loading}>Apply</Button>
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Analyzed",      value: data.total_analyzed?.toLocaleString(), color: "text-zinc-100" },
            { label: "High Demand",         value: data.high_demand_count?.toLocaleString(), color: "text-emerald-400" },
            { label: "Medium Demand",       value: data.medium_demand_count?.toLocaleString(), color: "text-sky-400" },
            { label: "Low Demand",          value: data.low_demand_count?.toLocaleString(), color: "text-zinc-400" },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-medium">{s.label}</p>
              <p className={`text-2xl font-black font-mono mt-1 ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : error ? <ErrorBanner message={error} /> : (
        <>
          {/* Top Demand Vehicles Table */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star size={14} className="text-amber-400" /> Top Demand Vehicles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["Brand", "Model", "Listings", "Demand Score", "Demand Level", "Avg Price", "Avg Mileage", "Avg Age"].map(h => (
                      <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topVehicles.map((v: any) => (
                    <tr key={`${v.make}-${v.model}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-4 text-zinc-200 font-medium">{v.make}</td>
                      <td className="py-2.5 pr-4 text-zinc-100 font-bold">{v.model}</td>
                      <td className="py-2.5 pr-4 text-zinc-300 font-mono">{Math.round(v.listings)}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${v.demand_score}%` }} />
                          </div>
                          <span className="font-mono text-zinc-300">{v.demand_score?.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4"><Badge tone={demandBadge(v.demand_score)}>{demandLabel(v.demand_score)}</Badge></td>
                      <td className="py-2.5 pr-4 text-zinc-300 font-mono">₹{(v.avg_price / 100000).toFixed(1)}L</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{Math.round(v.avg_mileage).toLocaleString()} km</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{v.avg_age?.toFixed(1)} yr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Demand by city and fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Listings by City</h3>
              <div className="space-y-2.5">
                {(data.demand_by_city ?? []).map((c: any) => {
                  const max = data.demand_by_city[0]?.listings ?? 1;
                  return (
                    <div key={c.city}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 capitalize font-medium">{c.city}</span>
                        <span className="text-zinc-400 font-mono">{c.listings}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.listings / max * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Listings by Body Type</h3>
              <div className="space-y-2.5">
                {(data.demand_by_body_type ?? []).map((b: any) => {
                  const max = data.demand_by_body_type[0]?.listings ?? 1;
                  return (
                    <div key={b.body_type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 capitalize font-medium">{b.body_type}</span>
                        <span className="text-zinc-400 font-mono">{b.listings}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${b.listings / max * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
