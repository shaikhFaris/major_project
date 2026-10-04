import { useEffect, useState } from "react";
import {
  Car,
  UploadSimple,
  FileCsv,
  Play,
  CheckCircle,
  WarningCircle,
  Trash,
  ChartLineUp,
} from "@phosphor-icons/react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  ErrorBanner,
  Skeleton,
  cn,
} from "../components/ui";
import { API_BASE, getAuthHeaders } from "../lib/auth";
import { parseCsv } from "../lib/csv";

interface CarDatasetSummary {
  id: number;
  name: string;
  fileName: string | null;
  rowCount: number;
  createdAt: string;
}

interface Prediction {
  price: number;
  units_sold: number;
  revenue: number;
  profit: number;
}

interface ModelArtifact {
  version: string;
  algorithm: string;
  metrics: { mae: number; rmse: number; r2: number; mape: number };
}

interface ModelStatus {
  available: boolean;
  artifacts: Record<string, ModelArtifact>;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCell(value: unknown): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default function CarPrediction() {
  const [datasets, setDatasets] = useState<CarDatasetSummary[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statusRes, datasetsRes] = await Promise.all([
        fetch(`${API_BASE}/cars/status`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/cars/datasets`, { headers: getAuthHeaders() }),
      ]);
      const statusJson = await statusRes.json();
      const datasetsJson = await datasetsRes.json();
      if (statusJson.success) setModelStatus(statusJson.data);
      if (datasetsJson.success) setDatasets(datasetsJson.data);
    } catch (err) {
      console.error("Failed to load car prediction data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setNotice(null);
    setPredictions(null);
    setActiveDatasetId(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) throw new Error("The CSV contained no data rows.");
      setRows(parsed);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that CSV file.");
      setRows([]);
      setFileName(null);
    }
  };

  const handleLoadDataset = async (id: number) => {
    setError(null);
    setNotice(null);
    setPredictions(null);
    try {
      const res = await fetch(`${API_BASE}/cars/datasets/${id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load dataset");
      setRows(json.data.rows);
      setActiveDatasetId(id);
      setFileName(json.data.fileName || json.data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset");
    }
  };

  const handleSaveDataset = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/cars/datasets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: fileName || "Car dataset", fileName, rows }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save dataset");
      setActiveDatasetId(json.data.id);
      setNotice(`Saved "${json.data.name}" (${json.data.rowCount} rows).`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dataset");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDataset = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/cars/datasets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete dataset");
      if (activeDatasetId === id) {
        setRows([]);
        setActiveDatasetId(null);
        setFileName(null);
        setPredictions(null);
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset");
    }
  };

  const handlePredict = async (persist: boolean) => {
    if (rows.length === 0) return;
    setPredicting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${API_BASE}/cars/predict`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rows, datasetId: activeDatasetId, persist }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Prediction failed");
      setPredictions(json.data.predictions);
      setModelVersion(json.data.modelVersion);
      if (persist) setNotice(`Saved ${json.data.predictions.length} predictions to history.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totals = predictions?.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenue,
      profit: acc.profit + p.profit,
      units: acc.units + p.units_sold,
    }),
    { revenue: 0, profit: 0, units: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Car Prediction"
        description="Upload your car dataset and predict price, demand, revenue, and profit using a model pre-trained on a large vehicle-sales dataset."
        actions={
          <Badge tone={modelStatus?.available ? "emerald" : "amber"}>
            {modelStatus?.available ? "Model ready" : "No model trained"}
          </Badge>
        }
      />

      {error && <ErrorBanner message={error} />}
      {notice && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          <CheckCircle size={17} weight="bold" /> {notice}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Model summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Model Version"
              value={modelStatus?.artifacts?.units_sold?.version || "—"}
              sub={modelStatus?.artifacts?.units_sold?.algorithm || "not loaded"}
            />
            <StatCard
              label="Demand R²"
              value={modelStatus?.artifacts?.units_sold?.metrics?.r2?.toFixed(3) ?? "—"}
              sub="hold-out test split"
            />
            <StatCard
              label="Demand MAE"
              value={modelStatus?.artifacts?.units_sold?.metrics?.mae?.toFixed(1) ?? "—"}
              sub="mean absolute error (units)"
            />
            <StatCard
              label="Demand MAPE"
              value={
                modelStatus?.artifacts?.units_sold?.metrics?.mape != null
                  ? `${modelStatus.artifacts.units_sold.metrics.mape.toFixed(1)}%`
                  : "—"
              }
              sub="mean absolute % error"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload panel */}
            <Card className="p-5 lg:col-span-1">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.14em] mb-4">
                Dataset
              </h2>

              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-950/50 px-4 py-8 cursor-pointer transition-colors">
                <UploadSimple size={24} className="text-emerald-400" weight="bold" />
                <span className="text-sm font-medium text-zinc-200">Choose a CSV file</span>
                <span className="text-xs text-zinc-500 text-center">
                  Columns are auto-mapped to the model's schema
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>

              <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                Expected columns:{" "}
                <code className="font-mono text-zinc-400">
                  make, year, price, marketing_spend, discount_pct,
                  competitor_price, region
                </code>
                . Missing values are imputed; <code className="font-mono text-zinc-400">price</code>{" "}
                is optional and gets predicted.
              </p>

              {fileName && (
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                  <FileCsv size={16} className="text-emerald-400 shrink-0" />
                  <span className="truncate flex-1">{fileName}</span>
                  <span className="font-mono text-zinc-500">{rows.length} rows</span>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={handlePredict.bind(null, false)} disabled={rows.length === 0 || predicting}>
                  <Play size={16} weight="fill" />
                  {predicting ? "Predicting…" : "Run prediction"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePredict.bind(null, true)}
                  disabled={rows.length === 0 || predicting}
                >
                  Predict &amp; save history
                </Button>
                <Button variant="secondary" onClick={handleSaveDataset} disabled={rows.length === 0 || saving}>
                  {saving ? "Saving…" : "Save dataset"}
                </Button>
              </div>

              {datasets.length > 0 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.14em] mb-3">
                    Saved datasets
                  </h3>
                  <ul className="space-y-1.5">
                    {datasets.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadDataset(d.id)}
                          className={cn(
                            "flex-1 text-left text-xs rounded-lg px-2.5 py-2 transition-colors",
                            activeDatasetId === d.id
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "text-zinc-300 hover:bg-zinc-800/60 border border-transparent",
                          )}
                        >
                          <span className="block truncate font-medium">{d.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500">{d.rowCount} rows</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDataset(d.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Results panel */}
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.14em] mb-4">
                Predictions
              </h2>

              {!predictions && rows.length === 0 && (
                <EmptyState
                  icon={<Car size={24} weight="bold" />}
                  title="No dataset loaded"
                  description="Upload a CSV of car rows, or pick a saved dataset, then run a prediction to see price, demand, revenue, and profit."
                />
              )}

              {!predictions && rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-950 text-zinc-400">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {rows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="text-zinc-300">
                          {columns.map((col) => (
                            <td key={col} className="px-3 py-2 whitespace-nowrap">
                              {formatCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 8 && (
                    <p className="text-[11px] text-zinc-500 px-3 py-2 border-t border-zinc-800">
                      Showing first 8 of {rows.length} rows
                    </p>
                  )}
                </div>
              )}

              {predictions && (
                <div className="space-y-4">
                  {totals && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard label="Total Revenue" value={currency.format(totals.revenue)} />
                      <StatCard label="Total Profit" value={currency.format(totals.profit)} />
                      <StatCard label="Units Sold" value={totals.units.toFixed(0)} />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <ChartLineUp size={15} className="text-emerald-400" />
                    Model <span className="font-mono text-zinc-300">{modelVersion}</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800 max-h-[28rem]">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-950 text-zinc-400 sticky top-0">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">#</th>
                          {columns.map((col) => (
                            <th key={col} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                          <th className="text-right font-medium px-3 py-2">Price</th>
                          <th className="text-right font-medium px-3 py-2">Units</th>
                          <th className="text-right font-medium px-3 py-2">Revenue</th>
                          <th className="text-right font-medium px-3 py-2">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {predictions.map((p, i) => (
                          <tr key={i} className="text-zinc-300 hover:bg-zinc-800/40">
                            <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
                            {columns.map((col) => (
                              <td key={col} className="px-3 py-2 whitespace-nowrap">
                                {formatCell(rows[i]?.[col])}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right font-mono tabular-nums">
                              {currency.format(p.price)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums">
                              {p.units_sold.toFixed(0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums">
                              {currency.format(p.revenue)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2 text-right font-mono tabular-nums",
                                p.profit >= 0 ? "text-emerald-400" : "text-red-400",
                              )}
                            >
                              {currency.format(p.profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {modelStatus && !modelStatus.available && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
                  <WarningCircle size={16} weight="bold" className="mt-0.5 shrink-0" />
                  <span>
                    No trained model is loaded. Start the ML service and run{" "}
                    <code className="font-mono">python train.py</code> in <code className="font-mono">ml-service/</code>.
                  </span>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
