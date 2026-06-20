# Engineering Best Practices

## Core principles

- Keep components small and composable.
- **Server Components by default**; Client Components only for interaction.
- Strict TypeScript; import types from `@/types`.
- Avoid `any` unless unavoidable.
- Reuse existing UI primitives.
- Minimal diffs; no unrelated refactors.

## Next.js App Router

### Server Components

Use for: dashboards, tables, initial page data, protected routes.

### Client Components

Use for: forms, uploads, modals, charts, local state, React Query consumers.

Mark with `"use client"` only when required.

## Data fetching

### Server

```ts
// Page / RSC
const supabase = createClient(); // @/lib/supabase/server
const [a, b] = await Promise.all([loadA(), loadB()]);
```

- Shared loaders: `src/lib/queries/`
- Auth: `requireRole`, `getCurrentProfile` (already cached)

### Client (React Query) — required for Supabase reads

```
lib/query-keys.ts       → queryKeys.documents.staffBundle(...)
lib/api/documents.ts    → fetchStaffDocumentsBundle()
hooks/queries/          → useStaffDocuments()
```

**Rules:**

- Never call `createClient()` in a component.
- Never use `useEffect` to load Supabase data — add a hook.
- Add keys to `queryKeys` before writing hooks.
- After server-action mutations, invalidate related query keys.

### Writes

- Prefer Server Actions with `requireRoleForAction`.
- Use `revalidatePath` for server-rendered pages.

## TypeScript

- Import from `@/types`: `Profile`, `Vehicle`, `UserRole`, etc.
- Do not duplicate enums or row types in feature files.
- Schema change workflow: Drizzle → migration → `database.ts` → `types/index.ts`.

## Supabase

### Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Never bypass RLS from the browser.
- `@supabase/ssr` only; middleware refreshes sessions.

### Auth

- `requireRole([...])` in layouts and sensitive pages.
- `requireRoleForAction` in actions for friendly errors.

## Database

- Drizzle (`src/db/schema.ts`) is schema source of truth.
- Apply: `npm run db:push`
- RLS in `supabase/post-migrations/`
- snake_case columns; PascalCase components; camelCase functions

## UI

### Shared primitives

`Button`, `Input`, `Card`, `Alert`, `EmptyState`, `StatusBadge`, `FormDialog`, `StepWizard`

### Styling

- Tailwind utilities + `globals.css` shared classes
- No inline styles
- Lazy-load heavy charts (`dynamic` + `ChartSkeleton`)

## Performance

- `cache()` on auth helpers — preserve when touching auth
- `loading.tsx` per role workspace
- `Promise.all` for independent server queries
- Dynamic import Recharts in chart wrappers

## CI

Every PR: `npm run lint`, `npm run type-check`, `npm run build`

## MVP constraints — do NOT add

- OCR / AI plate recognition
- Real payment gateways
- Native mobile apps
- Radar hardware APIs

## Change checklist

- [ ] Correct layer (server vs client hook vs action)
- [ ] Types from `@/types`
- [ ] Client reads use React Query
- [ ] Auth guarded where needed
- [ ] Reuses UI primitives
- [ ] Matches `docs/ARCHITECTURE.md`

## Agent configuration

- **Cursor:** `.cursor/rules/`
- **Claude:** `.claude/CLAUDE.md`, skill `nj-safety-driver`
