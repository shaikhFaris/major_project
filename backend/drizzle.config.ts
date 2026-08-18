import { defineConfig } from "drizzle-kit";

declare const process: {
  env: Record<string, string | undefined>;
};

console.log(process.env.DATABASE_URL);
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
