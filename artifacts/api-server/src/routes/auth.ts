import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken, type AuthRequest } from "../middlewares/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, state, city } = req.body as {
    name: string;
    email: string;
    password: string;
    state?: string;
    city?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      state,
      city,
    })
    .returning();

  const token = signToken(user.id);
  res.status(201).json({
    user: safeUser(user),
    token,
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  res.json({ user: safeUser(user), token });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(safeUser(user));
});

// PATCH /api/auth/me/profile
router.patch("/me/profile", requireAuth, async (req: AuthRequest, res) => {
  const { name, bio, state, city, avatarUrl } = req.body as {
    name?: string;
    bio?: string;
    state?: string;
    city?: string;
    avatarUrl?: string;
  };

  const [user] = await db
    .update(usersTable)
    .set({
      ...(name ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(state !== undefined ? { state } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json(safeUser(user));
});

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    state: user.state,
    city: user.city,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export default router;
