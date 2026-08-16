import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { authMiddleware, generateToken, AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", async (req, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, data: null, error: "Email, password, and name are required" });
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ success: false, data: null, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(schema.users).values({ email, passwordHash, name }).returning();

    const token = generateToken(user.id);
    return res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
      error: null,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, data: null, error: "Registration failed" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, error: "Email and password are required" });
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (!user) {
      return res.status(401).json({ success: false, data: null, error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, data: null, error: "Invalid email or password" });
    }

    const token = generateToken(user.id);
    return res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
      error: null,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, data: null, error: "Login failed" });
  }
});

// GET /api/auth/me
authRouter.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.userId!));
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: "User not found" });
    }
    return res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name },
      error: null,
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ success: false, data: null, error: "Failed to fetch user" });
  }
});
