import { Router } from "express";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { generateIndianToyDataset, convertDatasetToCSV } from "../engine/sampleData.js";
import { validateDataset, cleanDataset } from "../engine/dataValidation.js";

export const dataUploadRouter = Router();
dataUploadRouter.use(authMiddleware);

async function getOwnedBusiness(businessId: number, userId: number) {
  const [business] = await db.select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId));
  return business && business.userId === userId ? business : null;
}

// GET the saved historical dataset for a business.
dataUploadRouter.get("/dataset", async (req: AuthRequest, res) => {
  const businessId = Number(req.query.businessId);
  const business = await getOwnedBusiness(businessId, req.userId!);
  if (!business) return res.status(404).json({ success: false, data: null, error: "Business not found" });

  return res.json({
    success: true,
    data: { rows: business.historicalData ?? [], fileName: business.historicalFileName },
    error: null,
  });
});

// PUT replaces the saved historical dataset for a business.
dataUploadRouter.put("/dataset", async (req: AuthRequest, res) => {
  const { businessId, rows, fileName } = req.body;
  const business = await getOwnedBusiness(Number(businessId), req.userId!);
  if (!business) return res.status(404).json({ success: false, data: null, error: "Business not found" });
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, data: null, error: "A non-empty dataset is required" });
  }

  const [updated] = await db.update(schema.businesses)
    .set({ historicalData: rows, historicalFileName: typeof fileName === "string" ? fileName : null })
    .where(eq(schema.businesses.id, business.id))
    .returning({ id: schema.businesses.id });

  return res.json({ success: true, data: updated, error: null });
});

// DELETE clears the saved historical dataset for a business.
dataUploadRouter.delete("/dataset", async (req: AuthRequest, res) => {
  const businessId = Number(req.query.businessId);
  const business = await getOwnedBusiness(businessId, req.userId!);
  if (!business) return res.status(404).json({ success: false, data: null, error: "Business not found" });

  await db.update(schema.businesses)
    .set({ historicalData: null, historicalFileName: null })
    .where(eq(schema.businesses.id, business.id));

  return res.json({ success: true, data: { deleted: true }, error: null });
});

// ── GET Download Sample CSV Template ──────────────────────────
dataUploadRouter.get("/sample-csv", (_req, res) => {
  const data = generateIndianToyDataset();
  const csvText = convertDatasetToCSV(data);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="toy_sales_sample.csv"');
  res.send(csvText);
});

// ── GET Sample Dataset JSON (Preset loader) ───────────────────
dataUploadRouter.get("/sample-data", (_req, res) => {
  const dataset = generateIndianToyDataset();
  const summary = validateDataset(dataset);
  res.json({
    success: true,
    data: {
      rows: dataset,
      validation: summary,
    },
    error: null,
  });
});

// ── POST Validate Uploaded CSV/JSON Data ──────────────────────
dataUploadRouter.post("/validate", (req, res) => {
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Invalid request payload. Expected an array of row objects under 'rows'.",
    });
  }

  if (rows.some((row: unknown) => !row || typeof row !== "object" || Array.isArray(row))) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Each uploaded row must be an object with CSV column names as keys.",
    });
  }

  const validationSummary = validateDataset(rows);
  res.json({
    success: true,
    data: validationSummary,
    error: null,
  });
});

// ── POST Clean Dataset ────────────────────────────────────────
dataUploadRouter.post("/clean", (req, res) => {
  const { rows, removeDuplicates, fillMissing } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Invalid request payload.",
    });
  }

  const cleanedRows = cleanDataset(rows, {
    removeDuplicates: Boolean(removeDuplicates),
    fillMissing: Boolean(fillMissing),
  });

  const newValidationSummary = validateDataset(cleanedRows);

  res.json({
    success: true,
    data: {
      cleanedRows,
      validation: newValidationSummary,
    },
    error: null,
  });
});
