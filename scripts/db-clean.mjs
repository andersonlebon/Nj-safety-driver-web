#!/usr/bin/env node
// =====================================================================
// db:clean — wipe development data from Supabase.
//
// What it cleans (lowest blast radius first):
//   • DEFAULT             — TRUNCATEs all public app data tables (profiles,
//                           vehicles, documents, infractions, transactions, …).
//                           Schema, RLS, triggers, and storage buckets stay.
//   • --with-storage      — also empties storage objects in the `documents`
//                           and `evidence` buckets (the buckets themselves stay).
//   • --with-auth         — also deletes every row from `auth.users`. This is
//                           how you simulate a brand-new project; the
//                           `handle_new_user` trigger will repopulate `profiles`
//                           on next signup.
//   • --full              — equivalent to --with-storage --with-auth.
//
// Safety rails:
//   • Requires interactive "yes" confirmation unless --yes is passed.
//   • Refuses to run when NODE_ENV=production unless --force is also passed.
//   • Never drops the schema or RLS — re-running `npm run db:push` is not
//     required after a clean.
// =====================================================================

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";

const args = new Set(process.argv.slice(2));
const withStorage = args.has("--with-storage") || args.has("--full");
const withAuth = args.has("--with-auth") || args.has("--full");
const skipConfirm = args.has("--yes") || args.has("-y");
const force = args.has("--force");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "✗ DATABASE_URL is required.\n" +
      "  Add it to .env.local — get it from\n" +
      "  Supabase Dashboard → Project Settings → Database → Connection string.\n" +
      "  Then run: npm run db:clean"
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !force) {
  console.error(
    "✗ Refusing to run db:clean with NODE_ENV=production.\n" +
      "  If you really mean it, re-run with --force."
  );
  process.exit(1);
}

const targets = [
  "public app data (profiles, vehicles, documents, document_groups, infractions, transactions, tracking, messages, templates)",
];
if (withStorage) targets.push("storage objects in `documents` + `evidence` buckets");
if (withAuth) targets.push("ALL rows in `auth.users`");

console.log("\n  ⚠  db:clean will wipe the following from your Supabase project:\n");
for (const t of targets) console.log(`     • ${t}`);
console.log(
  `\n     Connection: ${url.replace(/:[^:@/]+@/, ":***@")}\n` +
    `     Schema, RLS, triggers, buckets, and storage policies will be kept.`
);

if (!skipConfirm) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question('\n  Type "yes" to continue: ')).trim();
  rl.close();
  if (answer !== "yes") {
    console.log("\n✗ Aborted, nothing was deleted.");
    process.exit(1);
  }
}

const sql = postgres(url, {
  max: 1,
  ssl: "require",
  prepare: false,
  onnotice: () => {},
});

try {
  console.log("\n▶ Truncating public data tables …");
  await sql.unsafe(
    `truncate table
       public.transactions,
       public.documents,
       public.document_groups,
       public.driver_messages,
       public.infractions,
       public.vehicle_tracking_events,
       public.vehicles,
       public.driver_profiles,
       public.agent_profiles,
       public.admin_profiles,
       public.infraction_templates,
       public.profiles
     restart identity cascade;`
  );
  console.log("  ✔ public tables emptied");

  if (withStorage) {
    console.log("\n▶ Clearing storage objects …");
    const deleted = await sql.unsafe(
      `delete from storage.objects
       where bucket_id in ('documents', 'evidence')
       returning id;`
    );
    console.log(`  ✔ removed ${deleted.length} object(s)`);
  }

  if (withAuth) {
    console.log("\n▶ Deleting all auth users …");
    const deleted = await sql.unsafe(
      `delete from auth.users returning id;`
    );
    console.log(`  ✔ removed ${deleted.length} auth user(s)`);
  }

  console.log("\n✔ Database cleaned. The next signup will create a fresh profile.\n");
} catch (err) {
  console.error("\n✗ db:clean failed");
  console.error(err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
