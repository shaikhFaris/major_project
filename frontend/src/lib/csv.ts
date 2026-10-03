/**
 * Minimal CSV parser handling quoted values, escaped quotes, BOM, and CRLF.
 * Returns one object per data row keyed by header name.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }

  if (inQuotes) throw new Error("The CSV has an unclosed quoted value.");
  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV must include a header row and at least one data row.");

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  if (headers.some((header) => !header)) throw new Error("Every CSV column needs a header.");

  return rows
    .slice(1)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}
