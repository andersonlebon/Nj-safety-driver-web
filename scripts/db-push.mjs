#!/usr/bin/env node
// =====================================================================
// db:push — single command to sync EVERYTHING to Supabase
//
// 1. Runs `drizzle-kit push` to apply the table schema from src/db/schema.ts.
// 2. Applies every `.sql` file in `supabase/post-migrations/` in alphabetical
//    order (RLS policies, triggers, helper functions, storage buckets — all
//    the things Drizzle does NOT model).
//
// All post-migration SQL files MUST be idempotent (use `create or replace`,
// `drop … if exists`, `on conflict do nothing`) so re-running this script is
// always safe.
// =====================================================================

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "✗ DATABASE_URL is required.\n" +
      "  Add it to .env.local — get it from\n" +
      "  Supabase Dashboard → Project Settings → Database → Connection string."
  );
  process.exit(1);
}

// 1. Drizzle schema push -----------------------------------------------------
console.log("▶ drizzle-kit push (tables, columns, FKs, enums)\n");
const drizzle = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["drizzle-kit", "push"],
  { stdio: "inherit" }
);
if (drizzle.status !== 0) {
  console.error("\n✗ drizzle-kit push failed");
  process.exit(drizzle.status ?? 1);
}

// 2. Post-migration SQL ------------------------------------------------------
const dir = join(process.cwd(), "supabase", "post-migrations");
if (!existsSync(dir)) {
  console.log("\n✔ No post-migrations folder, nothing else to apply.");
  process.exit(0);
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("\n✔ No post-migration files, done.");
  process.exit(0);
}

console.log(`\n▶ Applying ${files.length} post-migration file(s)\n`);

const sql = postgres(url, {
  max: 1,
  ssl: "require",
  prepare: false,
});

try {
  for (const file of files) {
    process.stdout.write(`  • ${file} ... `);
    const content = readFileSync(join(dir, file), "utf8");
    await sql.unsafe(content).simple();
    console.log("ok");
  }
  console.log("\n✔ Database is fully up to date");
} catch (err) {
  console.error("\n✗ Failed to apply post-migration SQL");
  console.error(err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
