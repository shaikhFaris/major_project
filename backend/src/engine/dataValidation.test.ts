import { describe, expect, it } from "vitest";
import { validateDataset } from "./dataValidation.js";

describe("validateDataset", () => {
  it("returns the columns and preview from the supplied dataset", () => {
    const rows = [
      { date: "2026-01-01", product_name: "Northwind Desk", price: "120", units_sold: "4", region: "Pune" },
      { date: "2026-01-02", product_name: "Northwind Chair", price: "80", units_sold: "2", region: "Kochi" },
    ];

    const result = validateDataset(rows);

    expect(result.totalRows).toBe(2);
    expect(result.columns).toEqual(["date", "product_name", "price", "units_sold", "region"]);
    expect(result.datasetPreview).toEqual(rows);
    expect(result.datasetPreview[0]).not.toHaveProperty("city");
  });
});
