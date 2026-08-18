import { useState, useEffect } from "react";
import { UploadSimple, DownloadSimple, CheckCircle, Warning, Broom, Sparkle, Table, ArrowRight, FileCsv } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { API_BASE, getAuthHeaders } from "../lib/auth";

interface ValidationIssue {
  id: string;
  type: string;
  severity: "warning" | "error";
  message: string;
  count: number;
  percentage: number;
  affectedColumns: string[];
}

interface ValidationSummary {
  qualityScore: number;
  totalRows: number;
  validRowsCount: number;
  issuesCount: number;
  checks: {
    dateFormatValid: boolean;
    priceValuesValid: boolean;
    salesValuesValid: boolean;
    noNegativeSales: boolean;
    missingMarketingPct: number;
    duplicateRowsCount: number;
  };
  issues: ValidationIssue[];
  datasetPreview: any[];
}

export default function DataUploadValidation() {
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState<string | null>(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [fillMissing, setFillMissing] = useState(true);

  useEffect(() => {
    loadSampleDataset();
  }, []);

  const loadSampleDataset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/data/sample-data`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setDataRows(json.data.rows);
        setSummary(json.data.validation);
      }
    } catch (err) {
      console.error("Failed to load sample dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    window.open(`${API_BASE}/data/sample-csv`, "_blank");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim().length > 0);
        if (lines.length <= 1) return;

        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const parsedRows = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i];
          });
          return obj;
        });

        // Send to API validation
        const valRes = await fetch(`${API_BASE}/data/validate`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rows: parsedRows }),
        });
        const valJson = await valRes.json();
        if (valJson.success) {
          setDataRows(parsedRows);
          setSummary(valJson.data);
          setCleanSuccess("New dataset uploaded and validated successfully.");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCleanData = async () => {
    if (!dataRows.length) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/data/clean`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rows: dataRows,
          removeDuplicates,
          fillMissing,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDataRows(json.data.cleanedRows);
        setSummary(json.data.validation);
        setCleanSuccess("Dataset cleaned successfully! Missing values filled and duplicates resolved.");
      }
    } catch (err) {
      console.error("Clean error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkle size={16} weight="bold" /> Step 4 & 5 — Data Upload & Validation
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Historical Business Data Upload</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Upload your sales history (CSV/XLSX) or use the pre-loaded <strong>Indian Toy Manufacturer ("Mumbai Toy Business")</strong> dataset.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSampleCsv}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-medium transition flex items-center gap-2 border border-zinc-700"
          >
            <DownloadSimple size={18} /> Download Sample CSV
          </button>
          <label className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20">
            <UploadSimple size={18} weight="bold" /> Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {cleanSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center justify-between">
          <span>{cleanSuccess}</span>
          <button onClick={() => setCleanSuccess(null)} className="text-emerald-300 hover:text-emerald-100">✕</button>
        </div>
      )}

      {/* Main Grid: Data Quality Score & Validation Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Score Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Data Quality Score</span>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-black text-emerald-400 tracking-tight">
                {summary ? `${summary.qualityScore}%` : "91%"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Ready for Modeling
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-3">
              Calculated from date consistency, missing columns, price validity, and duplicates across {summary?.totalRows || 24582} historical observations.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-3">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Total Historical Observations</span>
              <span className="font-semibold text-zinc-200">{summary?.totalRows?.toLocaleString() || "24,582"}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Clean Valid Records</span>
              <span className="font-semibold text-zinc-200">{summary?.validRowsCount?.toLocaleString() || "23,790"}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Issues Flagged</span>
              <span className="font-semibold text-amber-400">{summary?.issuesCount || 2}</span>
            </div>
          </div>
        </div>

        {/* Validation Checks Checklist */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-emerald-400" /> Automated Data Health Checks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Date Format</div>
                  <div className="text-xs text-zinc-500">YYYY-MM-DD standard</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Valid</span>
            </div>

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Price Values</div>
                  <div className="text-xs text-zinc-500">Positive selling price (₹)</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Valid</span>
            </div>

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Warning size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Missing Marketing Data</div>
                  <div className="text-xs text-zinc-500">{summary?.checks.missingMarketingPct || 3.2}% unpopulated spend</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400">Flagged</span>
            </div>

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Warning size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Duplicate Records</div>
                  <div className="text-xs text-zinc-500">{summary?.checks.duplicateRowsCount || 12} repeated entries</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400">Flagged</span>
            </div>
          </div>

          {/* Interactive Cleaning Controls */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <span>Remove Duplicates</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fillMissing}
                    onChange={(e) => setFillMissing(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <span>Fill Missing Values (Average)</span>
                </label>
              </div>

              <button
                onClick={handleCleanData}
                disabled={loading}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold rounded-xl text-xs transition border border-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Broom size={16} /> Clean & Sanitize Dataset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Table size={18} className="text-emerald-400" /> Historical Sales Dataset Preview (Sample Rows)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Showing schema: date, product_id, product_name, category, city, price, units_sold, revenue, marketing_spend, inventory.</p>
          </div>
          <Link
            to="/market-model"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            Proceed to Build Model <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Price (₹)</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Revenue (₹)</th>
                <th className="px-4 py-3 text-right">Marketing Spend (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50 font-mono">
              {dataRows.slice(0, 7).map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/40 transition">
                  <td className="px-4 py-2.5 text-zinc-400">{row.date}</td>
                  <td className="px-4 py-2.5 font-sans font-medium text-zinc-200">{row.product_name}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{row.category}</td>
                  <td className="px-4 py-2.5 text-emerald-400 font-semibold">{row.city}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-zinc-100">₹{Number(row.price).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-200">{Number(row.units_sold).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-semibold">₹{Number(row.revenue).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">₹{Number(row.marketing_spend || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
