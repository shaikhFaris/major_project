import { Router } from "express";
import { generateIndianToyDataset } from "../engine/sampleData.js";
import { trainMLDemandModel, MLModelVersion } from "../engine/mlModel.js";

export const mlRouter = Router();

let currentModelCache: MLModelVersion | null = null;

// Initialize with default model trained on sample dataset
currentModelCache = trainMLDemandModel(generateIndianToyDataset());

// ── GET Active Model Info ─────────────────────────────────────
mlRouter.get("/active", (_req, res) => {
  if (!currentModelCache) {
    currentModelCache = trainMLDemandModel(generateIndianToyDataset());
  }
  res.json({
    success: true,
    data: currentModelCache,
    error: null,
  });
});

// ── POST Train Model on Dataset ───────────────────────────────
mlRouter.post("/train", (req, res) => {
  const { dataset } = req.body;
  const rows = (dataset && Array.isArray(dataset) && dataset.length > 0)
    ? dataset
    : generateIndianToyDataset();

  const trainedModel = trainMLDemandModel(rows);
  currentModelCache = trainedModel;

  res.json({
    success: true,
    data: trainedModel,
    error: null,
  });
});
