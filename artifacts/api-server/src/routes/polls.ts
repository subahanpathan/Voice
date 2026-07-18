import { Router } from "express";
import { db } from "@workspace/db";
import {
  pollsTable,
  pollOptionsTable,
  pollVotesTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function buildPollResponse(
  poll: typeof pollsTable.$inferSelect,
  userId?: number,
) {
  const options = await db
    .select()
    .from(pollOptionsTable)
    .where(eq(pollOptionsTable.pollId, poll.id))
    .orderBy(pollOptionsTable.orderIndex);

  const [{ count: totalVotes }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pollVotesTable)
    .where(eq(pollVotesTable.pollId, poll.id));

  const total = Number(totalVotes);

  let userVotedOptionId: number | null = null;
  if (userId) {
    const [vote] = await db
      .select({ optionId: pollVotesTable.optionId })
      .from(pollVotesTable)
      .where(
        and(
          eq(pollVotesTable.pollId, poll.id),
          eq(pollVotesTable.userId, userId),
        ),
      )
      .limit(1);
    userVotedOptionId = vote?.optionId ?? null;
  }

  const enrichedOptions = await Promise.all(
    options.map(async (opt) => {
      const [{ count: voteCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pollVotesTable)
        .where(eq(pollVotesTable.optionId, opt.id));
      const vc = Number(voteCount);
      return {
        id: opt.id,
        text: opt.text,
        voteCount: vc,
        percentage: total > 0 ? Math.round((vc / total) * 100) : 0,
      };
    }),
  );

  return {
    id: poll.id,
    question: poll.question,
    campaignId: poll.campaignId,
    options: enrichedOptions,
    totalVotes: total,
    userVotedOptionId,
    endsAt: poll.endsAt,
    createdAt: poll.createdAt,
  };
}

// GET /api/polls
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const { campaignId, page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limit = 12;
  const offset = (pageNum - 1) * limit;

  let query = db.select().from(pollsTable).$dynamic();
  if (campaignId) {
    query = query.where(eq(pollsTable.campaignId, parseInt(campaignId)));
  }

  const polls = await query.limit(limit).offset(offset);
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pollsTable);

  const enriched = await Promise.all(polls.map((p) => buildPollResponse(p, req.userId)));
  res.json({ polls: enriched, total: Number(total), page: pageNum });
});

// POST /api/polls
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { question, campaignId, options, endsAt } = req.body as {
    question: string;
    campaignId?: number;
    options: string[];
    endsAt?: string;
  };

  const [poll] = await db
    .insert(pollsTable)
    .values({
      question,
      campaignId,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      creatorId: req.userId!,
    })
    .returning();

  for (let i = 0; i < options.length; i++) {
    await db
      .insert(pollOptionsTable)
      .values({ pollId: poll.id, text: options[i], orderIndex: i });
  }

  res.status(201).json(await buildPollResponse(poll, req.userId));
});

// GET /api/polls/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.id, id))
    .limit(1);

  if (!poll) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  res.json(await buildPollResponse(poll, req.userId));
});

// POST /api/polls/:id/vote
router.post("/:id/vote", requireAuth, async (req: AuthRequest, res) => {
  const pollId = parseInt(req.params.id);
  const userId = req.userId!;
  const { optionId } = req.body as { optionId: number };

  const existing = await db
    .select()
    .from(pollVotesTable)
    .where(
      and(
        eq(pollVotesTable.pollId, pollId),
        eq(pollVotesTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Update vote
    await db
      .update(pollVotesTable)
      .set({ optionId })
      .where(
        and(
          eq(pollVotesTable.pollId, pollId),
          eq(pollVotesTable.userId, userId),
        ),
      );
  } else {
    await db.insert(pollVotesTable).values({ pollId, optionId, userId });
    await db.insert(activityLogsTable).values({
      userId,
      type: "voted_poll",
      title: "Voted in a poll",
      description: `Voted in poll #${pollId}`,
    });
  }

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.id, pollId))
    .limit(1);
  res.json(await buildPollResponse(poll, userId));
});

export default router;
