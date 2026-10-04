import { useEffect, useState } from "react";
import { Cpu, Info, ChartBar, CheckCircle } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Badge, StatCard } from "../components/ui";

export default function MlExplainability() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ucApi.explain()
      .then(r => { if (r.success) setData(r.data); else setError(r.error || "Model not trained"); })
      .catch(() => setError("ML service unreachable. Start: python -m uvicorn main:app --reload --port 8000"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (error) return (
    <div className="space-y-6">
      <PageHeader title="ML Explainability" description="Feature importance and model comparison for the used-car price prediction model." />
      <ErrorBanner message={error} />
      <Card className="p-5 border-amber-500/20 bg-amber-500/5">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">How to train the model</h3>
        <pre className="text-xs text-zinc-300 font-mono bg-zinc-950 p-4 rounded-lg overflow-x-auto">
{`cd major_project/ml-service
pip install -r requirements.txt
python used_car_train.py
python -m uvicorn main:app --reload --port 8000`}
        </pre>
      </Card>
    </div>
  );

  const allModels = data?.all_models ?? {};
  const featureImportances: any[] = data?.feature_importances ?? [];
  const maxImportance = featureImportances[0]?.importance ?? 1;

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="ML Explainability"
        description="Feature importance, model comparison, and performance metrics for the used-car price prediction model."
      />

      {/* Model card */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Cpu size={20} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Best Model: {data?.best_algorithm}</h3>
            <p className="text-xs text-zinc-400">Trained on {data?.n_rows?.toLocaleString()} rows · {data?.n_features} features</p>
          </div>
          <span className="ml-auto px-3 py-1 bg-emerald-500/15 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Ready
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-medium block">R² Score</span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">{data?.best_r2?.toFixed(4)}</span>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-medium block">Trained At</span>
            <span className="text-xs font-mono text-zinc-300 mt-1 block">{data?.trained_at ? new Date(data.trained_at).toLocaleDateString() : "—"}</span>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-medium block">Training Rows</span>
            <span className="text-lg font-black font-mono text-zinc-100 mt-1 block">{data?.n_rows?.toLocaleString()}</span>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-medium block">Feature Count</span>
            <span className="text-lg font-black font-mono text-zinc-100 mt-1 block">{data?.n_features}</span>
          </div>
        </div>
      </Card>

      {/* Model Comparison Table */}
      {Object.keys(allModels).length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ChartBar size={14} className="text-purple-400" /> Algorithm Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Algorithm", "R²", "MAE (₹)", "MAPE (%)", "RMSE (₹)", "Status"].map(h => (
                    <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(allModels).map(([name, metrics]: [string, any]) => {
                  const isBest = name === data?.best_algorithm;
                  return (
                    <tr key={name} className={`border-b border-zinc-800/50 ${isBest ? "bg-emerald-500/5" : "hover:bg-zinc-800/20"}`}>
                      <td className="py-2.5 pr-4">
                        <span className={`font-bold ${isBest ? "text-emerald-400" : "text-zinc-200"}`}>{name}</span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-200">{metrics?.r2?.toFixed(4) ?? "—"}</td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-300">
                        {metrics?.mae ? `₹${Math.round(metrics.mae).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-300">{metrics?.mape?.toFixed(2) ?? "—"}%</td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-400">
                        {metrics?.rmse ? `₹${Math.round(metrics.rmse).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {isBest ? (
                          <Badge tone="emerald"><CheckCircle size={10} weight="fill" className="inline mr-1" />Best Model</Badge>
                        ) : (
                          <Badge tone="zinc">Candidate</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Feature Importance */}
      {featureImportances.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={14} className="text-cyan-400" /> Feature Importance ({data?.best_algorithm})
          </h3>
          <div className="space-y-3">
            {featureImportances.slice(0, 20).map((f: any, i: number) => {
              const pct = (f.importance / maxImportance) * 100;
              return (
                <div key={f.feature}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 font-mono">{i + 1}. {f.feature}</span>
                    <span className="text-zinc-400 font-mono">{(f.importance * 100).toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-4">
            Feature importance reflects how much each feature contributes to predicting used-car listing prices (Gradient Boosting Gini importance).
            Higher importance = stronger influence on the predicted price.
          </p>
        </Card>
      )}

      {/* How to interpret */}
      <Card className="p-5 border-sky-500/20 bg-sky-500/5">
        <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info size={14} /> How to Interpret These Results
        </h3>
        <div className="space-y-2 text-xs text-zinc-400">
          <p><strong className="text-zinc-200">R² Score:</strong> Proportion of price variance explained by the model. 0.88+ is strong for used-car pricing.</p>
          <p><strong className="text-zinc-200">MAE (Mean Absolute Error):</strong> Average absolute rupee error per prediction. Lower is better.</p>
          <p><strong className="text-zinc-200">MAPE (Mean Absolute % Error):</strong> Average percentage error. 13–15% is acceptable for heterogeneous used-car data.</p>
          <p><strong className="text-zinc-200">Feature Importance:</strong> Which vehicle attributes most strongly determine price. Vehicle age and mileage typically dominate.</p>
          <p><strong className="text-zinc-200">Use case:</strong> Price predictions are best used as a range estimate, not an exact figure. Always triangulate with comparable market listings.</p>
        </div>
      </Card>
    </div>
  );
}
