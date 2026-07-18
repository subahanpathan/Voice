import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { commentsTable, commentUpvotesTable, activityLogsTable } from "@workspace/db";
import { eq, and, sql, isNull } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function buildCommentResponse(
  comment: typeof commentsTable.$inferSelect,
  userId?: number,
  includeReplies = true,
) {
  const [author] = await db
    .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, comment.authorId))
    .limit(1);

  const [{ count: upvoteCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commentUpvotesTable)
    .where(eq(commentUpvotesTable.commentId, comment.id));

  let isUpvoted = false;
  if (userId) {
    const [uv] = await db
      .select({ id: commentUpvotesTable.id })
      .from(commentUpvotesTable)
      .where(
        and(
          eq(commentUpvotesTable.commentId, comment.id),
          eq(commentUpvotesTable.userId, userId),
        ),
      )
      .limit(1);
    isUpvoted = !!uv;
  }

  let replies: ReturnType<typeof buildCommentResponse> extends Promise<infer T> ? T[] : never[] = [];
  if (includeReplies) {
    const rawReplies = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.parentId, comment.id));
    replies = await Promise.all(
      rawReplies.map((r) => buildCommentResponse(r, userId, false)),
    );
  }

  return {
    id: comment.id,
    content: comment.content,
    campaignId: comment.campaignId,
    petitionId: comment.petitionId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    authorName: author?.name ?? "Unknown",
    authorAvatarUrl: author?.avatarUrl ?? null,
    upvoteCount: Number(upvoteCount),
    isUpvoted,
    replies,
    createdAt: comment.createdAt,
  };
}

// GET /api/comments
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const { campaignId, petitionId, page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  let query = db
    .select()
    .from(commentsTable)
    .where(isNull(commentsTable.parentId))
    .$dynamic();

  if (campaignId) {
    query = query.where(
      and(isNull(commentsTable.parentId), eq(commentsTable.campaignId, parseInt(campaignId))),
    );
  } else if (petitionId) {
    query = query.where(
      and(isNull(commentsTable.parentId), eq(commentsTable.petitionId, parseInt(petitionId))),
    );
  }

  const comments = await query.limit(limit).offset(offset);
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commentsTable)
    .where(isNull(commentsTable.parentId));

  const enriched = await Promise.all(
    comments.map((c) => buildCommentResponse(c, req.userId)),
  );
  res.json({ comments: enriched, total: Number(total), page: pageNum });
});

// POST /api/comments
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { content, campaignId, petitionId, parentId } = req.body as {
    content: string;
    campaignId?: number;
    petitionId?: number;
    parentId?: number;
  };

  const [comment] = await db
    .insert(commentsTable)
    .values({
      content,
      campaignId,
      petitionId,
      parentId,
      authorId: req.userId!,
    })
    .returning();

  await db.insert(activityLogsTable).values({
    userId: req.userId!,
    type: "posted_comment",
    title: "Posted a comment",
    description: content.slice(0, 80),
    campaignId,
  });

  res.status(201).json(await buildCommentResponse(comment, req.userId));
});

// POST /api/comments/:id/upvote
router.post("/:id/upvote", requireAuth, async (req: AuthRequest, res) => {
  const commentId = parseInt(req.params.id);
  const userId = req.userId!;

  const existing = await db
    .select()
    .from(commentUpvotesTable)
    .where(
      and(
        eq(commentUpvotesTable.commentId, commentId),
        eq(commentUpvotesTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(commentUpvotesTable)
      .where(
        and(
          eq(commentUpvotesTable.commentId, commentId),
          eq(commentUpvotesTable.userId, userId),
        ),
      );
    res.json({ success: true, message: "Upvote removed" });
    return;
  }

  await db.insert(commentUpvotesTable).values({ commentId, userId });
  res.json({ success: true, message: "Comment upvoted" });
});

export default router;
