import { useEffect, useState } from "react";
import { MagnifyingGlass, CheckCircle, Warning, Info } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Badge } from "../components/ui";

const inr = (n: number) => `₹${n?.toLocaleString("en-IN")}`;

export default function DataAudit() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ucApi.audit()
      .then(r => { if (r.success) setData(r.data); else setError(r.error || "Failed"); })
      .catch(() => setError("ML service unreachable. Start: uvicorn main:app --reload --port 8000"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (error) return <ErrorBanner message={error} />;

  const nullEntries = Object.entries(data?.null_counts ?? {}).filter(([, v]) => (v as number) > 0);
  const dtypes = data?.dtypes ?? {};

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Dataset Audit"
        description="Full statistical inspection of the used-car listings dataset before any modelling is performed."
      />

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Raw Records",     value: data?.total_records?.toLocaleString() },
          { label: "Clean Records",   value: data?.records_after_clean?.toLocaleString() },
          { label: "Columns",         value: data?.total_columns },
          { label: "Unique Makes",    value: data?.unique_makes },
          { label: "Unique Models",   value: data?.unique_models },
          { label: "Cities Covered",  value: data?.unique_cities },
        ].map(k => (
          <Card key={k.label} className="p-4 text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-medium">{k.label}</p>
            <p className="text-2xl font-black font-mono text-zinc-100 mt-1">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Range summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Price Range (INR)</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Min</span><span className="font-mono text-zinc-200">{inr(data?.price_range?.min)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Q25</span><span className="font-mono text-zinc-200">{inr(data?.price_range?.q25)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Median</span><span className="font-mono text-emerald-400 font-bold">{inr(data?.price_range?.median)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Mean</span><span className="font-mono text-zinc-200">{inr(data?.price_range?.mean)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Q75</span><span className="font-mono text-zinc-200">{inr(data?.price_range?.q75)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Max</span><span className="font-mono text-zinc-200">{inr(data?.price_range?.max)}</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Mileage Range (km)</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Min</span><span className="font-mono text-zinc-200">{data?.mileage_range?.min?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Q25</span><span className="font-mono text-zinc-200">{data?.mileage_range?.q25?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Median</span><span className="font-mono text-emerald-400 font-bold">{data?.mileage_range?.median?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Mean</span><span className="font-mono text-zinc-200">{Math.round(data?.mileage_range?.mean)?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Max</span><span className="font-mono text-zinc-200">{data?.mileage_range?.max?.toLocaleString()}</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Dataset Coverage</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Make Year</span><span className="font-mono text-zinc-200">{data?.make_year_range?.min} – {data?.make_year_range?.max}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Vehicle Age</span><span className="font-mono text-zinc-200">{data?.vehicle_age_range?.min} – {data?.vehicle_age_range?.max} yrs</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Listing Date</span><span className="font-mono text-zinc-200 text-xs">Jan – Aug 2025</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Fuel Types</span><span className="font-mono text-zinc-200">{data?.fuel_types?.length}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Body Types</span><span className="font-mono text-zinc-200">{data?.body_types?.length}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Owners (max)</span><span className="font-mono text-zinc-200">3rd owner</span></div>
          </div>
        </Card>
      </div>

      {/* Null values + Data Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" /> Data Quality
          </h3>
          {nullEntries.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle size={16} weight="fill" /> No null values detected (except 1 in color)
            </div>
          ) : (
            <div className="space-y-2">
              {nullEntries.map(([col, cnt]) => (
                <div key={col} className="flex justify-between text-sm">
                  <span className="text-zinc-300 font-mono">{col}</span>
                  <Badge tone="amber">{String(cnt)} nulls</Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-zinc-500 mt-3">Treatment: color → imputed "unknown". No rows dropped for nulls.</p>
        </Card>

        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info size={14} className="text-sky-400" /> Column Data Types
          </h3>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {Object.entries(dtypes).map(([col, dtype]) => (
              <div key={col} className="flex justify-between text-xs">
                <span className="text-zinc-300 font-mono">{col}</span>
                <Badge tone={String(dtype).includes("int") || String(dtype).includes("float") ? "emerald" : "zinc"}>{String(dtype)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Variable Classification */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Variable Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Directly Observed", tone: "emerald" as const, vars: ["city", "make", "model", "variant", "mileage", "make_year", "price", "fuel_type", "no_of_owners", "color", "body_type", "transmission", "registration_year", "latest_publish_date"] },
            { label: "Derived (Computed)", tone: "sky" as const,     vars: ["vehicle_age", "mileage_per_year", "registration_age", "listing_recency_days", "price_per_km", "price_segment", "demand_score", "opportunity_score", "risk_score"] },
            { label: "Predicted (ML)",    tone: "zinc" as const,     vars: ["estimated_resale_price", "fair_market_value", "acquisition_price_estimate"] },
            { label: "Assumptions (User)",tone: "amber" as const,    vars: ["reconditioning_cost", "transport_cost", "platform_fee_pct", "target_holding_days", "negotiation_buffer_pct"] },
          ].map(g => (
            <div key={g.label}>
              <Badge tone={g.tone}>{g.label}</Badge>
              <ul className="mt-2 space-y-1">
                {g.vars.map(v => <li key={v} className="text-xs text-zinc-400 font-mono">· {v}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Limitations */}
      <Card className="p-5 border-amber-500/20 bg-amber-500/5">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Warning size={14} /> Dataset Limitations (Explicitly Labelled)
        </h3>
        <ul className="space-y-1.5">
          {(data?.limitations ?? []).map((l: string) => (
            <li key={l} className="text-xs text-amber-400/80 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">·</span>{l}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
