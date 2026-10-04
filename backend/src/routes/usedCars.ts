import { Router, Response } from "express";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const usedCarsRouter = Router();
usedCarsRouter.use(authMiddleware);

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function callML<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ML_SERVICE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((json as any)?.detail || `ML service error ${res.status}`);
  }
  return json as T;
}

// ── Market analysis endpoints (proxy to ML service) ────────────────────

// GET /api/used-cars/audit
usedCarsRouter.get("/audit", async (_req, res: Response) => {
  try {
    const data = await callML("/used-cars/audit");
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/used-cars/market
usedCarsRouter.get("/market", async (_req, res: Response) => {
  try {
    const data = await callML("/used-cars/market");
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/demand
usedCarsRouter.post("/demand", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/demand", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/used-cars/geographic
usedCarsRouter.get("/geographic", async (req, res: Response) => {
  try {
    const { transport_cost = "5000", reconditioning_cost = "20000", platform_fee_pct = "2" } = req.query;
    const params = new URLSearchParams({ transport_cost: String(transport_cost), reconditioning_cost: String(reconditioning_cost), platform_fee_pct: String(platform_fee_pct) });
    const data = await callML(`/used-cars/geographic?${params}`);
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/used-cars/segments
usedCarsRouter.get("/segments", async (_req, res: Response) => {
  try {
    const data = await callML("/used-cars/segments");
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/opportunity
usedCarsRouter.post("/opportunity", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/opportunity", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/acquire
usedCarsRouter.post("/acquire", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/acquire", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/allocate
usedCarsRouter.post("/allocate", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/allocate", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/price-strategy
usedCarsRouter.post("/price-strategy", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/price-strategy", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/backtest
usedCarsRouter.post("/backtest", async (req: AuthRequest, res: Response) => {
  try {
    const data = await callML("/used-cars/backtest", { method: "POST", body: JSON.stringify(req.body) });
    // Optionally save strategy if name provided
    if (req.body.strategy_name && req.userId) {
      await db.insert(schema.carStrategies).values({
        userId: req.userId,
        name: req.body.strategy_name,
        parameters: req.body,
        backtestResults: data as Record<string, unknown>,
      });
    }
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/whatif
usedCarsRouter.post("/whatif", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/whatif", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/used-cars/explain
usedCarsRouter.get("/explain", async (_req, res: Response) => {
  try {
    const data = await callML("/used-cars/explain");
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/used-cars/predict-price
usedCarsRouter.post("/predict-price", async (req, res: Response) => {
  try {
    const data = await callML("/used-cars/predict-price", { method: "POST", body: JSON.stringify(req.body) });
    return res.json({ success: true, data, error: null });
  } catch (err: any) {
    return res.status(502).json({ success: false, data: null, error: err.message });
  }
});

// ── Inventory CRUD ─────────────────────────────────────────────────────

// GET /api/used-cars/inventory
usedCarsRouter.get("/inventory", async (req: AuthRequest, res: Response) => {
  try {
    const items = await db
      .select()
      .from(schema.carInventory)
      .where(eq(schema.carInventory.userId, req.userId!))
      .orderBy(desc(schema.carInventory.createdAt));
    return res.json({ success: true, data: items, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to fetch inventory" });
  }
});

// POST /api/used-cars/inventory
usedCarsRouter.post("/inventory", async (req: AuthRequest, res: Response) => {
  try {
    const {
      make, model, variant, makeYear, mileage, fuelType, bodyType,
      transmission, color, noOfOwners, city, acquisitionPrice,
      targetSellingPrice, estimatedMarketValue, reconditioningCost,
      demandScore, opportunityScore, riskScore, notes,
    } = req.body;

    if (!make || !model || !makeYear || !mileage || !acquisitionPrice) {
      return res.status(400).json({ success: false, data: null, error: "make, model, makeYear, mileage, acquisitionPrice are required" });
    }

    const [item] = await db.insert(schema.carInventory).values({
      userId: req.userId!,
      make, model, variant, makeYear, mileage, fuelType, bodyType,
      transmission, color, noOfOwners: noOfOwners || 1, city,
      acquisitionPrice: String(acquisitionPrice),
      targetSellingPrice: targetSellingPrice ? String(targetSellingPrice) : null,
      estimatedMarketValue: estimatedMarketValue ? String(estimatedMarketValue) : null,
      reconditioningCost: reconditioningCost ? String(reconditioningCost) : "20000",
      demandScore: demandScore ? String(demandScore) : null,
      opportunityScore: opportunityScore ? String(opportunityScore) : null,
      riskScore: riskScore ? String(riskScore) : null,
      notes,
    }).returning();

    return res.status(201).json({ success: true, data: item, error: null });
  } catch (err: any) {
    console.error("Add inventory error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to add vehicle to inventory" });
  }
});

// PATCH /api/used-cars/inventory/:id
usedCarsRouter.patch("/inventory/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(schema.carInventory).where(eq(schema.carInventory.id, id));
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ success: false, data: null, error: "Vehicle not found" });
    }

    const updates: Partial<typeof schema.carInventory.$inferInsert> = {};
    const allowed = ["status", "targetSellingPrice", "estimatedMarketValue", "soldPrice", "soldAt", "listedAt", "notes", "reconditioningCost"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (updates as any)[key] = req.body[key];
      }
    }

    const [updated] = await db.update(schema.carInventory).set(updates).where(eq(schema.carInventory.id, id)).returning();
    return res.json({ success: true, data: updated, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to update vehicle" });
  }
});

// DELETE /api/used-cars/inventory/:id
usedCarsRouter.delete("/inventory/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(schema.carInventory).where(eq(schema.carInventory.id, id));
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ success: false, data: null, error: "Vehicle not found" });
    }
    await db.delete(schema.carInventory).where(eq(schema.carInventory.id, id));
    return res.json({ success: true, data: { deleted: true }, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to delete vehicle" });
  }
});

// ── Strategy CRUD ──────────────────────────────────────────────────────

// GET /api/used-cars/strategies
usedCarsRouter.get("/strategies", async (req: AuthRequest, res: Response) => {
  try {
    const items = await db.select().from(schema.carStrategies).where(eq(schema.carStrategies.userId, req.userId!)).orderBy(desc(schema.carStrategies.createdAt));
    return res.json({ success: true, data: items, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to fetch strategies" });
  }
});

// POST /api/used-cars/strategies
usedCarsRouter.post("/strategies", async (req: AuthRequest, res: Response) => {
  try {
    const { name, parameters, backtestResults } = req.body;
    if (!name || !parameters) {
      return res.status(400).json({ success: false, data: null, error: "name and parameters are required" });
    }
    const [item] = await db.insert(schema.carStrategies).values({
      userId: req.userId!,
      name,
      parameters,
      backtestResults: backtestResults || null,
    }).returning();
    return res.status(201).json({ success: true, data: item, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to save strategy" });
  }
});

// DELETE /api/used-cars/strategies/:id
usedCarsRouter.delete("/strategies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(schema.carStrategies).where(eq(schema.carStrategies.id, id));
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ success: false, data: null, error: "Strategy not found" });
    }
    await db.delete(schema.carStrategies).where(eq(schema.carStrategies.id, id));
    return res.json({ success: true, data: { deleted: true }, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, data: null, error: "Failed to delete strategy" });
  }
});
