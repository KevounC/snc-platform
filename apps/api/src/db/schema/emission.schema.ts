import {
  boolean,
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ── Emissions ──

export const emissions = pgTable(
  "emissions",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    scope: integer("scope").notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory").notNull(),
    source: text("source").notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    unit: text("unit").notNull(),
    co2Kg: real("co2_kg").notNull(),
    method: text("method").notNull(),
    projected: boolean("projected").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("emissions_date_idx").on(table.date),
    index("emissions_scope_category_idx").on(table.scope, table.category),
  ],
);
