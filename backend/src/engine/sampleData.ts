export interface SalesRow {
  date: string;
  product_id: string;
  product_name: string;
  category: string;
  city: string;
  price: number;
  units_sold: number;
  revenue: number;
  marketing_spend: number;
  inventory: number;
  competitor_price?: number;
  discount?: number;
}

export function generateIndianToyDataset(): SalesRow[] {
  const dataset: SalesRow[] = [];
  const products = [
    { id: "TOY-001", name: "STEM Educational Robot Toy", category: "Educational Toys", basePrice: 999, baseDemand: 1200 },
    { id: "TOY-002", name: "Creative Building Blocks Set", category: "Construction Toys", basePrice: 699, baseDemand: 1800 },
    { id: "TOY-003", name: "Speedster RC Stunt Car", category: "Electronic Toys", basePrice: 1299, baseDemand: 900 },
  ];

  const cities = [
    { name: "Mumbai", factor: 1.2 },
    { name: "Delhi", factor: 1.0 },
    { name: "Bengaluru", factor: 0.9 },
  ];

  // 24 months: Jan 2024 to Dec 2025
  const startDate = new Date(2024, 0, 1);

  for (let m = 0; m < 24; m++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 15);
    const dateStr = currentDate.toISOString().slice(0, 7); // YYYY-MM
    const monthIndex = currentDate.getMonth();

    // Festive multiplier (Diwali / Christmas in Oct, Nov, Dec)
    let festivalMultiplier = 1.0;
    if (monthIndex === 9 || monthIndex === 10) festivalMultiplier = 1.45; // Diwali season
    if (monthIndex === 11) festivalMultiplier = 1.25; // Christmas / New Year
    if (monthIndex === 4 || monthIndex === 5) festivalMultiplier = 1.15; // Summer vacation

    for (const prod of products) {
      for (const city of cities) {
        // Price fluctuations
        const priceVariation = (Math.sin(m + prod.basePrice) * 30) - 10;
        const price = Math.round(prod.basePrice + priceVariation);

        // Competitor price
        const competitor_price = Math.round(price * (0.95 + (Math.cos(m) * 0.08)));

        // Marketing spend
        const marketing_spend = Math.round(35000 + (Math.sin(m) * 15000) + (festivalMultiplier * 10000));

        // Price elasticity effect: lower price = higher sales
        const priceRatio = price / prod.basePrice;
        const priceEffect = Math.pow(1 / priceRatio, 1.8);

        // Marketing effect
        const mktEffect = Math.log10(marketing_spend) / 4.5;

        // Units sold calculation
        let units = Math.round(
          prod.baseDemand * city.factor * festivalMultiplier * priceEffect * mktEffect * (0.92 + Math.random() * 0.16)
        );
        units = Math.max(100, units);

        const revenue = Math.round(units * price);
        const inventory = Math.round(units * 1.35 + 200);
        const discount = price < prod.basePrice ? Math.round(((prod.basePrice - price) / prod.basePrice) * 100) : 0;

        dataset.push({
          date: `${dateStr}-01`,
          product_id: prod.id,
          product_name: prod.name,
          category: prod.category,
          city: city.name,
          price,
          units_sold: units,
          revenue,
          marketing_spend,
          inventory,
          competitor_price,
          discount,
        });
      }
    }
  }

  return dataset;
}

export function convertDatasetToCSV(rows: SalesRow[]): string {
  const headers = [
    "date",
    "product_id",
    "product_name",
    "category",
    "city",
    "price",
    "units_sold",
    "revenue",
    "marketing_spend",
    "inventory",
    "competitor_price",
    "discount"
  ];

  const csvLines = [headers.join(",")];
  for (const r of rows) {
    csvLines.push([
      r.date,
      r.product_id,
      `"${r.product_name}"`,
      `"${r.category}"`,
      r.city,
      r.price,
      r.units_sold,
      r.revenue,
      r.marketing_spend,
      r.inventory,
      r.competitor_price || "",
      r.discount || 0
    ].join(","));
  }
  return csvLines.join("\n");
}
