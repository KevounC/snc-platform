import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

import { users } from "./user.schema.js";

// ── Creator Profiles ──

export const creatorProfiles = pgTable("creator_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarKey: text("avatar_key"),
  bannerKey: text("banner_key"),
  bandcampUrl: text("bandcamp_url"),
  bandcampEmbeds: jsonb("bandcamp_embeds")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
