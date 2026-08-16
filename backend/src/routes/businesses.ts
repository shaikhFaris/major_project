import { Router, Response } from "express";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const businessesRouter = Router();
businessesRouter.use(authMiddleware);

// POST /api/businesses
businessesRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName, industry, productName, businessType,
      initialCapital, manufacturingCost, sellingPrice, operatingCost,
      initialInventory, productionCapacity, warehouseCapacity,
      marketingBudget, advertisingChannel, promotionFrequency,
    } = req.body;

    if (!companyName || !industry) {
      return res.status(400).json({ success: false, data: null, error: "Company name and industry are required" });
    }

    const [business] = await db.insert(schema.businesses).values({
      userId: req.userId!,
      companyName, industry, productName, businessType,
      initialCapital: String(initialCapital ?? 0),
      manufacturingCost: String(manufacturingCost ?? 0),
      sellingPrice: String(sellingPrice ?? 0),
      operatingCost: String(operatingCost ?? 0),
      initialInventory: initialInventory ?? 0,
      productionCapacity: productionCapacity ?? 0,
      warehouseCapacity: warehouseCapacity ?? 0,
      marketingBudget: String(marketingBudget ?? 0),
      advertisingChannel: advertisingChannel ?? "none",
      promotionFrequency: promotionFrequency ?? "none",
    }).returning();

    return res.status(201).json({ success: true, data: business, error: null });
  } catch (err) {
    console.error("Create business error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to create business" });
  }
});

// GET /api/businesses
businessesRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select()
      .from(schema.businesses)
      .where(eq(schema.businesses.userId, req.userId!))
      .orderBy(desc(schema.businesses.createdAt));
    return res.json({ success: true, data: list, error: null });
  } catch (err) {
    console.error("List businesses error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to list businesses" });
  }
});

// GET /api/businesses/:id
businessesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [business] = await db.select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, Number(req.params.id)));
    if (!business || business.userId !== req.userId!) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }
    return res.json({ success: true, data: business, error: null });
  } catch (err) {
    console.error("Get business error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to get business" });
  }
});

// PUT /api/businesses/:id
businessesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [existing] = await db.select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, Number(req.params.id)));
    if (!existing || existing.userId !== req.userId!) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "companyName", "industry", "productName", "businessType",
      "initialCapital", "manufacturingCost", "sellingPrice", "operatingCost",
      "initialInventory", "productionCapacity", "warehouseCapacity",
      "marketingBudget", "advertisingChannel", "promotionFrequency",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const [updated] = await db.update(schema.businesses)
      .set(updates)
      .where(eq(schema.businesses.id, Number(req.params.id)))
      .returning();

    return res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("Update business error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to update business" });
  }
});

// DELETE /api/businesses/:id
businessesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const [existing] = await db.select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, Number(req.params.id)));
    if (!existing || existing.userId !== req.userId!) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    await db.delete(schema.businesses).where(eq(schema.businesses.id, Number(req.params.id)));
    return res.json({ success: true, data: { deleted: true }, error: null });
  } catch (err) {
    console.error("Delete business error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to delete business" });
  }
});
