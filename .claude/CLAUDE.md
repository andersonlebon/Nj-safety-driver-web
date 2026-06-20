# NJ Safety Driver — Claude Code instructions

Read this before any code change. Mirror rules in `.cursor/rules/` for Cursor.

## Project

Gabon road-safety MVP: **Driver / Agent / Admin** workspaces on Next.js 14 + Supabase.

## Architecture (mandatory)

- **Server-first**: RSC + `lib/queries/*` for page data; `requireRole` in layouts.
- **Client reads**: TanStack React Query only — `lib/api/*` fetchers + `hooks/queries/*` hooks + `lib/query-keys.ts`.
- **Client writes**: Server Actions (`app/*/actions.ts`).
- **Types**: import from `@/types` — never duplicate table shapes.
- **Auth**: middleware refreshes session; `requireRole` on server; never service role in client.
- **DB**: Drizzle schema → `supabase/migrations/` → `npm run db:push`; RLS in `post-migrations/`.

## Every change must

1. Match the layer map in `docs/ARCHITECTURE.md`.
2. Follow `docs/BEST_PRACTICES.md`.
3. Use React Query for any new client Supabase **read** (no `useEffect` fetches).
4. Keep diffs minimal; preserve business logic.
5. Pass `npm run lint && npm run type-check && npm run build`.

## Do not add (MVP scope)

OCR/ANPR, payment gateways, native apps, radar hardware APIs.

## Key paths

```
src/app/{driver,agent,admin}/   role workspaces
src/lib/auth.ts                 cached auth helpers
src/lib/queries/                server loaders
src/lib/api/                    client fetchers (React Query)
src/hooks/queries/              React Query hooks
src/types/index.ts              centralized types
.cursor/rules/                  Cursor agent rules (same standards)
```

## Skill

For full workflow detail, load `.claude/skills/nj-safety-driver/SKILL.md`.
