import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import {
  campaignsTable,
  campaignMembersTable,
  campaignBookmarksTable,
  petitionSignaturesTable,
  pollVotesTable,
  commentsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/users/me/campaigns
router.get("/me/campaigns", requireAuth, async (req: AuthRequest, res) => {
  const memberships = await db
    .select({ campaignId: campaignMembersTable.campaignId })
    .from(campaignMembersTable)
    .where(eq(campaignMembersTable.userId, req.userId!));

  if (memberships.length === 0) {
    res.json([]);
    return;
  }

  const campaignIds = memberships.map((m) => m.campaignId);
  const campaigns = await db
    .select()
    .from(campaignsTable)
    .where(inArray(campaignsTable.id, campaignIds));

  res.json(
    campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.status,
      imageUrl: c.imageUrl,
      supporterCount: 0,
      signatureCount: 0,
      targetSignatures: c.targetSignatures,
      progressPercent: 0,
      isBookmarked: false,
      isJoined: true,
      location: c.location,
      tags: c.tags ?? [],
      creatorId: c.creatorId,
      creatorName: "",
      createdAt: c.createdAt,
      endsAt: c.endsAt,
    })),
  );
});

// GET /api/users/me/bookmarks
router.get("/me/bookmarks", requireAuth, async (req: AuthRequest, res) => {
  const bookmarks = await db
    .select({ campaignId: campaignBookmarksTable.campaignId })
    .from(campaignBookmarksTable)
    .where(eq(campaignBookmarksTable.userId, req.userId!));

  if (bookmarks.length === 0) {
    res.json([]);
    return;
  }

  const campaignIds = bookmarks.map((b) => b.campaignId);
  const campaigns = await db
    .select()
    .from(campaignsTable)
    .where(inArray(campaignsTable.id, campaignIds));

  res.json(
    campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.status,
      imageUrl: c.imageUrl,
      supporterCount: 0,
      signatureCount: 0,
      targetSignatures: c.targetSignatures,
      progressPercent: 0,
      isBookmarked: true,
      isJoined: false,
      location: c.location,
      tags: c.tags ?? [],
      creatorId: c.creatorId,
      creatorName: "",
      createdAt: c.createdAt,
      endsAt: c.endsAt,
    })),
  );
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    state: user.state,
    city: user.city,
    bio: user.bio,
    createdAt: user.createdAt,
  });
});

export default router;
