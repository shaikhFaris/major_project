import { describe, it, expect } from "vitest";
import { generateIndianToyDataset, parseCSVToDataset, convertDatasetToCSV } from "./sampleData.js";

describe("Sample Dataset & CSV Parser", () => {
  it("should generate 216 historical sales records from raw CSV data", () => {
    const dataset = generateIndianToyDataset();
    expect(dataset.length).toBe(216);
  });

  it("should contain records for all 3 products across Mumbai, Delhi, and Bengaluru", () => {
    const dataset = generateIndianToyDataset();
    const productIds = new Set(dataset.map((r) => r.product_id));
    const cities = new Set(dataset.map((r) => r.city));

    expect(productIds.has("TOY-001")).toBe(true);
    expect(productIds.has("TOY-002")).toBe(true);
    expect(productIds.has("TOY-003")).toBe(true);

    expect(cities.has("Mumbai")).toBe(true);
    expect(cities.has("Delhi")).toBe(true);
    expect(cities.has("Bengaluru")).toBe(true);
  });

  it("should accurately parse numerical values and revenue", () => {
    const dataset = generateIndianToyDataset();
    const firstRow = dataset[0];

    expect(firstRow.date).toBe("2024-01-01");
    expect(firstRow.product_id).toBe("TOY-001");
    expect(firstRow.product_name).toBe("STEM Educational Robot Toy");
    expect(firstRow.city).toBe("Mumbai");
    expect(firstRow.price).toBe(988);
    expect(firstRow.units_sold).toBe(1566);
    expect(firstRow.revenue).toBe(1547208);
    expect(firstRow.marketing_spend).toBe(45000);
    expect(firstRow.inventory).toBe(2314);
    expect(firstRow.competitor_price).toBe(1018);
    expect(firstRow.discount).toBe(1);
  });

  it("should convert dataset back to valid CSV format", () => {
    const dataset = generateIndianToyDataset();
    const csvStr = convertDatasetToCSV(dataset);
    expect(csvStr).toContain("date,product_id,product_name");
    expect(csvStr.split("\n").length).toBe(217); // 1 header + 216 data lines
  });
});
