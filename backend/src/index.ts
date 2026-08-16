import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { businessesRouter } from "./routes/businesses.js";
import { marketConfigsRouter } from "./routes/marketConfigs.js";
import { simulationsRouter } from "./routes/simulations.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, error: null });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/businesses", businessesRouter);
app.use("/api/market-configs", marketConfigsRouter);
app.use("/api/simulations", simulationsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: "Route not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, data: null, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

export default app;
