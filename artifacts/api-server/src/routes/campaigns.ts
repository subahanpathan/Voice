import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import {
  campaignsTable,
  campaignMembersTable,
  campaignBookmarksTable,
  campaignUpdatesTable,
  petitionSignaturesTable,
  petitionsTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, and, sql, ilike, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function buildCampaignResponse(
  campaign: typeof campaignsTable.$inferSelect,
  userId?: number,
) {
  const [creator] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, campaign.creatorId))
    .limit(1);

  const [{ count: supporterCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaignMembersTable)
    .where(eq(campaignMembersTable.campaignId, campaign.id));

  // Get signature count from all petitions under this campaign
  const campaignPetitions = await db
    .select({ id: petitionsTable.id })
    .from(petitionsTable)
    .where(eq(petitionsTable.campaignId, campaign.id));

  let signatureCount = 0;
  if (campaignPetitions.length > 0) {
    const petitionIds = campaignPetitions.map((p) => p.id);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(petitionSignaturesTable)
      .where(inArray(petitionSignaturesTable.petitionId, petitionIds));
    signatureCount = Number(count);
  }

  let isBookmarked = false;
  let isJoined = false;
  if (userId) {
    const [bm] = await db
      .select({ id: campaignBookmarksTable.id })
      .from(campaignBookmarksTable)
      .where(
        and(
          eq(campaignBookmarksTable.campaignId, campaign.id),
          eq(campaignBookmarksTable.userId, userId),
        ),
      )
      .limit(1);
    isBookmarked = !!bm;

    const [jn] = await db
      .select({ id: campaignMembersTable.id })
      .from(campaignMembersTable)
      .where(
        and(
          eq(campaignMembersTable.campaignId, campaign.id),
          eq(campaignMembersTable.userId, userId),
        ),
      )
      .limit(1);
    isJoined = !!jn;
  }

  const target = campaign.targetSignatures ?? null;
  const progressPercent =
    target && target > 0
      ? Math.min(100, Math.round((signatureCount / target) * 100))
      : 0;

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    status: campaign.status,
    imageUrl: campaign.imageUrl,
    supporterCount: Number(supporterCount),
    signatureCount,
    targetSignatures: target,
    progressPercent,
    isBookmarked,
    isJoined,
    location: campaign.location,
    tags: campaign.tags ?? [],
    creatorId: campaign.creatorId,
    creatorName: creator?.name ?? "Unknown",
    createdAt: campaign.createdAt,
    endsAt: campaign.endsAt,
  };
}

// GET /api/campaigns
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const { category, status, search, page = "1", limit = "12" } = req.query as Record<string, string>;

  let query = db.select().from(campaignsTable).$dynamic();

  const conditions = [];
  if (category) conditions.push(eq(campaignsTable.category, category as typeof campaignsTable.$inferSelect["category"]));
  if (status) conditions.push(eq(campaignsTable.status, status as typeof campaignsTable.$inferSelect["status"]));
  if (search) conditions.push(ilike(campaignsTable.title, `%${search}%`));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const campaigns = await query.limit(limitNum).offset(offset);

  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaignsTable);

  const enriched = await Promise.all(
    campaigns.map((c) => buildCampaignResponse(c, req.userId)),
  );

  res.json({ campaigns: enriched, total: Number(total), page: pageNum, limit: limitNum });
});

// GET /api/campaigns/featured
router.get("/featured", optionalAuth, async (req: AuthRequest, res) => {
  const campaigns = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.status, "active"))
    .limit(6);

  const enriched = await Promise.all(
    campaigns.map((c) => buildCampaignResponse(c, req.userId)),
  );
  res.json(enriched);
});

// GET /api/campaigns/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, id))
    .limit(1);

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(await buildCampaignResponse(campaign, req.userId));
});

