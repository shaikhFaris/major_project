/**
 * Phase 1 Simulation Engine
 *
 * Deterministic, formula-based. No ML, no agents, no random events.
 * Computes period-by-period outcomes from a business config + market config.
 */

export interface BusinessInput {
  sellingPrice: number;
  manufacturingCost: number;
  operatingCost: number;
  initialInventory: number;
  productionCapacity: number;
  warehouseCapacity: number;
  marketingBudget: number;
}

export interface MarketInput {
  marketSize: number;
  population: number;
  numCompetitors: number;
  demandLevel: string;
  economicCondition: string;
  inflation: number;
  season: string;
  customerIncome: string;
  taxRate: number;
  supplyAvailability: string;
}

export interface PeriodResult {
  period: number;
  demand: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marketShare: number;
  inventoryLevel: number;
  consumerSatisfaction: number;
}

export function runSimulation(business: BusinessInput, market: MarketInput, numPeriods: number = 12): PeriodResult[] {
  const results: PeriodResult[] = [];
  let inventory = business.initialInventory;

  for (let period = 1; period <= numPeriods; period++) {
    // ── Demand calculation ─────────────────────────────
    const baseDemand = Math.floor(market.marketSize / Math.max(market.numCompetitors, 1));

    // Demand level multiplier
    const demandMultipliers: Record<string, number> = { low: 0.6, medium: 1.0, high: 1.4 };
    const demandLevelMult = demandMultipliers[market.demandLevel] ?? 1.0;

    // Season multiplier — varies per period
    const seasonPatterns: Record<string, number[]> = {
      normal: Array(12).fill(1.0),
      holiday: [1.1, 1.0, 0.9, 1.0, 1.0, 1.0, 0.9, 1.0, 1.0, 1.2, 1.3, 1.5],
      summer: [1.2, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.1, 1.1],
      winter: [1.3, 1.3, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
    };
    const seasonMult = (seasonPatterns[market.season] ?? seasonPatterns.normal)[(period - 1) % 12];

    // Economic condition
    const economyMultipliers: Record<string, number> = {
      recession: 0.7, stable: 1.0, growing: 1.2, booming: 1.4,
    };
    const economyMult = economyMultipliers[market.economicCondition] ?? 1.0;

    // Price elasticity: higher price = lower demand
    const referencePrice = business.manufacturingCost * 2; // 2x cost as "fair" price
    const priceRatio = business.sellingPrice / Math.max(referencePrice, 1);
    const priceElasticity = Math.max(0.3, 1.5 - (priceRatio - 1) * 0.5);

    // Marketing boost: returns diminishing per dollar
    const marketingEffect = Math.log10(business.marketingBudget + 1) * 0.05 + 1;

    // Competition effect: more competitors = lower share
    const competitionFactor = 1 / Math.pow(market.numCompetitors, 0.3);

    // Customer income effect
    const incomeMultipliers: Record<string, number> = { low: 0.7, medium: 1.0, high: 1.3 };
    const incomeMult = incomeMultipliers[market.customerIncome] ?? 1.0;

    // Supply availability
    const supplyMultipliers: Record<string, number> = { limited: 0.7, moderate: 0.9, sufficient: 1.0, abundant: 1.1 };
    const supplyMult = supplyMultipliers[market.supplyAvailability] ?? 1.0;

    const demand = Math.floor(
      baseDemand * demandLevelMult * seasonMult * economyMult *
      priceElasticity * marketingEffect * competitionFactor * incomeMult * supplyMult
    );

    // ── Production ─────────────────────────────────────
    const produced = Math.min(business.productionCapacity, business.warehouseCapacity - inventory);
    inventory += produced;

    // ── Sales (limited by inventory) ────────────────────
    const unitsSold = Math.min(demand, inventory);
    inventory -= unitsSold;

    // ── Financials ─────────────────────────────────────
    const revenue = unitsSold * business.sellingPrice;
    const productionCost = produced * business.manufacturingCost;
    const totalCost = productionCost + business.operatingCost + business.marketingBudget;
    const profitBeforeTax = revenue - totalCost;
    const taxAmount = Math.max(0, profitBeforeTax * (market.taxRate / 100));
    const profit = profitBeforeTax - taxAmount;

    // ── Market share ───────────────────────────────────
    const totalCompetitorSales = baseDemand * 0.7 * competitionFactor; // rough estimate
    const totalMarketSales = unitsSold + totalCompetitorSales;
    const marketShare = totalMarketSales > 0 ? (unitsSold / totalMarketSales) * 100 : 0;

    // ── Consumer satisfaction ──────────────────────────
    // Based on price fairness and availability
    const priceSatisfaction = Math.max(0, 100 - Math.abs(priceRatio - 1) * 40);
    const availabilitySatisfaction = unitsSold >= demand * 0.8 ? 80 : (unitsSold / Math.max(demand, 1)) * 100;
    const satisfaction = Math.round((priceSatisfaction * 0.4 + availabilitySatisfaction * 0.6) * 100) / 100;

    results.push({
      period,
      demand,
      unitsSold,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      marketShare: Math.round(marketShare * 100) / 100,
      inventoryLevel: inventory,
      consumerSatisfaction: Math.round(satisfaction * 100) / 100,
    });
  }

  return results;
}
