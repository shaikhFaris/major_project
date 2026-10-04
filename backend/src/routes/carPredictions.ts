import { Router, Response } from "express";
import { db, schema } from "../db/index.js";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const carPredictionsRouter = Router();
carPredictionsRouter.use(authMiddleware);

// The Node backend owns orchestration; the ML service owns training/inference.
// See docs/DECISIONS.md — the backend never runs ML code itself.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const CAR_PREDICTION_TARGET_FIELDS = [
  "make",
  "year",
  "price",
  "marketing_spend",
  "discount_pct",
  "competitor_price",
  "region",
] as const;

type CarPredField = (typeof CAR_PREDICTION_TARGET_FIELDS)[number];

interface MlPrediction {
  price: number;
  units_sold: number;
  revenue: number;
  profit: number;
}

async function callMlService<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as
    | { detail?: string }
    | null;
  if (!response.ok) {
    throw new Error(json?.detail || `ML service responded with ${response.status}`);
  }
  return json as T;
}

// ── GET /api/cars/status — is a trained model available? ──────
carPredictionsRouter.get("/status", async (_req: AuthRequest, res: Response) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/model/info`);
    if (!response.ok) throw new Error(`status ${response.status}`);
    const info = await response.json();
    return res.json({ success: true, data: info, error: null });
  } catch {
    return res.json({
      success: true,
      data: { available: false, artifacts: {}, error: "ML service unreachable" },
      error: null,
    });
  }
});

// ── GET /api/cars/datasets — list uploaded car datasets ───────
carPredictionsRouter.get("/datasets", async (req: AuthRequest, res: Response) => {
  try {
    const datasets = await db
      .select({
        id: schema.carDatasets.id,
        name: schema.carDatasets.name,
        fileName: schema.carDatasets.fileName,
        rowCount: schema.carDatasets.rowCount,
        createdAt: schema.carDatasets.createdAt,
      })
      .from(schema.carDatasets)
      .where(eq(schema.carDatasets.userId, req.userId!))
      .orderBy(desc(schema.carDatasets.createdAt));

    return res.json({ success: true, data: datasets, error: null });
  } catch (err) {
    console.error("List car datasets error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to list datasets" });
  }
});

// ── POST /api/cars/datasets — store an uploaded dataset ───────
carPredictionsRouter.post("/datasets", async (req: AuthRequest, res: Response) => {
  try {
    const { name, fileName, rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, data: null, error: "A non-empty dataset is required" });
    }
    if (rows.some((row: unknown) => !row || typeof row !== "object" || Array.isArray(row))) {
      return res.status(400).json({ success: false, data: null, error: "Each row must be an object keyed by column name" });
    }

    const [dataset] = await db
      .insert(schema.carDatasets)
      .values({
        userId: req.userId!,
        name: typeof name === "string" && name.trim() ? name.trim() : "Untitled dataset",
        fileName: typeof fileName === "string" ? fileName : null,
        rowCount: rows.length,
        rows,
      })
      .returning({ id: schema.carDatasets.id, name: schema.carDatasets.name, rowCount: schema.carDatasets.rowCount });

    return res.status(201).json({ success: true, data: dataset, error: null });
  } catch (err) {
    console.error("Create car dataset error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to save dataset" });
  }
});

// ── GET /api/cars/datasets/:id — fetch a dataset's rows ───────
carPredictionsRouter.get("/datasets/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [dataset] = await db
      .select()
      .from(schema.carDatasets)
      .where(and(eq(schema.carDatasets.id, Number(req.params.id)), eq(schema.carDatasets.userId, req.userId!)));

    if (!dataset) return res.status(404).json({ success: false, data: null, error: "Dataset not found" });
    return res.json({ success: true, data: dataset, error: null });
  } catch (err) {
    console.error("Get car dataset error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to fetch dataset" });
  }
});

// ── DELETE /api/cars/datasets/:id ─────────────────────────────
carPredictionsRouter.delete("/datasets/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [deleted] = await db
      .delete(schema.carDatasets)
      .where(and(eq(schema.carDatasets.id, Number(req.params.id)), eq(schema.carDatasets.userId, req.userId!)))
      .returning({ id: schema.carDatasets.id });

    if (!deleted) return res.status(404).json({ success: false, data: null, error: "Dataset not found" });
    return res.json({ success: true, data: { deleted: true }, error: null });
  } catch (err) {
    console.error("Delete car dataset error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to delete dataset" });
  }
});

// ── POST /api/cars/predict — predict on supplied rows ─────────
carPredictionsRouter.post("/predict", async (req: AuthRequest, res: Response) => {
  try {
    const { rows, datasetId, persist } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, data: null, error: "At least one row is required" });
    }

    let mlResponse: { predictions: MlPrediction[]; model_version: string; price_was_predicted: boolean };
    try {
      mlResponse = await callMlService("/predict", { rows });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ML service unavailable";
      return res.status(503).json({ success: false, data: null, error: `Prediction failed: ${message}` });
    }

    const { predictions, model_version: modelVersion, price_was_predicted: priceWasPredicted } = mlResponse;

    // Persisting is opt-in so a user can preview predictions without writing history.
    if (persist && Array.isArray(predictions) && predictions.length === rows.length) {
      await db.insert(schema.carPredictions).values(
        predictions.map((prediction, index) => ({
          userId: req.userId!,
          datasetId: typeof datasetId === "number" ? datasetId : null,
          modelVersion,
          inputs: rows[index],
          price: String(prediction.price),
          unitsSold: String(prediction.units_sold),
          revenue: String(prediction.revenue),
          profit: String(prediction.profit),
          priceWasPredicted,
        })),
      );
    }

    return res.json({
      success: true,
      data: { predictions, modelVersion, priceWasPredicted },
      error: null,
    });
  } catch (err) {
    console.error("Car prediction error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to run prediction" });
  }
});

// ── GET /api/cars/predictions — recent prediction history ─────
carPredictionsRouter.get("/predictions", async (req: AuthRequest, res: Response) => {
  try {
    const history = await db
      .select()
      .from(schema.carPredictions)
      .where(eq(schema.carPredictions.userId, req.userId!))
      .orderBy(desc(schema.carPredictions.createdAt))
      .limit(50);

    return res.json({ success: true, data: history, error: null });
  } catch (err) {
    console.error("List car predictions error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to list predictions" });
  }
});

// ── POST /api/cars/train — fine-tune on a company's dataset ───
carPredictionsRouter.post("/train", async (req: AuthRequest, res: Response) => {
  try {
    const { datasetId } = req.body;

    let dataset: Record<string, unknown>[] | undefined;
    if (typeof datasetId === "number") {
      const [stored] = await db
        .select({ rows: schema.carDatasets.rows })
        .from(schema.carDatasets)
        .where(and(eq(schema.carDatasets.id, datasetId), eq(schema.carDatasets.userId, req.userId!)));
      if (!stored) return res.status(404).json({ success: false, data: null, error: "Dataset not found" });
      dataset = stored.rows;
    } else if (Array.isArray(req.body.dataset)) {
      dataset = req.body.dataset;
    }

    if (!dataset || dataset.length === 0) {
      return res.status(400).json({ success: false, data: null, error: "A non-empty dataset is required" });
    }

    try {
      const info = await callMlService("/train", { dataset });
      return res.json({ success: true, data: info, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ML service unavailable";
      return res.status(503).json({ success: false, data: null, error: `Training failed: ${message}` });
    }
  } catch (err) {
    console.error("Car training error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to start training" });
  }
});
