import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { campaignsTable } from "./campaigns";

export const activityTypeEnum = pgEnum("activity_type", [
  "joined_campaign",
  "signed_petition",
  "voted_poll",
  "posted_comment",
  "bookmarked",
]);

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  campaignId: integer("campaign_id").references(() => campaignsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
