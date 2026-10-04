import { useState } from "react";
import { Car, CheckCircle, ArrowsCounterClockwise } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Select, Field, StatCard, Badge } from "../components/ui";

const CITIES = ["delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur"];
const FUELS = ["petrol","diesel","cng","hybrid"];
const BODIES = ["hatchback","sedan","suv","muv","crossover"];
const TRANSMISSIONS = ["manual","automatic"];

export default function PricingStrategy() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: "", model: "", make_year: 2021, mileage: 60000,
    city: "delhi-ncr", no_of_owners: 1, fuel_type: "petrol",
    transmission: "manual", body_type: "hatchback", acquisition_price: 400000,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRun = async () => {
    if (!form.make || !form.model) return;
    setLoading(true); setError(null);
    try {
      const r = await ucApi.priceStrategy(form);
      if (r.success) setResult(r.data);
      else setError(r.error || "Failed");
    } catch { setError("ML service unreachable"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Pricing Strategy"
        description="Enter vehicle details and your acquisition price. The engine will recommend an optimal listing price based on comparable market data."
      />

      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Vehicle Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Brand *"><Input value={form.make} onChange={e => set("make", e.target.value)} placeholder="e.g. Maruti Suzuki" /></Field>
          <Field label="Model *"><Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. Swift" /></Field>
          <Field label="Make Year"><Input type="number" value={form.make_year} onChange={e => set("make_year", Number(e.target.value))} /></Field>
          <Field label="Mileage (km)"><Input type="number" value={form.mileage} onChange={e => set("mileage", Number(e.target.value))} /></Field>
          <Field label="No. of Owners">
            <Select value={form.no_of_owners} onChange={e => set("no_of_owners", Number(e.target.value))}>
              <option value={1}>1st Owner</option>
              <option value={2}>2nd Owner</option>
              <option value={3}>3rd Owner</option>
            </Select>
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={e => set("city", e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Fuel Type">
            <Select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>
              {FUELS.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Transmission">
            <Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
              {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Body Type">
            <Select value={form.body_type} onChange={e => set("body_type", e.target.value)}>
              {BODIES.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Acquisition Price (₹)" hint="What you paid for this vehicle">
            <Input type="number" value={form.acquisition_price} onChange={e => set("acquisition_price", Number(e.target.value))} />
          </Field>
        </div>
        <Button onClick={handleRun} disabled={loading || !form.make || !form.model}>
          {loading ? <><ArrowsCounterClockwise size={14} className="animate-spin" /> Calculating…</> : <><Car size={14} /> Get Pricing Recommendation</>}
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      {result && !result.error && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Recommended Listing" value={`₹${((result.recommended_listing_price ?? 0) / 100000).toFixed(1)}L`} trend="up" sub="with 5% negotiation buffer" />
            <StatCard label="Market Median" value={`₹${((result.market_median_price ?? 0) / 100000).toFixed(1)}L`} sub={`${result.similar_listings} similar listings`} />
            <StatCard label="Est. Gross Profit" value={`₹${((result.estimated_gross_profit ?? 0) / 100000).toFixed(1)}L`} trend={(result.estimated_gross_profit ?? 0) >= 0 ? "up" : "down"} />
            <StatCard label="ROI" value={`${result.estimated_roi_pct?.toFixed(1)}%`} trend={(result.estimated_roi_pct ?? 0) >= 0 ? "up" : "down"} />
          </div>

          {/* Price breakdown card */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Car size={14} className="text-emerald-400" /> Price Analysis — {result.make} {result.model} ({result.make_year})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  { label: "Acquisition Price", value: result.acquisition_price, color: "text-zinc-300" },
                  { label: "City Median ("+result.city+")", value: result.city_median_price, color: "text-sky-400" },
                  { label: "Market Median", value: result.market_median_price, color: "text-sky-400" },
                  { label: "Estimated Market Value", value: result.estimated_market_price, color: "text-zinc-200" },
                  { label: "Minimum Target Price", value: result.minimum_target_price, color: "text-amber-400" },
                  { label: "Recommended Listing Price", value: result.recommended_listing_price, color: "text-emerald-400", bold: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{row.label}</span>
                    <span className={`font-mono ${row.bold ? "font-black text-lg" : "font-semibold"} ${row.color}`}>
                      ₹{((row.value ?? 0) / 100000).toFixed(1)}L
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Price Position</span>
                  <Badge tone={result.price_position_vs_market === "Below Market" ? "amber" : result.price_position_vs_market === "Above Market" ? "sky" : "emerald"}>
                    {result.price_position_vs_market}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Gross Margin %</span>
                  <span className="font-mono text-emerald-400 font-bold">{result.estimated_gross_margin_pct?.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Mileage Adjustment</span>
                  <span className="font-mono text-zinc-300">{result.adjustments?.mileage_factor?.toFixed(3)}×</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Ownership Adjustment</span>
                  <span className="font-mono text-zinc-300">{result.adjustments?.ownership_factor?.toFixed(2)}×</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Market Range</span>
                  <span className="font-mono text-zinc-400 text-xs">
                    ₹{((result.market_range?.min ?? 0) / 100000).toFixed(1)}L – ₹{((result.market_range?.max ?? 0) / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Similar Listings</span>
                  <span className="font-mono text-zinc-300">{result.similar_listings}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 border-t border-zinc-800 pt-3">{result.note}</p>
          </Card>
        </>
      )}

      {result?.error && (
        <Card className="p-5 border-amber-500/20 bg-amber-500/5">
          <p className="text-amber-400 text-sm font-semibold">{result.error}</p>
          <p className="text-zinc-400 text-xs mt-1">Try a different make/model combination.</p>
        </Card>
      )}
    </div>
  );
}
