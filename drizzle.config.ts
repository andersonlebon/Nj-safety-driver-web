import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  driver: "pg",
  dbCredentials: {
    // Used only for local generation. Do NOT commit real values.
    connectionString: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
