import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import {
  petitionsTable,
  petitionSignaturesTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function buildPetitionResponse(
  petition: typeof petitionsTable.$inferSelect,
  userId?: number,
) {
  const [creator] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, petition.creatorId))
    .limit(1);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(petitionSignaturesTable)
    .where(eq(petitionSignaturesTable.petitionId, petition.id));

  const signatureCount = Number(count);
  const target = petition.targetSignatures;
  const progressPercent =
    target && target > 0
      ? Math.min(100, Math.round((signatureCount / target) * 100))
      : 0;

  let isSigned = false;
  if (userId) {
    const [sig] = await db
      .select({ id: petitionSignaturesTable.id })
      .from(petitionSignaturesTable)
      .where(
        and(
          eq(petitionSignaturesTable.petitionId, petition.id),
          eq(petitionSignaturesTable.userId, userId),
        ),
      )
      .limit(1);
    isSigned = !!sig;
  }

  return {
    id: petition.id,
    title: petition.title,
    description: petition.description,
    campaignId: petition.campaignId,
    signatureCount,
    targetSignatures: target,
    progressPercent,
    isSigned,
    creatorName: creator?.name ?? "Unknown",
    createdAt: petition.createdAt,
  };
}

// GET /api/petitions
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const { campaignId, page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limit = 12;
  const offset = (pageNum - 1) * limit;

  let query = db.select().from(petitionsTable).$dynamic();
  if (campaignId) {
    query = query.where(eq(petitionsTable.campaignId, parseInt(campaignId)));
  }

  const petitions = await query.limit(limit).offset(offset);
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(petitionsTable);

  const enriched = await Promise.all(
    petitions.map((p) => buildPetitionResponse(p, req.userId)),
  );
  res.json({ petitions: enriched, total: Number(total), page: pageNum });
});

// POST /api/petitions
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { title, description, campaignId, targetSignatures } = req.body as {
    title: string;
    description: string;
    campaignId?: number;
    targetSignatures?: number;
  };

  const [petition] = await db
    .insert(petitionsTable)
    .values({
      title,
      description,
      campaignId,
      targetSignatures,
      creatorId: req.userId!,
    })
    .returning();

  res.status(201).json(await buildPetitionResponse(petition, req.userId));
});

// GET /api/petitions/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [petition] = await db
    .select()
    .from(petitionsTable)
    .where(eq(petitionsTable.id, id))
    .limit(1);

  if (!petition) {
    res.status(404).json({ error: "Petition not found" });
    return;
  }
  res.json(await buildPetitionResponse(petition, req.userId));
});

// POST /api/petitions/:id/sign
router.post("/:id/sign", requireAuth, async (req: AuthRequest, res) => {
  const petitionId = parseInt(req.params.id);
  const userId = req.userId!;
  const { displayName, comment } = req.body as {
    displayName: string;
    comment?: string;
  };

  const existing = await db
    .select()
    .from(petitionSignaturesTable)
    .where(
      and(
        eq(petitionSignaturesTable.petitionId, petitionId),
        eq(petitionSignaturesTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.json({ success: false, message: "Already signed" });
    return;
  }

  await db
    .insert(petitionSignaturesTable)
    .values({ petitionId, userId, displayName, comment });

  await db.insert(activityLogsTable).values({
    userId,
    type: "signed_petition",
    title: "Signed a petition",
    description: `Signed petition #${petitionId}`,
  });

  res.json({ success: true, message: "Petition signed" });
});

export default router;
