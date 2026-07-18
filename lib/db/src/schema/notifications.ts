import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { campaignsTable } from "./campaigns";

export const notificationTypeEnum = pgEnum("notification_type", [
  "campaign_update",
  "petition_milestone",
  "poll_created",
  "comment_reply",
  "system",
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  campaignId: integer("campaign_id").references(() => campaignsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
