import { Router } from "express";
import { generateIndianToyDataset, convertDatasetToCSV } from "../engine/sampleData.js";
import { validateDataset, cleanDataset } from "../engine/dataValidation.js";

export const dataUploadRouter = Router();

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
