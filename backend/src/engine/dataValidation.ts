export interface ValidationIssue {
  id: string;
  type: "missing" | "duplicate" | "invalid_format" | "negative" | "invalid_price";
  severity: "warning" | "error";
  message: string;
  count: number;
  percentage: number;
  affectedColumns: string[];
}

export interface ValidationSummary {
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

export function validateDataset(rows: any[]): ValidationSummary {
  if (!rows || rows.length === 0) {
    return {
      qualityScore: 0,
      totalRows: 0,
      validRowsCount: 0,
      issuesCount: 1,
      checks: {
        dateFormatValid: false,
        priceValuesValid: false,
        salesValuesValid: false,
        noNegativeSales: false,
        missingMarketingPct: 0,
        duplicateRowsCount: 0,
      },
      issues: [{
        id: "empty_dataset",
        type: "missing",
        severity: "error",
        message: "Uploaded dataset contains no records",
        count: 0,
        percentage: 100,
        affectedColumns: [],
      }],
      datasetPreview: [],
      columns: [],
    };
  }

  const totalRows = rows.length;
  const columns = [...new Set(rows.flatMap((row) =>
    row && typeof row === "object" ? Object.keys(row) : []
  ))];
  const issues: ValidationIssue[] = [];

  let missingMarketingCount = 0;
  let invalidDateCount = 0;
  let invalidPriceCount = 0;
  let negativeSalesCount = 0;
  let duplicateCount = 0;

  const seenRows = new Set<string>();

  rows.forEach((row) => {
    // Check duplicates
    const key = `${row.date || ''}_${row.product_id || ''}_${row.city || ''}`;
    if (key && seenRows.has(key)) {
      duplicateCount++;
    } else {
      seenRows.add(key);
    }

    // Check marketing missing
    if (row.marketing_spend === undefined || row.marketing_spend === null || row.marketing_spend === "" || isNaN(Number(row.marketing_spend))) {
      missingMarketingCount++;
    }

    // Check date
    if (!row.date || isNaN(Date.parse(row.date))) {
      invalidDateCount++;
    }

    // Check price
    const price = Number(row.price);
    if (isNaN(price) || price <= 0) {
      invalidPriceCount++;
    }

    // Check sales / units
    const units = Number(row.units_sold);
    if (isNaN(units) || units < 0) {
      negativeSalesCount++;
    }
  });

  if (missingMarketingCount > 0) {
    const pct = Math.round((missingMarketingCount / totalRows) * 1000) / 10;
    issues.push({
      id: "missing_marketing",
      type: "missing",
      severity: "warning",
      message: `${pct}% missing marketing expenditure data`,
      count: missingMarketingCount,
      percentage: pct,
      affectedColumns: ["marketing_spend"],
    });
  }

  if (duplicateCount > 0) {
    const pct = Math.round((duplicateCount / totalRows) * 1000) / 10;
    issues.push({
      id: "duplicate_records",
      type: "duplicate",
      severity: "warning",
      message: `${duplicateCount} duplicate records identified`,
      count: duplicateCount,
      percentage: pct,
      affectedColumns: ["date", "product_id", "city"],
    });
  }

  if (invalidDateCount > 0) {
    issues.push({
      id: "invalid_date",
      type: "invalid_format",
      severity: "error",
      message: `${invalidDateCount} rows have invalid or missing date format`,
      count: invalidDateCount,
      percentage: Math.round((invalidDateCount / totalRows) * 100),
      affectedColumns: ["date"],
    });
  }

  if (invalidPriceCount > 0) {
    issues.push({
      id: "invalid_price",
      type: "invalid_price",
      severity: "error",
      message: `${invalidPriceCount} rows have non-positive or invalid prices`,
      count: invalidPriceCount,
      percentage: Math.round((invalidPriceCount / totalRows) * 100),
      affectedColumns: ["price"],
    });
  }

  if (negativeSalesCount > 0) {
    issues.push({
      id: "negative_sales",
      type: "negative",
      severity: "error",
      message: `${negativeSalesCount} rows have negative units sold values`,
      count: negativeSalesCount,
      percentage: Math.round((negativeSalesCount / totalRows) * 100),
      affectedColumns: ["units_sold"],
    });
  }

  // Quality score formula: start at 100%, deduct points based on severe/warning issues
  let qualityDeduction = 0;
  qualityDeduction += (duplicateCount / totalRows) * 15;
  qualityDeduction += (missingMarketingCount / totalRows) * 20;
  qualityDeduction += (invalidDateCount / totalRows) * 40;
  qualityDeduction += (invalidPriceCount / totalRows) * 40;
  qualityDeduction += (negativeSalesCount / totalRows) * 40;

  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - qualityDeduction)));

  return {
    qualityScore,
    totalRows,
    validRowsCount: totalRows - (invalidDateCount + invalidPriceCount + negativeSalesCount),
    issuesCount: issues.length,
    checks: {
      dateFormatValid: invalidDateCount === 0,
      priceValuesValid: invalidPriceCount === 0,
      salesValuesValid: negativeSalesCount === 0,
      noNegativeSales: negativeSalesCount === 0,
      missingMarketingPct: Math.round((missingMarketingCount / totalRows) * 1000) / 10,
      duplicateRowsCount: duplicateCount,
    },
    issues,
    datasetPreview: rows.slice(0, 10),
    columns,
  };
}

export function cleanDataset(rows: any[], options: { removeDuplicates?: boolean; fillMissing?: boolean; defaultMarketing?: number }): any[] {
  let cleaned = [...rows];

  if (options.removeDuplicates) {
    const seen = new Set<string>();
    cleaned = cleaned.filter((row) => {
      const key = `${row.date || ''}_${row.product_id || ''}_${row.city || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (options.fillMissing) {
    const validSpends = cleaned
      .map(r => Number(r.marketing_spend))
      .filter(v => !isNaN(v) && v >= 0);
    const avgSpend = validSpends.length > 0
      ? validSpends.reduce((a, b) => a + b, 0) / validSpends.length
      : (options.defaultMarketing || 40000);

    cleaned = cleaned.map((row) => {
      const spend = Number(row.marketing_spend);
      const isSpendMissing = isNaN(spend) || spend < 0;
      return {
        ...row,
        marketing_spend: isSpendMissing ? Math.round(avgSpend) : spend,
        price: Math.max(1, Number(row.price) || 999),
        units_sold: Math.max(0, Number(row.units_sold) || 0),
        revenue: Math.max(0, Number(row.revenue) || (Number(row.units_sold) * Number(row.price))),
      };
    });
  }

  return cleaned;
}
