import { Router, Response } from "express";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const marketConfigsRouter = Router();
marketConfigsRouter.use(authMiddleware);

// Helper: verify business ownership
async function verifyBusinessOwnership(businessId: number, userId: number): Promise<boolean> {
  const [business] = await db.select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId));
  return !!business && business.userId === userId;
}

// POST /api/market-configs
marketConfigsRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ success: false, data: null, error: "businessId is required" });
    }

    const owns = await verifyBusinessOwnership(businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    const {
      marketSize, population, numCompetitors, demandLevel,
      economicCondition, inflation, season, customerIncome,
      taxRate, supplyAvailability, governmentPolicies,
    } = req.body;

    const [config] = await db.insert(schema.marketConfigs).values({
      businessId,
      marketSize: marketSize ?? 1000,
      population: population ?? 10000,
      numCompetitors: numCompetitors ?? 3,
      demandLevel: demandLevel ?? "medium",
      economicCondition: economicCondition ?? "stable",
      inflation: String(inflation ?? 2.0),
      season: season ?? "normal",
      customerIncome: customerIncome ?? "medium",
      taxRate: String(taxRate ?? 10.0),
      supplyAvailability: supplyAvailability ?? "sufficient",
      governmentPolicies: governmentPolicies ?? null,
    }).returning();

    return res.status(201).json({ success: true, data: config, error: null });
  } catch (err) {
    console.error("Create market config error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to create market config" });
  }
});

// GET /api/market-configs?businessId=:id
marketConfigsRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const businessId = Number(req.query.businessId);
    if (!businessId) {
      return res.status(400).json({ success: false, data: null, error: "businessId query parameter is required" });
    }

    const owns = await verifyBusinessOwnership(businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    const configs = await db.select()
      .from(schema.marketConfigs)
      .where(eq(schema.marketConfigs.businessId, businessId));

    return res.json({ success: true, data: configs[0] || null, error: null });
  } catch (err) {
    console.error("Get market config error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to get market config" });
  }
});

// PUT /api/market-configs/:id
marketConfigsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [existing] = await db.select()
      .from(schema.marketConfigs)
      .where(eq(schema.marketConfigs.id, Number(req.params.id)));

    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: "Market config not found" });
    }

    const owns = await verifyBusinessOwnership(existing.businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Market config not found" });
    }

    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "marketSize", "population", "numCompetitors", "demandLevel",
      "economicCondition", "inflation", "season", "customerIncome",
      "taxRate", "supplyAvailability", "governmentPolicies",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const [updated] = await db.update(schema.marketConfigs)
      .set(updates)
      .where(eq(schema.marketConfigs.id, Number(req.params.id)))
      .returning();

    return res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("Update market config error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to update market config" });
  }
});
