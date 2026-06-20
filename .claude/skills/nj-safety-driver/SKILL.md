---
name: nj-safety-driver
description: >-
  Develop and review NJ Safety Driver (Next.js 14 + Supabase + React Query).
  Use when editing this repo, adding features, fixing bugs, or reviewing whether
  changes follow architecture, React Query hooks, centralized types, and auth
  patterns.
---

# NJ Safety Driver

## Quick context

Role-based road-safety SaaS: `/driver`, `/agent`, `/admin`. Supabase Auth + RLS. Strict TypeScript.

## Before coding

1. Read `docs/ARCHITECTURE.md` and `docs/BEST_PRACTICES.md`.
2. Check `.cursor/rules/` — same standards apply here.
3. Identify layer: server RSC, server action, client hook, or UI only.

## Data fetching decision tree

```
Need data in a Server Component / page?
  → lib/queries/* or inline supabase/server + Promise.all

Need data in a Client Component?
  → lib/api/<domain>.ts (fetcher)
  → hooks/queries/use-<name>.ts (useQuery)
  → queryKeys in lib/query-keys.ts

Need to write data?
  → Server Action + revalidatePath / invalidateQueries
```

## Types

- Import from `@/types` only.
- New table: Drizzle → migration → database.ts → types/index.ts aliases.

## React Query checklist

- [ ] Key added to `lib/query-keys.ts`
- [ ] Fetcher in `lib/api/` (no React imports)
- [ ] Hook in `hooks/queries/` with `enabled` guard
- [ ] Component uses hook — no direct `createClient()`
- [ ] Mutations invalidate affected keys

## Auth checklist

- [ ] Protected route uses `requireRole` in layout or page
- [ ] Actions use `requireRoleForAction` for user-facing errors
- [ ] No service role outside `/setup` and admin promotion

## Performance habits (already in codebase)

- `cache()` on auth helpers — do not remove
- Lazy chart imports (`dynamic` + skeleton)
- Role `loading.tsx` for streaming
- Parallel independent queries

## Reference files

| Pattern | Example |
|---------|---------|
| React Query hook | `src/hooks/queries/use-staff-documents.ts` |
| Client fetcher | `src/lib/api/documents.ts` |
| Server loader | `src/lib/queries/drivers.ts` |
| Server action | `src/app/driver/actions.ts` |
| Cached auth | `src/lib/auth.ts` |

## Out of scope

OCR, real payments, mobile apps, radar integration.
