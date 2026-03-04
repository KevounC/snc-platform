import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

import { users } from "./user.schema.js";

// ── Content ──

export const content = pgTable(
  "content",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    description: text("description"),
    visibility: text("visibility").notNull().default("public"),
    thumbnailKey: text("thumbnail_key"),
    mediaKey: text("media_key"),
    coverArtKey: text("cover_art_key"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("content_creator_active_idx").on(table.creatorId, table.deletedAt),
    index("content_type_active_idx").on(table.type, table.deletedAt),
    index("content_feed_idx").on(
      table.visibility,
      table.deletedAt,
      table.publishedAt,
    ),
  ],
);
