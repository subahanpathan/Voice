import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const { unreadOnly } = req.query as { unreadOnly?: string };

  let query = db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .$dynamic();

  if (unreadOnly === "true") {
    query = query.where(
      and(
        eq(notificationsTable.userId, req.userId!),
        eq(notificationsTable.isRead, false),
      ),
    );
  }

  const notifications = await query.orderBy(notificationsTable.createdAt);
  res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      campaignId: n.campaignId,
      createdAt: n.createdAt,
    })),
  );
});

// POST /api/notifications/read-all
router.post("/read-all", requireAuth, async (req: AuthRequest, res) => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));
  res.json({ success: true, message: "All notifications marked as read" });
});

// POST /api/notifications/:id/read
router.post("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, req.userId!),
      ),
    );
  res.json({ success: true, message: "Notification marked as read" });
});

export default router;
