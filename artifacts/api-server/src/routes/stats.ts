import { Router } from "express";
import { db } from "@workspace/db";
import {
  campaignsTable,
  usersTable,
  petitionSignaturesTable,
  pollsTable,
  campaignMembersTable,
  campaignBookmarksTable,
  activityLogsTable,
  petitionsTable,
  pollVotesTable,
  commentsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/stats/platform
router.get("/platform", async (_req, res) => {
  const [{ totalCampaigns }] = await db
    .select({ totalCampaigns: sql<number>`count(*)` })
    .from(campaignsTable);

  const [{ totalCitizens }] = await db
    .select({ totalCitizens: sql<number>`count(*)` })
    .from(usersTable);

  const [{ totalPetitionSigns }] = await db
    .select({ totalPetitionSigns: sql<number>`count(*)` })
    .from(petitionSignaturesTable);

  const [{ totalPolls }] = await db
    .select({ totalPolls: sql<number>`count(*)` })
    .from(pollsTable);

  const [{ activeCampaigns }] = await db
    .select({ activeCampaigns: sql<number>`count(*)` })
    .from(campaignsTable)
    .where(eq(campaignsTable.status, "active"));

  const categoryData = await db
    .select({
      category: campaignsTable.category,
      count: sql<number>`count(*)`,
    })
    .from(campaignsTable)
    .groupBy(campaignsTable.category);

  res.json({
    totalCampaigns: Number(totalCampaigns),
    totalCitizens: Number(totalCitizens),
    totalPetitionSigns: Number(totalPetitionSigns),
    totalPolls: Number(totalPolls),
    activeCampaigns: Number(activeCampaigns),
    campaignsByCategory: categoryData.map((c) => ({
      category: c.category,
      count: Number(c.count),
    })),
    recentGrowth: 12.5,
  });
});

// GET /api/stats/dashboard
router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const [{ campaignsJoined }] = await db
    .select({ campaignsJoined: sql<number>`count(*)` })
    .from(campaignMembersTable)
    .where(eq(campaignMembersTable.userId, userId));

  const [{ petitionsSigned }] = await db
    .select({ petitionsSigned: sql<number>`count(*)` })
    .from(petitionSignaturesTable) // Using table directly for user's signatures
    .where(eq(petitionSignaturesTable.userId, userId));

  const [{ pollsVoted }] = await db
    .select({ pollsVoted: sql<number>`count(*)` })
    .from(pollVotesTable)
    .where(eq(pollVotesTable.userId, userId));

  const [{ commentsPosted }] = await db
    .select({ commentsPosted: sql<number>`count(*)` })
    .from(commentsTable)
    .where(eq(commentsTable.authorId, userId));

  const [{ bookmarkCount }] = await db
    .select({ bookmarkCount: sql<number>`count(*)` })
    .from(campaignBookmarksTable)
    .where(eq(campaignBookmarksTable.userId, userId));

  const cj = Number(campaignsJoined);
  const ps = Number(petitionsSigned);
  const pv = Number(pollsVoted);
  const cp = Number(commentsPosted);
  const impactScore = cj * 10 + ps * 15 + pv * 5 + cp * 3;

  res.json({
    campaignsJoined: cj,
    petitionsSigned: ps,
    pollsVoted: pv,
    commentsPosted: cp,
    impactScore,
    bookmarkCount: Number(bookmarkCount),
  });
});

// GET /api/stats/activity
router.get("/activity", requireAuth, async (req: AuthRequest, res) => {
  const activity = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.userId, req.userId!))
    .orderBy(sql`${activityLogsTable.createdAt} DESC`)
    .limit(20);

  res.json(
    activity.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      campaignId: a.campaignId,
      timestamp: a.createdAt,
    })),
  );
});

export default router;
