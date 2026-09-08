import { Router, Response } from "express";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { runSimulation, runAdvancedStrategySimulation, BusinessInput, MarketInput, StrategyInput } from "../engine/simulation.js";

export const simulationsRouter = Router();
simulationsRouter.use(authMiddleware);

// Helper: verify business ownership
async function verifyOwnership(businessId: number, userId: number): Promise<boolean> {
  const [business] = await db.select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId));
  return !!business && business.userId === userId;
}

// GET /api/simulations — list all simulations for the current user
simulationsRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select({
      id: schema.simulations.id,
      businessId: schema.simulations.businessId,
      marketConfigId: schema.simulations.marketConfigId,
      strategyLabel: schema.simulations.strategyLabel,
      status: schema.simulations.status,
      createdAt: schema.simulations.createdAt,
      businessName: schema.businesses.companyName,
    })
      .from(schema.simulations)
      .leftJoin(schema.businesses, eq(schema.simulations.businessId, schema.businesses.id))
      .orderBy(desc(schema.simulations.createdAt));

    // Filter to only the current user's businesses
    const userBizIds = await db.select({ id: schema.businesses.id })
      .from(schema.businesses)
      .where(eq(schema.businesses.userId, req.userId!));
    const ids = new Set(userBizIds.map(b => b.id));
    const filtered = list.filter(s => ids.has(s.businessId));

    return res.json({ success: true, data: filtered, error: null });
  } catch (err) {
    console.error("List simulations error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to list simulations" });
  }
});

// POST /api/simulations — Create new simulation entry
simulationsRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, marketConfigId, strategyLabel } = req.body;

    if (!businessId || !marketConfigId) {
      return res.status(400).json({ success: false, data: null, error: "businessId and marketConfigId are required" });
    }

    const owns = await verifyOwnership(businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    const [sim] = await db.insert(schema.simulations).values({
      businessId,
      marketConfigId,
      strategyLabel: strategyLabel ?? "Baseline",
      status: "pending",
    }).returning();

    return res.status(201).json({ success: true, data: sim, error: null });
  } catch (err) {
    console.error("Create simulation error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to create simulation" });
  }
});

// POST /api/simulations/run-advanced — Run ML-driven strategy simulation with uncertainty & constraints
simulationsRouter.post("/run-advanced", async (req: AuthRequest, res: Response) => {
  try {
    const strategy: StrategyInput & { businessId?: number } = req.body;

    if (!strategy || !strategy.businessId || !strategy.sellingPrice || !strategy.marketingBudget) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Invalid strategy parameters. Expected sellingPrice and marketingBudget.",
      });
    }

    const [business] = await db.select().from(schema.businesses).where(eq(schema.businesses.id, strategy.businessId));
    if (!business || business.userId !== req.userId!) {
      return res.status(404).json({ success: false, data: null, error: "Business not found" });
    }

    const result = runAdvancedStrategySimulation({
      ...strategy,
      productName: business.productName,
      manufacturingCost: strategy.manufacturingCost ?? Number(business.manufacturingCost),
      productionCapacity: strategy.productionCapacity ?? business.productionCapacity,
      baselinePrice: Number(business.sellingPrice),
      baselineMarketing: Number(business.marketingBudget),
    });

    return res.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("Advanced simulation error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to execute strategy simulation" });
  }
});

// POST /api/simulations/compare-scenarios — Run multi-strategy side-by-side simulation
simulationsRouter.post("/compare-scenarios", async (req: AuthRequest, res: Response) => {
  try {
    const { strategies, targetObjective = "profit" } = req.body;

    if (!Array.isArray(strategies) || strategies.length === 0) {
      return res.status(400).json({ success: false, data: null, error: "At least one business strategy is required" });
    }
    const defaultStrategies: StrategyInput[] = strategies;

    const results = defaultStrategies.map((strat) => {
      return runAdvancedStrategySimulation({ ...strat, targetObjective });
    });

    // Rank strategies based on objective
    const ranked = [...results].sort((a, b) => {
      if (targetObjective === "revenue") return b.summary.totalRevenue - a.summary.totalRevenue;
      if (targetObjective === "sales") return b.summary.totalUnitsSold - a.summary.totalUnitsSold;
      if (targetObjective === "market_share") return b.summary.avgMarketShare - a.summary.avgMarketShare;
      if (targetObjective === "minimize_risk") {
        const riskScoreMap = { Low: 1, Medium: 2, High: 3 };
        return riskScoreMap[a.summary.riskScore] - riskScoreMap[b.summary.riskScore];
      }
      return b.summary.totalProfit - a.summary.totalProfit; // default: profit
    });

    const topPickName = ranked[0].strategyName;

    return res.json({
      success: true,
      data: {
        results,
        topPickName,
        targetObjective,
        recommendation: `Strategy "${topPickName}" is estimated to yield the highest outcome under your objective to ${targetObjective.replace("_", " ")}.`,
      },
      error: null,
    });
  } catch (err) {
    console.error("Compare scenarios error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to compare scenarios" });
  }
});

