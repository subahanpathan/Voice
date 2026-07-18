import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { campaignsTable } from "./campaigns";

export const petitionsTable = pgTable("petitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  campaignId: integer("campaign_id").references(() => campaignsTable.id),
  targetSignatures: integer("target_signatures"),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const petitionSignaturesTable = pgTable("petition_signatures", {
  id: serial("id").primaryKey(),
  petitionId: integer("petition_id")
    .notNull()
    .references(() => petitionsTable.id),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  displayName: text("display_name").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
