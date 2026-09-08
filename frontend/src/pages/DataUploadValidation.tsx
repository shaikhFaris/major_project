import { useEffect, useState } from "react";
import { UploadSimple, DownloadSimple, CheckCircle, Warning, Broom, Sparkle, Table, ArrowRight, FileCsv } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { API_BASE, getAuthHeaders } from "../lib/auth";
import { useActiveBusiness } from "../lib/businessContext";

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
  datasetPreview: Record<string, unknown>[];
  columns: string[];
}

function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { value += '"'; index += 1; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim()); value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = []; value = "";
    } else value += char;
  }
  if (inQuotes) throw new Error("The CSV has an unclosed quoted value.");
  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV must include a header row and at least one data row.");
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  if (headers.some((header) => !header)) throw new Error("Every CSV column needs a header.");
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function formatCell(value: unknown): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default function DataUploadValidation() {
  const { activeBusiness } = useActiveBusiness();
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [fillMissing, setFillMissing] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    fetch(`${API_BASE}/data/dataset?businessId=${activeBusiness.id}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then(async (json) => {
        if (!json.success || !json.data.rows?.length) return;
        setDataRows(json.data.rows);
        setFileName(json.data.fileName || "saved_historical_data.csv");
        const validation = await fetch(`${API_BASE}/data/validate`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rows: json.data.rows }),
        });
        const validationJson = await validation.json();
        if (validationJson.success) setSummary(validationJson.data);
      })
      .catch(() => setUploadError("The saved historical data could not be loaded."));
  }, [activeBusiness]);

  const saveDataset = async (rows: Record<string, unknown>[], name: string) => {
    if (!activeBusiness) return false;
    const response = await fetch(`${API_BASE}/data/dataset`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ businessId: activeBusiness.id, rows, fileName: name }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "The dataset could not be saved.");
    return true;
  };

  const previewColumns = summary?.columns ?? [...new Set(dataRows.flatMap((row) => Object.keys(row)))];

  const handleDownloadSampleCsv = () => {
    window.open(`${API_BASE}/data/sample-csv`, "_blank");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setDataRows([]);
    setSummary(null);
    setFileName(file.name);
    setCleanSuccess(null);
    setUploadError(null);
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedRows = parseCsv(text);
        setDataRows(parsedRows);

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
          await saveDataset(parsedRows, file.name);
          setFileName(file.name);
          setCleanSuccess("New dataset uploaded and validated successfully.");
        } else {
          setUploadError(valJson.error || "The dataset could not be validated.");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        setUploadError(err instanceof Error ? err.message : "The CSV could not be read.");
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
        await saveDataset(json.data.cleanedRows, fileName || "cleaned_historical_data.csv");
        setCleanSuccess("Dataset cleaned successfully! Missing values filled and duplicates resolved.");
      } else {
        setUploadError(json.error || "The dataset could not be cleaned.");
      }
    } catch (err) {
      console.error("Clean error:", err);
      setUploadError("The dataset could not be cleaned. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!activeBusiness || !window.confirm("Delete this historical dataset? This cannot be undone.")) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/data/dataset?businessId=${activeBusiness.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || "The dataset could not be deleted.");
      setDataRows([]);
      setSummary(null);
      setFileName(null);
      setCleanSuccess("Historical dataset deleted.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "The dataset could not be deleted.");
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
            Upload a CSV to validate and preview the data you just selected. Download the sample CSV if you need the expected sales-data structure.
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

      {uploadError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-200 hover:text-red-50">✕</button>
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
                {summary ? `${summary.qualityScore}%` : "—"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {summary ? (summary.qualityScore === 100 ? "Ready for Modeling" : "Review issues") : "Awaiting upload"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-3">
              {summary ? `Calculated from ${summary.totalRows.toLocaleString()} rows in ${fileName || "the uploaded CSV"}.` : "Upload a CSV to calculate data quality from its rows."}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-3">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Total Historical Observations</span>
              <span className="font-semibold text-zinc-200">{summary?.totalRows.toLocaleString() || "—"}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Clean Valid Records</span>
              <span className="font-semibold text-zinc-200">{summary?.validRowsCount.toLocaleString() || "—"}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Issues Flagged</span>
              <span className="font-semibold text-amber-400">{summary?.issuesCount ?? "—"}</span>
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
              <span className={`text-xs font-semibold ${summary?.checks.dateFormatValid ? "text-emerald-400" : "text-amber-400"}`}>
                {summary ? (summary.checks.dateFormatValid ? "Valid" : "Needs review") : "Awaiting upload"}
              </span>
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
              <span className={`text-xs font-semibold ${summary?.checks.priceValuesValid ? "text-emerald-400" : "text-amber-400"}`}>
                {summary ? (summary.checks.priceValuesValid ? "Valid" : "Needs review") : "Awaiting upload"}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Warning size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Missing Marketing Data</div>
                  <div className="text-xs text-zinc-500">{summary ? `${summary.checks.missingMarketingPct}% unpopulated spend` : "Awaiting upload"}</div>
                </div>
              </div>
              <span className={`text-xs font-semibold ${(summary?.checks.missingMarketingPct ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {summary ? (summary.checks.missingMarketingPct > 0 ? "Flagged" : "Valid") : "Awaiting upload"}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Warning size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Duplicate Records</div>
                  <div className="text-xs text-zinc-500">{summary ? `${summary.checks.duplicateRowsCount} repeated entries` : "Awaiting upload"}</div>
                </div>
              </div>
              <span className={`text-xs font-semibold ${(summary?.checks.duplicateRowsCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {summary ? (summary.checks.duplicateRowsCount > 0 ? "Flagged" : "Valid") : "Awaiting upload"}
              </span>
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
                disabled={loading || dataRows.length === 0}
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
              <Table size={18} className="text-emerald-400" /> {fileName ? `${fileName} Preview` : "Uploaded Dataset Preview"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{dataRows.length ? `Showing the first ${Math.min(dataRows.length, 7)} rows from the uploaded CSV.` : "Choose a CSV to see its columns and rows here."}</p>
          </div>
          <div className="flex items-center gap-2">
            {dataRows.length > 0 && <button onClick={handleDeleteDataset} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold rounded-xl text-xs border border-red-500/20">Delete saved data</button>}
            <Link to="/market-model" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
              Proceed to Build Model <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          {dataRows.length > 0 && previewColumns.length > 0 ? (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>{previewColumns.map((column) => <th key={column} className="px-4 py-3 whitespace-nowrap">{column.replace(/_/g, " ")}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50 font-mono">
                {dataRows.slice(0, 7).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-zinc-800/40 transition">
                    {previewColumns.map((column) => <td key={column} className="px-4 py-2.5 whitespace-nowrap">{formatCell(row[column])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-4 py-8 text-center text-sm text-zinc-500">No dataset has been uploaded yet.</div>}
        </div>
      </div>
    </div>
  );
}