// POST /api/simulations/:id/run
simulationsRouter.post("/:id/run", async (req: AuthRequest, res: Response) => {
  try {
    const simId = Number(req.params.id);

    const [sim] = await db.select()
      .from(schema.simulations)
      .where(eq(schema.simulations.id, simId));

    if (!sim) {
      return res.status(404).json({ success: false, data: null, error: "Simulation not found" });
    }

    const owns = await verifyOwnership(sim.businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Simulation not found" });
    }

    const [business] = await db.select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, sim.businessId));

    if (!business) {
      return res.status(400).json({ success: false, data: null, error: "Business not found" });
    }

    const [market] = await db.select()
      .from(schema.marketConfigs)
      .where(eq(schema.marketConfigs.id, sim.marketConfigId));

    if (!market) {
      return res.status(400).json({ success: false, data: null, error: "Market config not found" });
    }

    await db.update(schema.simulations)
      .set({ status: "running" })
      .where(eq(schema.simulations.id, simId));

    const businessInput: BusinessInput = {
      sellingPrice: Number(business.sellingPrice),
      manufacturingCost: Number(business.manufacturingCost),
      operatingCost: Number(business.operatingCost),
      initialInventory: business.initialInventory,
      productionCapacity: business.productionCapacity,
      warehouseCapacity: business.warehouseCapacity,
      marketingBudget: Number(business.marketingBudget),
    };

    const marketInput: MarketInput = {
      marketSize: market.marketSize,
      population: market.population,
      numCompetitors: market.numCompetitors,
      demandLevel: market.demandLevel,
      economicCondition: market.economicCondition,
      inflation: Number(market.inflation),
      season: market.season,
      customerIncome: market.customerIncome,
      taxRate: Number(market.taxRate),
      supplyAvailability: market.supplyAvailability,
    };

    const numPeriods = Number(req.query.periods) || 12;
    const results = runSimulation(businessInput, marketInput, numPeriods);

    // Persist results
    const insertResults = results.map(r => ({
      simulationId: simId,
      period: r.period,
      revenue: String(r.revenue),
      profit: String(r.profit),
      marketShare: String(r.marketShare),
      demand: r.demand,
      unitsSold: r.unitsSold,
      inventoryLevel: r.inventoryLevel,
      consumerSatisfaction: String(r.consumerSatisfaction),
      cost: String(r.cost),
    }));

    await db.insert(schema.simulationResults).values(insertResults);

    await db.update(schema.simulations)
      .set({ status: "complete" })
      .where(eq(schema.simulations.id, simId));

    return res.json({ success: true, data: { simulationId: simId, results }, error: null });
  } catch (err) {
    console.error("Run simulation error:", err);
    await db.update(schema.simulations)
      .set({ status: "failed" })
      .where(eq(schema.simulations.id, Number(req.params.id)));
    return res.status(500).json({ success: false, data: null, error: "Failed to run simulation" });
  }
});

// GET /api/simulations/:id/results
simulationsRouter.get("/:id/results", async (req: AuthRequest, res: Response) => {
  try {
    const simId = Number(req.params.id);

    const [sim] = await db.select()
      .from(schema.simulations)
      .where(eq(schema.simulations.id, simId));

    if (!sim) {
      return res.status(404).json({ success: false, data: null, error: "Simulation not found" });
    }

    const owns = await verifyOwnership(sim.businessId, req.userId!);
    if (!owns) {
      return res.status(404).json({ success: false, data: null, error: "Simulation not found" });
    }

    const results = await db.select()
      .from(schema.simulationResults)
      .where(eq(schema.simulationResults.simulationId, simId))
      .orderBy(schema.simulationResults.period);

    return res.json({ success: true, data: results, error: null });
  } catch (err) {
    console.error("Get results error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to get results" });
  }
});
