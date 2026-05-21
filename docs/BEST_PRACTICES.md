# Engineering Best Practices

## Core Principles
- Keep components small and composable.
- Prefer Server Components.
- Use strict TypeScript.
- Avoid `any` unless unavoidable.
- Reuse existing UI primitives.

## Next.js App Router
### Prefer Server Components
Use Server Components for:
- dashboards
- tables
- initial page data
- protected routes

Use Client Components only for:
- forms
- upload interactions
- modals
- local state

## Supabase
### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Never bypass RLS.
- Keep all protected queries server-side when possible.

### Auth
- Use `@supabase/ssr` helpers only.
- Middleware refreshes sessions.
- Server-side role checks via `requireRole`.

## Database
### Drizzle ORM
- Drizzle is the schema source of truth.
- Generate migrations using `drizzle-kit`.
- Keep RLS policies in SQL migration files.

### Naming
- snake_case for database columns
- PascalCase for React components
- camelCase for variables/functions

## UI
### Shared primitives
Always reuse:
- Button
- Input
- Card
- Alert
- EmptyState
- StatusBadge

### Styling
- Use Tailwind utility classes.
- Use shared classes from `globals.css`.
- Avoid inline styles.

## Refactoring Measures
### Avoid duplication
Extract shared logic into:
- `lib/`
- `hooks/`
- shared components

### Route organization
Keep dashboards isolated:
- `/driver/*`
- `/agent/*`
- `/admin/*`

### Data access
- Centralize auth helpers.
- Centralize Supabase helpers.
- Avoid duplicated queries.

### Performance
- Avoid large Client Components.
- Stream server-rendered pages when possible.
- Lazy-load heavy interactive components.

## CI Expectations
Every PR should pass:
- lint
- type-check
- build

## MVP Constraints
Do NOT add:
- OCR
- AI plate recognition
- native mobile apps
- real payment gateway

These belong to future phases only.
