import { Router } from "express";
import { trainMLDemandModel, MLModelVersion } from "../engine/mlModel.js";
import type { SalesRow } from "../engine/sampleData.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

export const mlRouter = Router();

const modelCache = new Map<number, MLModelVersion>();
mlRouter.use(authMiddleware);

// ── GET Active Model Info ─────────────────────────────────────
mlRouter.get("/active", (req: AuthRequest, res) => {
  const businessId = Number(req.query.businessId);
  const model = modelCache.get(businessId);
  if (!model) return res.status(404).json({ success: false, data: null, error: "No model has been trained for this business." });
  res.json({
    success: true,
    data: model,
    error: null,
  });
});

// ── POST Train Model on Dataset ───────────────────────────────
mlRouter.post("/train", async (req: AuthRequest, res) => {
  const businessId = Number(req.body.businessId);
  const { dataset } = req.body;
  if (!businessId || !Array.isArray(dataset) || dataset.length === 0) {
    return res.status(400).json({ success: false, data: null, error: "Upload historical data for this business before training a model." });
  }

  const [business] = await db.select({ userId: schema.businesses.userId })
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId));
  if (!business || business.userId !== req.userId!) {
    return res.status(404).json({ success: false, data: null, error: "Business not found" });
  }

  const normalizedDataset: SalesRow[] = dataset.map((row: Record<string, unknown>) => ({
    date: String(row.date || ""),
    product_id: String(row.product_id || ""),
    product_name: String(row.product_name || ""),
    category: String(row.category || ""),
    city: String(row.city || ""),
    price: Number(row.price),
    units_sold: Number(row.units_sold),
    revenue: Number(row.revenue),
    marketing_spend: Number(row.marketing_spend),
    inventory: Number(row.inventory),
    competitor_price: row.competitor_price === undefined || row.competitor_price === ""
      ? undefined
      : Number(row.competitor_price),
    discount: row.discount === undefined || row.discount === ""
      ? undefined
      : Number(row.discount),
  }));

  const trainedModel = trainMLDemandModel(normalizedDataset);
  modelCache.set(businessId, trainedModel);

  res.json({
    success: true,
    data: trainedModel,
    error: null,
  });
});
