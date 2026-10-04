import { useState } from "react";
import { Scales, FunnelSimple, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Select, Input, Button, Badge, Field } from "../components/ui";

const tone = (s: number) => s >= 70 ? "emerald" : s >= 45 ? "sky" : "zinc";
const riskTone = (s: number) => s >= 65 ? "red" : s >= 35 ? "amber" : "emerald";
const recLabel = (r: string) => r === "BUY" ? "emerald" : r === "HOLD" ? "sky" : r === "SELL" ? "amber" : "red";

export default function OpportunityFinder() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<"opportunity_score" | "demand_score" | "risk_score" | "price">("opportunity_score");
  const [sortAsc, setSortAsc] = useState(false);

  const [form, setForm] = useState({
    min_opportunity: 0, min_demand: 0, max_risk: 100,
    city: "", make: "", fuel_type: "", body_type: "", transmission: "",
    min_price: "", max_price: "", max_age: "", max_mileage: "", limit: 50,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSearch = async () => {
    setLoading(true); setError(null);
    try {
      const body: any = { ...form };
      if (!body.city) body.city = null;
      if (!body.make) body.make = null;
      if (!body.fuel_type) body.fuel_type = null;
      if (!body.body_type) body.body_type = null;
      if (!body.transmission) body.transmission = null;
      body.min_price = body.min_price ? Number(body.min_price) : null;
      body.max_price = body.max_price ? Number(body.max_price) : null;
      body.max_age   = body.max_age   ? Number(body.max_age)   : null;
      body.max_mileage = body.max_mileage ? Number(body.max_mileage) : null;

      const r = await ucApi.opportunity(body);
      if (r.success) setResult(r.data);
      else setError(r.error);
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  const vehicles = [...(result?.vehicles ?? [])].sort((a, b) =>
    sortAsc ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol]
  );

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortAsc ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : null;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Opportunity Finder"
        description="Rank vehicles by composite opportunity score (demand + margin + risk + velocity). Filter to find the best acquisition targets."
      />

      {/* Filters */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FunnelSimple size={14} /> Filters & Thresholds</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <Field label="Min Opportunity Score">
            <Input type="number" min={0} max={100} value={form.min_opportunity} onChange={e => set("min_opportunity", Number(e.target.value))} />
          </Field>
          <Field label="Min Demand Score">
            <Input type="number" min={0} max={100} value={form.min_demand} onChange={e => set("min_demand", Number(e.target.value))} />
          </Field>
          <Field label="Max Risk Score">
            <Input type="number" min={0} max={100} value={form.max_risk} onChange={e => set("max_risk", Number(e.target.value))} />
          </Field>
          <Field label="Min Price (₹)">
            <Input type="number" placeholder="e.g. 200000" value={form.min_price} onChange={e => set("min_price", e.target.value)} />
          </Field>
          <Field label="Max Price (₹)">
            <Input type="number" placeholder="e.g. 1000000" value={form.max_price} onChange={e => set("max_price", e.target.value)} />
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={e => set("city", e.target.value)}>
              <option value="">All cities</option>
              {["delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur","lucknow"].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Brand">
            <Select value={form.make} onChange={e => set("make", e.target.value)}>
              <option value="">All brands</option>
              {["Maruti Suzuki","Hyundai","Honda","Tata","Toyota","Kia","Mahindra","Skoda","Volkswagen","Ford","Renault","Nissan","MG Motors"].map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Fuel Type">
            <Select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>
              <option value="">All fuels</option>
              {["petrol","diesel","cng","hybrid"].map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Body Type">
            <Select value={form.body_type} onChange={e => set("body_type", e.target.value)}>
              <option value="">All types</option>
              {["hatchback","suv","sedan","muv","crossover"].map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Transmission">
            <Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
              <option value="">Any</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </Select>
          </Field>
          <Field label="Max Age (years)">
            <Input type="number" placeholder="e.g. 7" value={form.max_age} onChange={e => set("max_age", e.target.value)} />
          </Field>
          <Field label="Max Mileage (km)">
            <Input type="number" placeholder="e.g. 80000" value={form.max_mileage} onChange={e => set("max_mileage", e.target.value)} />
          </Field>
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Find Opportunities"}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {result && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Scales size={14} className="text-emerald-400" /> Results
            </h3>
            <Badge tone="emerald">{result.total_matching} matching</Badge>
          </div>

          {loading ? <Skeleton className="h-64 rounded-xl" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {[
                      { label: "Brand / Model", col: null },
                      { label: "City", col: null },
                      { label: "Year", col: null },
                      { label: "Mileage", col: null },
                      { label: "Price", col: "price" as const },
                      { label: "Opportunity ↕", col: "opportunity_score" as const },
                      { label: "Demand ↕", col: "demand_score" as const },
                      { label: "Risk ↕", col: "risk_score" as const },
                      { label: "Segment", col: null },
                    ].map(h => (
                      <th key={h.label}
                        onClick={() => h.col && toggleSort(h.col as any)}
                        className={`text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap ${h.col ? "cursor-pointer hover:text-zinc-300" : ""}`}>
                        <span className="inline-flex items-center gap-1">{h.label}{h.col && <SortIcon col={h.col as any} />}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: any, i: number) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-4">
                        <p className="text-zinc-100 font-bold">{v.make} {v.model}</p>
                        <p className="text-zinc-500 text-[10px]">{v.variant}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-300 capitalize">{v.city}</td>
                      <td className="py-2.5 pr-4 text-zinc-300 font-mono">{v.make_year}</td>
                      <td className="py-2.5 pr-4 text-zinc-400 font-mono">{v.mileage?.toLocaleString()} km</td>
                      <td className="py-2.5 pr-4 text-zinc-200 font-mono font-bold">₹{(v.price / 100000).toFixed(1)}L</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${v.opportunity_score}%` }} /></div>
                          <span className="font-mono text-emerald-400 font-bold">{v.opportunity_score?.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-sky-400">{v.demand_score?.toFixed(0)}</td>
                      <td className="py-2.5 pr-4"><Badge tone={riskTone(v.risk_score)}>{v.risk_score?.toFixed(0)}</Badge></td>
                      <td className="py-2.5 pr-4"><Badge tone="zinc">{v.price_segment ?? "—"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
