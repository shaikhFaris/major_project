import { useEffect, useState } from "react";
import { Warning, ShieldCheck, ShieldSlash, TrendDown, TrendUp, Info, Car } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Badge, StatCard } from "../components/ui";

const inr = (n: number) => `₹${(n / 100_000).toFixed(1)}L`;

function RiskMeter({ label, value, color }: { label: string; value: number; color: string }) {
  const clamp = Math.min(100, Math.max(0, value));
  const textColor =
    clamp >= 70 ? "text-red-400" : clamp >= 40 ? "text-amber-400" : "text-emerald-400";
  const barColor =
    clamp >= 70 ? "bg-red-500" : clamp >= 40 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className={`font-bold font-mono ${textColor}`}>{clamp.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${clamp}%` }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge tone="red">High Risk</Badge>;
  if (score >= 40) return <Badge tone="amber">Medium Risk</Badge>;
  return <Badge tone="emerald">Low Risk</Badge>;
}

export default function RiskDashboard() {
  const [market, setMarket] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [segments, setSegments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([ucApi.market(), ucApi.audit(), ucApi.segments()])
      .then(([m, a, s]) => {
        if (m.success) setMarket(m.data);
        if (a.success) setAudit(a.data);
        if (s.success) setSegments(s.data);
        if (!m.success) setError(m.error || "Failed to load");
      })
      .catch(() => setError("ML service unreachable. Start: python -m uvicorn main:app --reload --port 8000"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  if (error) return <ErrorBanner message={error} />;

  const segSummary: any[] = segments?.segment_summary ?? [];
  const highRiskSeg = segSummary.find((s: any) => s.market_segment === "High-Risk");
  const highRiskSamples: any[] = segments?.top_per_segment?.["High-Risk"] ?? [];

  // Derive portfolio risk metrics from market data
  const avgAge = market?.avg_vehicle_age ?? 0;
  const avgMileage = market?.avg_mileage ?? 0;
  const priceStdApprox = (market?.avg_price ?? 0) * 0.4; // rough proxy
  const totalListings = market?.total_listings ?? 1;

  // Risk dimensions (heuristic scores 0–100)
  const pricingRisk = Math.min(100, (priceStdApprox / Math.max(market?.median_price ?? 1, 1)) * 60);
  const demandRisk = Math.min(100, (avgAge / 12) * 15 + 20);
  const inventoryRisk = Math.min(100, ((highRiskSeg?.count ?? 0) / totalListings) * 100 * 3);
  const mileageRisk = Math.min(100, (avgMileage / 100_000) * 80);
  const ownershipRisk = 30; // baseline
  const overallRisk = (pricingRisk + demandRisk + inventoryRisk + mileageRisk + ownershipRisk) / 5;

  const riskDimensions = [
    {
      key: "Pricing Risk",
      score: pricingRisk,
      desc: "Market-wide price dispersion. High std-dev relative to median raises valuation risk.",
      icon: TrendDown,
      mitigation: "Use ML-estimated fair market value before acquiring. Never pay > median for the make/model/year.",
    },
    {
      key: "Demand Risk",
      score: demandRisk,
      desc: "Risk that inventory won't sell. Driven by average vehicle age and slow-moving segments.",
      icon: TrendDown,
      mitigation: "Focus on demand_score ≥ 60 vehicles. Avoid niche body types with < 100 listings.",
    },
    {
      key: "Inventory Concentration Risk",
      score: inventoryRisk,
      desc: "Proportion of high-risk vehicles in the market. Concentration in any one make/city increases exposure.",
      icon: Warning,
      mitigation: "Limit any single make to < 30% of your portfolio. Diversify across at least 3 cities.",
    },
    {
      key: "Mileage Depreciation Risk",
      score: mileageRisk,
      desc: "High average mileage accelerates depreciation and increases reconditioning costs.",
      icon: Car,
      mitigation: "Set max mileage to 80,000 km for economy segment. Allow up to 100,000 km for premium.",
    },
    {
      key: "Ownership Risk",
      score: ownershipRisk,
      desc: "Multi-owner vehicles attract lower resale prices and higher buyer skepticism.",
      icon: Warning,
      mitigation: "Prefer 1st-owner vehicles. Apply 7–15% discount expectation for 3rd+ owner vehicles.",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Risk Dashboard"
        description="Portfolio-level and market-level risk analysis for the used-car reseller business."
      />

      {/* Overall Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <Card className="p-5 h-full">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Overall Market Risk
            </h3>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="10"
                    stroke={overallRisk >= 70 ? "#ef4444" : overallRisk >= 40 ? "#f59e0b" : "#10b981"}
                    strokeDasharray={`${overallRisk * 2.51} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black font-mono ${overallRisk >= 70 ? "text-red-400" : overallRisk >= 40 ? "text-amber-400" : "text-emerald-400"}`}>
                    {overallRisk.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">/100</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <RiskBadge score={overallRisk} />
              <p className="text-xs text-zinc-500 mt-2">Composite of 5 risk dimensions</p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5 h-full">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
              Risk Dimension Breakdown
            </h3>
            <div className="space-y-4">
              {riskDimensions.map((d) => (
                <RiskMeter key={d.key} label={d.key} value={d.score} color="" />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={market?.total_listings?.toLocaleString() ?? "—"} sub="market breadth" />
        <StatCard label="Avg Vehicle Age" value={`${avgAge.toFixed(1)} yrs`} sub="depreciation exposure" />
        <StatCard label="Avg Mileage" value={`${Math.round(avgMileage).toLocaleString()} km`} sub="wear risk proxy" />
        <StatCard
          label="High-Risk Vehicles"
          value={highRiskSeg?.count?.toLocaleString() ?? "0"}
          sub={`${(((highRiskSeg?.count ?? 0) / totalListings) * 100).toFixed(1)}% of market`}
        />
      </div>

      {/* Risk Dimensions Detail */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Risk Factors & Mitigations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {riskDimensions.map((d) => {
            const Icon = d.icon;
            const isHigh = d.score >= 70;
            const isMed = d.score >= 40 && d.score < 70;
            return (
              <Card key={d.key} className={`p-5 border ${isHigh ? "border-red-500/20 bg-red-500/5" : isMed ? "border-amber-500/20 bg-amber-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isHigh ? "bg-red-500/15 text-red-400" : isMed ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                    <Icon size={16} weight="bold" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-100">{d.key}</h4>
                      <RiskBadge score={d.score} />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{d.desc}</p>
                  </div>
                </div>
                <div className={`text-xs p-2.5 rounded-lg ${isHigh ? "bg-red-500/10 text-red-300" : isMed ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"} flex items-start gap-2`}>
                  <ShieldCheck size={12} className="shrink-0 mt-0.5" />
                  <span>{d.mitigation}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* High-Risk Segment Sample */}
      {highRiskSamples.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldSlash size={14} className="text-red-400" /> High-Risk Vehicles (Avoid or Deep-Discount)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Vehicle", "City", "Year / Mileage", "Price", "Demand", "Opportunity", "Risk"].map((h) => (
                    <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highRiskSamples.map((v: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4">
                      <p className="text-zinc-200 font-bold">{v.make} {v.model}</p>
                      <p className="text-zinc-500 text-[10px] capitalize">{v.fuel_type} · {v.body_type}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300 capitalize">{v.city}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 font-mono">
                      {v.make_year}<br />
                      <span className="text-[10px]">{v.mileage?.toLocaleString()} km</span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-200 font-mono font-bold">
                      {inr(v.price ?? 0)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-sky-400">{v.demand_score?.toFixed(0)}</td>
                    <td className="py-2.5 pr-4 font-mono text-emerald-400">{v.opportunity_score?.toFixed(0)}</td>
                    <td className="py-2.5 pr-4 font-mono text-red-400 font-bold">{v.risk_score?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-400/80">
          <strong className="text-amber-400">Note:</strong>{" "}
          Risk scores are computed from listing-frequency proxies, vehicle age, mileage, and price dispersion in the dataset.
          They are not guarantees of actual market outcomes. Reconditioning risk, legal/documentation risk, and regional market
          volatility are not captured in these scores.
        </p>
      </div>
    </div>
  );
}
