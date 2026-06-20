# NJ Safety Driver — Architecture

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 App Router, React 18, TypeScript strict |
| Styling | Tailwind CSS, Lucide, next-themes |
| Backend | Supabase Auth, Postgres, Storage |
| ORM | Drizzle (`src/db/schema.ts`) — schema generation only |
| Client cache | TanStack React Query v5 |
| Deploy | Vercel |

## Request flow

```
Browser
  → middleware.ts              session refresh, auth redirect, role route guard
  → app/ (Server Components)   layouts + pages
  → components/                UI (client when interactive)
  → hooks/queries/             React Query (client reads)
  → lib/api/                   client fetchers
  → lib/queries/               server loaders (RSC)
  → lib/auth.ts                cached session + profile helpers
  → lib/supabase/              client | server | middleware | admin
  → types/                     centralized TypeScript
```

## Directory layout

```
src/
  app/
    (auth)/          login, register
    driver/          driver workspace
    agent/           agent workspace
    admin/           admin workspace
    onboarding/
  components/
    ui/              shared primitives
    dashboard/       shell, KPIs, charts (lazy)
    providers/       AppProviders, QueryProvider
  hooks/
    queries/         useXxx React Query hooks
  lib/
    api/             client-side fetchers (browser Supabase)
    queries/         server-side paginated loaders
    auth/            profiles, route-access, profile-session
    supabase/        SSR clients
    query-keys.ts    React Query key factory
    types/database.ts  Supabase Database type (source)
  types/
    index.ts         public type exports — import @/types
  db/schema.ts       Drizzle schema
supabase/
  migrations/        SQL DDL (applied by npm run db:push)
  post-migrations/   RLS, triggers, storage policies
.cursor/rules/       Cursor agent rules
.claude/             Claude Code instructions + skills
```

## Roles

| Role | Prefix | Layout guard |
|------|--------|--------------|
| driver | `/driver/*` | `requireRole(["driver","admin"])` |
| agent | `/agent/*` | `requireRole(["agent","admin"])` |
| admin | `/admin/*` | `requireRole(["admin"])` |

Middleware enforces session + cross-role redirects before RSC runs.

## Data fetching

### Server (default)

- Initial page data, dashboards, tables: **Server Components**
- Loaders in `lib/queries/` or inline `createClient()` + `Promise.all`
- Auth: `requireRole`, `getCurrentProfile` (React `cache()`)

### Client reads (React Query)

All browser Supabase **reads** go through:

1. `lib/query-keys.ts` — cache key
2. `lib/api/<domain>.ts` — async fetcher (`createClient()`)
3. `hooks/queries/use-<name>.ts` — `useQuery` wrapper
4. Component consumes hook — **no** `useEffect` + `setState` fetches

Example: `useStaffDocuments` → `fetchStaffDocumentsBundle`

### Client writes

- **Server Actions** in `app/*/actions.ts`
- `revalidatePath` for RSC cache; `queryClient.invalidateQueries` for client cache

## Types

- **Single entry:** `@/types` (`src/types/index.ts`)
- Schema: `src/lib/types/database.ts` → row aliases in `src/types/index.ts`
- Workflow: Drizzle change → migration → update `database.ts` → add alias

## Security

- RLS on all tables; never bypass from client
- `SUPABASE_SERVICE_ROLE_KEY` only in `/setup` and admin promotion server code
- Privileged roles never from signup metadata

## Database

```bash
npm run db:push    # migrations + post-migrations (idempotent)
npm run db:generate
```

## Agent rules

Cursor: `.cursor/rules/*.mdc`  
Claude: `.claude/CLAUDE.md` + `.claude/skills/nj-safety-driver/SKILL.md`

Every change must follow `docs/BEST_PRACTICES.md`.
