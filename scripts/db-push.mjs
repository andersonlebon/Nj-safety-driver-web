#!/usr/bin/env node
// =====================================================================
// db:push — single command to sync EVERYTHING to Supabase.
//
// Why this exists (and why we don't use `drizzle-kit push`):
//   `drizzle-kit push` introspects the live database and computes a diff,
//   which crashes on Supabase projects that already contain pre-existing
//   CHECK constraints (auth schema, etc). We bypass that entirely by
//   applying the SQL Drizzle has already generated under
//   `supabase/migrations/` directly with `postgres-js`, then layering our
//   own RLS / triggers / storage SQL from `supabase/post-migrations/`.
//
// Pipeline:
//   1. `supabase/migrations/*.sql`       (tables, columns, FKs, enums)
//      Each statement is executed independently; "already exists" errors
//      are tolerated so re-running is always safe.
//   2. `supabase/post-migrations/*.sql`  (RLS, triggers, helpers, storage)
//      These files MUST be idempotent on their own (`drop … if exists`,
//      `create or replace`, `on conflict do nothing`).
// =====================================================================

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

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const postMigrationsDir = join(root, "supabase", "post-migrations");

/** Postgres error codes we treat as "already done, nothing to do". */
const IDEMPOTENT_ERROR_CODES = new Set([
  "42P07", // duplicate_table
  "42710", // duplicate_object  (types, constraints, policies, triggers)
  "42P06", // duplicate_schema
  "42701", // duplicate_column
  "42723", // duplicate_function
]);

const sql = postgres(url, {
  max: 1,
  ssl: "require",
  prepare: false,
  onnotice: () => {},
});

/** Split a Drizzle migration file on its `--> statement-breakpoint` markers. */
function splitStatements(content) {
  return content
    .split(/--> *statement-breakpoint/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Skip legacy migrations superseded by a later schema (see file header comment). */
async function shouldSkipMigration(content) {
  const match = content.match(/^--\s*@skip-if\s+(.+)$/m);
  if (!match) return false;

  const condition = match[1].trim();
  if (condition === "staff_profiles exists") {
    const [{ skip }] = await sql`
      select to_regclass('public.staff_profiles') is not null as skip
    `;
    return skip;
  }

  return false;
}

async function applyTablesMigrations() {
  if (!existsSync(migrationsDir)) {
    console.log("• no supabase/migrations folder — skipping");
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("• supabase/migrations is empty — skipping");
    return;
  }

  console.log(`▶ Applying ${files.length} schema migration(s)`);

  for (const file of files) {
    process.stdout.write(`  • ${file} ... `);
    const content = readFileSync(join(migrationsDir, file), "utf8");

    if (await shouldSkipMigration(content)) {
      console.log("skipped (superseded)");
      continue;
    }

    const statements = splitStatements(content);

    let applied = 0;
    let skipped = 0;
    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt);
        applied++;
      } catch (err) {
        if (IDEMPOTENT_ERROR_CODES.has(err.code)) {
          skipped++;
          continue;
        }
        console.log("FAIL");
        throw err;
      }
    }
    console.log(
      `ok (${applied} applied${skipped ? `, ${skipped} already present` : ""})`
    );
  }
}

async function applyPostMigrations() {
  if (!existsSync(postMigrationsDir)) {
    console.log("\n✔ no supabase/post-migrations folder — done");
    return;
  }

  const files = readdirSync(postMigrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("\n✔ supabase/post-migrations is empty — done");
    return;
  }

  console.log(`\n▶ Applying ${files.length} post-migration file(s)`);

  for (const file of files) {
    process.stdout.write(`  • ${file} ... `);
    const content = readFileSync(join(postMigrationsDir, file), "utf8");
    try {
      await sql.unsafe(content);
      console.log("ok");
    } catch (err) {
      console.log("FAIL");
      throw err;
    }
  }
}

try {
  await applyTablesMigrations();
  await applyPostMigrations();
  console.log("\n✔ Database is fully up to date");
} catch (err) {
  console.error("\n✗ db:push failed");
  console.error(err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
