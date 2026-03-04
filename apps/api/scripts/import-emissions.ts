import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { db, sql } from "../src/db/connection.js";
import { emissions } from "../src/db/schema/emission.schema.js";

// ── Types ──

interface JsonEntry {
  id: string;
  date: string;
  scope: number;
  category: string;
  subcategory: string;
  source: string;
  description: string;
  amount: number;
  unit: string;
  co2_kg: number;
  method: string;
  metadata?: Record<string, unknown> | null;
}

interface EmissionsFile {
  year: number;
  entries: JsonEntry[];
}

// ── Main ──

const DRY_RUN = process.argv.includes("--dry-run");
const EMISSIONS_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "emissions",
  "data",
);

async function main(): Promise<void> {
  console.log(
    DRY_RUN ? "[DRY RUN] Previewing import..." : "Importing emissions data...",
  );
  console.log(`Reading from: ${EMISSIONS_DIR}`);

  const files = readdirSync(EMISSIONS_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No JSON files found.");
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const raw = readFileSync(join(EMISSIONS_DIR, file), "utf-8");
    const data = JSON.parse(raw) as EmissionsFile;
    console.log(`\nProcessing ${file} (${data.entries.length} entries)`);

    for (const entry of data.entries) {
      const mapped = {
        id: entry.id,
        date: entry.date,
        scope: entry.scope,
        category: entry.category,
        subcategory: entry.subcategory,
        source: entry.source,
        description: entry.description,
        amount: entry.amount,
        unit: entry.unit,
        co2Kg: entry.co2_kg,
        method: entry.method,
        metadata: entry.metadata ?? null,
      };

      if (DRY_RUN) {
        console.log(`  Would insert: ${mapped.id} (${mapped.date} — ${mapped.description})`);
        totalInserted++;
        continue;
      }

      const result = await db
        .insert(emissions)
        .values(mapped)
        .onConflictDoNothing({ target: emissions.id });

      if (result.rowCount && result.rowCount > 0) {
        totalInserted++;
        console.log(`  Inserted: ${mapped.id} (${mapped.date})`);
      } else {
        totalSkipped++;
        console.log(`  Skipped (already exists): ${mapped.id}`);
      }
    }
  }

  console.log(
    `\nDone. Inserted ${totalInserted}, skipped ${totalSkipped} (already exist).`,
  );

  await sql.end();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