// POST /api/campaigns
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { title, description, category, imageUrl, location, tags, targetSignatures, endsAt } =
    req.body as {
      title: string;
      description: string;
      category: string;
      imageUrl?: string;
      location?: string;
      tags?: string[];
      targetSignatures?: number;
      endsAt?: string;
    };

  const [campaign] = await db
    .insert(campaignsTable)
    .values({
      title,
      description,
      category: category as typeof campaignsTable.$inferSelect["category"],
      imageUrl,
      location,
      tags,
      targetSignatures,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      creatorId: req.userId!,
    })
    .returning();

  res.status(201).json(await buildCampaignResponse(campaign, req.userId));
});

// PATCH /api/campaigns/:id
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { title, description, status, imageUrl, location, tags } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    imageUrl?: string;
    location?: string;
    tags?: string[];
  };

  const [campaign] = await db
    .update(campaignsTable)
    .set({
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(status ? { status: status as typeof campaignsTable.$inferSelect["status"] } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(tags ? { tags } : {}),
      updatedAt: new Date(),
    })
    .where(eq(campaignsTable.id, id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(await buildCampaignResponse(campaign, req.userId));
});

// POST /api/campaigns/:id/join
router.post("/:id/join", requireAuth, async (req: AuthRequest, res) => {
  const campaignId = parseInt(req.params.id);
  const userId = req.userId!;

  const existing = await db
    .select()
    .from(campaignMembersTable)
    .where(
      and(
        eq(campaignMembersTable.campaignId, campaignId),
        eq(campaignMembersTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Toggle: leave
    await db
      .delete(campaignMembersTable)
      .where(
        and(
          eq(campaignMembersTable.campaignId, campaignId),
          eq(campaignMembersTable.userId, userId),
        ),
      );
    res.json({ success: true, message: "Left campaign" });
    return;
  }

  await db.insert(campaignMembersTable).values({ campaignId, userId });
  await db.insert(activityLogsTable).values({
    userId,
    type: "joined_campaign",
    title: "Joined a campaign",
    description: `Joined campaign #${campaignId}`,
    campaignId,
  });

  res.json({ success: true, message: "Joined campaign" });
});

// POST /api/campaigns/:id/bookmark
router.post("/:id/bookmark", requireAuth, async (req: AuthRequest, res) => {
  const campaignId = parseInt(req.params.id);
  const userId = req.userId!;

  const existing = await db
    .select()
    .from(campaignBookmarksTable)
    .where(
      and(
        eq(campaignBookmarksTable.campaignId, campaignId),
        eq(campaignBookmarksTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(campaignBookmarksTable)
      .where(
        and(
          eq(campaignBookmarksTable.campaignId, campaignId),
          eq(campaignBookmarksTable.userId, userId),
        ),
      );
    res.json({ success: true, message: "Bookmark removed" });
    return;
  }

  await db.insert(campaignBookmarksTable).values({ campaignId, userId });
  res.json({ success: true, message: "Campaign bookmarked" });
});

// GET /api/campaigns/:id/updates
router.get("/:id/updates", async (req, res) => {
  const campaignId = parseInt(req.params.id);
  const updates = await db
    .select()
    .from(campaignUpdatesTable)
    .where(eq(campaignUpdatesTable.campaignId, campaignId))
    .orderBy(campaignUpdatesTable.createdAt);

  res.json(
    updates.map((u) => ({
      id: u.id,
      campaignId: u.campaignId,
      title: u.title,
      content: u.content,
      createdAt: u.createdAt,
    })),
  );
});

// POST /api/campaigns/:id/updates
router.post("/:id/updates", requireAuth, async (req: AuthRequest, res) => {
  const campaignId = parseInt(req.params.id);
  const { title, content } = req.body as { title: string; content: string };

  const [update] = await db
    .insert(campaignUpdatesTable)
    .values({ campaignId, title, content })
    .returning();

  res.status(201).json({
    id: update.id,
    campaignId: update.campaignId,
    title: update.title,
    content: update.content,
    createdAt: update.createdAt,
  });
});

export default router;
