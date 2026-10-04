import { useEffect, useState } from "react";
import { ChartBar, FunnelSimple } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Select, Badge } from "../components/ui";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const chartOpts: any = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ₹${(ctx.raw / 100000).toFixed(1)}L` } } },
  scales: {
    x: { ticks: { color: "#71717a", font: { size: 10 } }, grid: { color: "#27272a" } },
    y: { ticks: { color: "#71717a", font: { size: 10 }, callback: (v: any) => `₹${(v / 100000).toFixed(0)}L` }, grid: { color: "#27272a" } },
  },
};

export default function MarketAnalysis() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"brand" | "body" | "fuel" | "age">("brand");

  useEffect(() => {
    ucApi.market()
      .then(r => { if (r.success) setData(r.data); else setError(r.error); })
      .catch(() => setError("ML service unreachable"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (error) return <ErrorBanner message={error} />;

  const brandData = {
    labels: data?.brand_distribution?.slice(0, 15).map((b: any) => b.brand) ?? [],
    datasets: [{ data: data?.brand_distribution?.slice(0, 15).map((b: any) => b.listings) ?? [], backgroundColor: "#10b981", borderRadius: 4 }],
  };

  const fuelAvgPrice = {
    labels: data?.fuel_type_stats?.map((f: any) => f.fuel_type) ?? [],
    datasets: [{ data: data?.fuel_type_stats?.map((f: any) => f.median) ?? [], backgroundColor: ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4"], borderRadius: 4 }],
  };

  const bodyAvgPrice = {
    labels: data?.body_type_stats?.map((b: any) => b.body_type) ?? [],
    datasets: [{ data: data?.body_type_stats?.map((b: any) => b.median) ?? [], backgroundColor: "#8b5cf6", borderRadius: 4 }],
  };

  const ageAvgPrice = {
    labels: data?.price_vs_age?.slice(0, 15).map((a: any) => `${a.vehicle_age}yr`) ?? [],
    datasets: [{ data: data?.price_vs_age?.slice(0, 15).map((a: any) => a.median) ?? [], backgroundColor: "#3b82f6", borderRadius: 4 }],
  };

  const tabs: { key: "brand" | "body" | "fuel" | "age"; label: string; chartData: any; yLabel: string }[] = [
    { key: "brand", label: "Listings by Brand",      chartData: { ...brandData,    datasets: [{ ...brandData.datasets[0], label: "Listings" }] }, yLabel: "count" },
    { key: "body",  label: "Median Price by Body",   chartData: bodyAvgPrice,  yLabel: "price" },
    { key: "fuel",  label: "Median Price by Fuel",   chartData: fuelAvgPrice,  yLabel: "price" },
    { key: "age",   label: "Median Price by Age",    chartData: ageAvgPrice,   yLabel: "price" },
  ];

  const activeTab = tabs.find(t => t.key === tab)!;
  const priceOpts = { ...chartOpts };
  const countOpts = { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, ticks: { ...chartOpts.scales.y.ticks, callback: (v: any) => v } } } };

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Market Analysis"
        description="Exploratory data analysis across brands, body types, fuel types, and vehicle age. Based on 8,095 Indian used-car listings."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Listings",   value: data?.total_listings?.toLocaleString() },
          { label: "Brands",           value: data?.brands_available },
          { label: "Models",           value: data?.models_available },
          { label: "Cities Covered",   value: data?.cities_covered },
        ].map(k => (
          <Card key={k.label} className="p-4 text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-medium">{k.label}</p>
            <p className="text-2xl font-black font-mono text-zinc-100 mt-1">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart tabs */}
      <Card className="p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === t.key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200 bg-zinc-800/60"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <Bar data={activeTab.chartData} options={activeTab.yLabel === "count" ? countOpts : priceOpts} />
      </Card>

      {/* Top Models table */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Top 20 Models by Listing Count</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Rank", "Model", "Listings"].map(h => <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(data?.model_distribution ?? []).map((m: any, i: number) => (
                <tr key={m.model} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 pr-4 text-zinc-500 font-mono">{i + 1}</td>
                  <td className="py-2 pr-4 text-zinc-200 font-medium">{m.model}</td>
                  <td className="py-2 pr-4 text-zinc-300 font-mono">{m.listings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Segment distribution */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Price Segment Distribution</h3>
        <div className="flex flex-wrap gap-4">
          {(data?.segment_distribution ?? []).map((s: any) => (
            <div key={s.segment} className="flex-1 min-w-32 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
              <Badge tone={s.segment === "Economy" ? "emerald" : s.segment === "Mid" ? "sky" : "amber"}>{s.segment}</Badge>
              <p className="text-2xl font-black font-mono text-zinc-100 mt-2">{s.count?.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">listings</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
