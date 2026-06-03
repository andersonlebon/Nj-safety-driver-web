# NJ Safety Driver — Current State Report

*Generated: 2026-06-03. Reflects the repository as checked out on branch `feat/gabon-ux-dialog-forms` with local uncommitted work.*

---

## 1. Executive summary

**NJ Safety Driver** is a web MVP for Gabon national road-safety management: drivers register and manage profiles/vehicles/documents; field agents search plates, file infractions, and log check-ins; admins verify accounts, oversee the fleet, and view analytics.

| Area | Choice |
|------|--------|
| Framework | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS, Lucide icons, `next-themes` (light/dark) |
| Backend | Supabase — Auth, Postgres, Storage (private buckets) |
| ORM / schema | Drizzle (`src/db/schema.ts`) + SQL under `supabase/migrations/` |
| Charts | Recharts (`LineChartCard`, `BarChartCard`, `DonutChartCard`, `ScoreGauge`) |
| Deploy target | Vercel (documented in `README.md`) |

**Deployment branches** (from `README.md`):

| Branch | Role | Vercel |
|--------|------|--------|
| `main` | Production-ready releases | Production |
| `dev` | Integration / staging | Preview |
| `feat/*` | Short-lived feature work → PR into `dev` | PR previews |

Flow: feature branch → PR to `dev` → when stable, PR `dev` → `main`.

---

## 2. Git / release status

### Current checkout

| Item | Value |
|------|--------|
| **Branch** | `feat/gabon-ux-dialog-forms` (tracks `origin/feat/gabon-ux-dialog-forms`) |
| **HEAD** | `c4ddefc` — *fix(css): use valid Tailwind opacity on landing-hero dark bg* |
| **Ahead of `dev`** | 8 commits (Gabon backdrop, glass UI, dialog/step forms, theme fixes) |
| **Uncommitted work** | Yes — see [Local WIP](#local-wip-not-yet-committed) |

### Remote branches (after `git fetch`)

| Branch | Tip | Notes |
|--------|-----|--------|
| `origin/main` | `f1cd4cf` | **Merge PR #9** — *Release: agent registration, verification, and tracking* (2026-05-25) |
| `origin/dev` | `bd1172c` | **Merge PR #8** — agent registration + verification + tracking feature branch |
| `origin/feat/gabon-ux-dialog-forms` | `c4ddefc` | Matches local HEAD; Gabon UX PR not merged to `dev` yet |

`origin/main` is **2 commits ahead** of `origin/dev` (release merge metadata on `main` only). All feature code through PR #8 lives on both; production `main` includes the PR #9 release merge.

**Local `main` is stale** (`667b741`, 10 commits behind `origin/main`). Run `git checkout main && git pull` before comparing locally.

### Recent merged releases

| PR | Title | Target | Status |
|----|--------|--------|--------|
| [#9](https://github.com/andersonlebon/nj-safety-driver/pull/9) | Release: agent registration, verification, and tracking | `dev` → `main` | **Merged** (2026-05-25) |
| [#8](https://github.com/andersonlebon/nj-safety-driver/pull/8) | feat: agent registration, verification, and vehicle tracking | → `dev` | **Merged** |
| [#7](https://github.com/andersonlebon/nj-safety-driver/pull/7) | fix(ux): friendly user-facing errors | → `dev` | **Merged** |
| [#6](https://github.com/andersonlebon/nj-safety-driver/pull/6) | release: ship gabon-theme iteration to production | `dev` → `main` | **Merged** |

### Open pull requests

| PR | Title | Base | Head |
|----|--------|------|------|
| [#10](https://github.com/andersonlebon/nj-safety-driver/pull/10) | feat(ui): Gabon backdrop, glass theme, and dialog step forms | `dev` | `feat/gabon-ux-dialog-forms` |
| [#2](https://github.com/andersonlebon/nj-safety-driver/pull/2) | test: add QA testing strategy and roadmap docs | (docs only) | `feat/testing-strategy-docs` |

**PR #10** is open and contains the 8 Gabon UX commits on the current branch. It does **not** include the local uncommitted foreign-vehicle / border / camera work.

### Local WIP (not yet committed)

Uncommitted changes on `feat/gabon-ux-dialog-forms` extend beyond PR #10:

- **Schema / DB:** `0006_foreign_vehicles.sql`, `03_foreign_vehicles_rls.sql`, Drizzle schema + types, journal snapshot
- **Agent:** `/agent/border` page + `BorderRegisterDialog` (2-step wizard)
- **Admin:** `AdminDriversTable`, `AdminVehiclesTable`; driver/vehicle page refactors
- **Driver:** `/driver/vehicles/[id]` detail page; vehicle list/form updates
- **UI:** `CameraCapture`, `PlateScanField`, `CountryBadge`, `VehicleDetailModal` / `VehicleDetailContent`
- **Libs:** `lib/countries.ts`, `lib/vehicles.ts`, `lib/plate-scan.ts` (OCR stub)
- **Docs:** `docs/PROJECT_FEATURES.md` updates

Treat this block as **in-progress** until committed and migrated on target Supabase projects.

---

## 3. Roles & access

Three roles in Postgres enum `user_role`: `driver`, `agent`, `admin`.

### Enforcement layers

1. **Middleware** (`src/middleware.ts` → `src/lib/supabase/middleware.ts`) — session refresh; redirects unauthenticated users from `/driver`, `/agent`, `/admin`, `/onboarding` to `/login`; redirects authenticated users on `/login` / `/register` to `/{role}`; pending agent applicants → `/register/agent/pending`.
2. **Server layouts** — `requireRole([...])` in each workspace layout (`src/lib/auth.ts`).
3. **RLS** — `supabase/post-migrations/01_rls_triggers_storage.sql` (+ `02_*`, `03_*` when applied).

Privileged roles are **not** taken from signup metadata; new users always get `driver`. Admin is created once via `/setup` (service role). Staff promotion is admin UI only.

### Route access matrix

| Route prefix | driver | agent | admin |
|--------------|:------:|:-----:|:-----:|
| `/driver/*` | ✓ | | ✓ |
| `/agent/*` | | ✓ | ✓ |
| `/admin/*` | | | ✓ |
| `/onboarding` | ✓ (drivers without `onboarded_at`) | redirected | redirected |

### Role flows (summary)

**Driver**

1. Register at `/register` → default `driver`.
2. If `onboarded_at` is null → `/onboarding` (3-step wizard).
3. Upload documents, add vehicles, submit for verification.
4. Admin approves → `verification_status = active` → full dashboard.

**Agent**

1. Apply at `/register/agent` → `agent_application_status = pending`, stays on `/register/agent/pending`.
2. Admin approves on `/admin/agents` → role `agent`.
3. Plate search, infractions, check-ins, (WIP) border transit.

**Admin**

1. One-time `/setup` with `SUPABASE_SERVICE_ROLE_KEY` (locks when any admin exists).
2. Verify drivers/vehicles, manage agents, view tracking and analytics.

**Sign out:** `POST /auth/signout` → home `/`.

---

## 4. Features implemented (with routes)

Routes below exist as `page.tsx` under `src/app/`. Features marked **(WIP)** are present only in the working tree, not in `origin/dev` or PR #10 commits.

### Public & auth

| Route | Feature |
|-------|---------|
| `/` | Gabon-themed marketing landing (French copy, roadmap phases, stats) |
| `/login` | Email auth; `AuthDialogCard` panel |
| `/register` | Driver signup |
| `/register/agent` | Agent self-service application |
| `/register/agent/pending` | Waiting state until admin approval |
| `/setup` | One-time first admin bootstrap (service role) |
| `/auth/signout` | POST sign-out handler |

### Driver workspace

| Route | Feature |
|-------|---------|
| `/onboarding` | 3-step wizard: profile → documents (skippable) → first vehicle |
| `/driver` | Overview KPIs, fines chart, payment donut, compliance gauge |
| `/driver/profile` | View profile; **edit via `ProfileEditDialog`** |
| `/driver/vehicles` | Vehicle cards; add via **`VehicleForm`** (2-step dialog on feat branch); **(WIP)** detail modal/page, country + camera |
| `/driver/vehicles/[id]` | **(WIP)** Full vehicle detail page |
| `/driver/documents` | Grouped uploads, expiry warnings; **`DocumentUploadDialog`** (3 steps) |
| `/driver/infractions` | List fines for owned vehicles |
| `/driver/payments` | Payment status summary |

Driver layout enforces onboarding and pending-agent redirects (`src/app/driver/layout.tsx`). **`DriverStatusBanner`** shows verification state and submit-for-review action.

### Agent workspace

| Route | Feature |
|-------|---------|
| `/agent` | Overview analytics (weekly activity, top types, resolution) |
| `/agent/search` | Plate lookup → driver/vehicle details, fines banner, timeline, **`LogVehicleCheckIn`** dialog; search via **`SearchPlateDialog`** |
| `/agent/border` | **(WIP)** Foreign/border vehicle registration — **`BorderRegisterDialog`** (2 steps) |
| `/agent/infractions` | Agent’s filed infractions list |
| — | **`CreateInfractionDialog`** on search results (3-step wizard + evidence) |

On **`origin/dev` / `main`:** search dialog is plate-only (no country/camera). Country + camera are **(WIP)** in working tree.

### Admin workspace

| Route | Feature |
|-------|---------|
| `/admin` | System analytics (drivers, agents, vehicles, infractions, fines) |
| `/admin/drivers` | Driver list; verification via **`DriverVerificationPanel`** (dialogs) |
| `/admin/vehicles` | Vehicle list; approve/reject; **(WIP)** table component + country filters |
| `/admin/tracking` | All vehicles — last location + event timeline (maps links) |
| `/admin/agents` | Pending applications; **`RoleChanger`** for staff roles |
| `/admin/infractions` | System-wide infraction list |

### Cross-cutting (on `feat/gabon-ux-dialog-forms` / PR #10)

| Capability | Implementation |
|------------|----------------|
| **Theme** | `ThemeProvider` + `ThemeToggle`; Gabon tricolor **`GabonBackdrop`** (PNG watermark, glass panels) |
| **Dialogs / steps** | `FormDialog`, `StepWizard`, `StepWizardFooter`; stepped uploads, infractions, vehicles |
| **Analytics** | Recharts on `/driver`, `/agent`, `/admin` overview pages |
| **Tracking** | `vehicle_tracking_events` — registration, infraction, `agent_checkin`, `verification`, `note` |
| **Friendly errors** | Server actions map Postgres/Supabase errors to user messages (PR #7) |

### Not implemented (do not claim)

- Real payment gateways, radar hardware/API, native mobile apps, working plate OCR, SMS/push, 2FA, RCCM/national DB links, PDF quittances, predictive AI.

---

## 5. Database

### Key tables (Drizzle / Postgres)

| Table | Purpose |
|-------|---------|
| `profiles` | User role, identity, verification, agent application, **(WIP)** `nationality_country` |
| `vehicles` | Plate, owner, insurance/inspection flags, verification; **(WIP)** country, foreign/border transit fields, nullable `owner_id` |
| `documents` | Private storage paths, `doc_type`, optional `vehicle_id`, `expires_at`, verification |
| `infractions` | Plate, fines, `payment_status`, evidence path, agent/driver links; **(WIP)** `registration_country` |
| `vehicle_tracking_events` | Timeline for lightweight “tracking” (not GPS hardware) |

### Enums (high level)

`user_role`, `payment_status`, `document_type`, `verification_status`, `tracking_event_type`, `agent_application_status`.

### Migrations (`supabase/migrations/*.sql`)

Applied in **filename sort order** by `npm run db:push` (not only Drizzle journal entries).

| File | Purpose |
|------|---------|
| `0000_deep_star_brand.sql` | Core enums, `profiles`, `vehicles`, `documents`, `infractions` |
| `0001_add_onboarded_at.sql` | `profiles.onboarded_at` |
| `0001_bumpy_killmonger.sql` | Verification + tracking enums, document type extensions, agent application (generated; **untracked** in git until committed) |
| `0002_documents_evidence.sql` | Onboarding evidence columns on `documents` |
| `0003_verification_expiry.sql` | Profile/vehicle/document verification + expiry |
| `0004_vehicle_tracking.sql` | `vehicle_tracking_events` + backfill hooks |
| `0005_agent_application.sql` | Agent application columns on `profiles` |
| `0006_foreign_vehicles.sql` | **(WIP, uncommitted)** Country + foreign/border columns, nullable vehicle owner |

**Note:** Two files share the `0001_` prefix; sort order runs `0001_add_onboarded_at` before `0001_bumpy_killmonger`.

### Post-migrations (`supabase/post-migrations/`)

| File | Purpose |
|------|---------|
| `01_rls_triggers_storage.sql` | RLS policies, auth trigger, storage buckets `documents` / `evidence` |
| `02_vehicle_tracking_rls.sql` | Tracking table policies + backfill |
| `03_foreign_vehicles_rls.sql` | **(WIP, uncommitted)** RLS for foreign/border vehicles |

### `db:push` behavior

- **Command:** `npm run db:push` → `node --env-file=.env.local scripts/db-push.mjs`
- **Requires:** `DATABASE_URL` in `.env.local` (direct Postgres URI, not the anon key)
- **Why not `drizzle-kit push` alone:** Documented in script — avoids introspection crashes on Supabase; applies generated SQL then idempotent post-migrations.
- **Re-run safe:** Tolerates “already exists” errors.
- **`db:push:tables-only`:** `drizzle-kit push` without post-migrations (avoid for full sync).
- **`db:reset`:** `db:clean --full` + `db:push` (destructive dev reset).

Drizzle journal (`supabase/migrations/meta/_journal.json`) currently lists only `0000` and `0001_bumpy_killmonger`; **`db:push` still applies all `*.sql` files** in the folder.

---

## 6. UX patterns

| Pattern | Where used |
|---------|------------|
| **Dialog forms** | `FormDialog` — profile edit, document upload, plate search, infraction create, vehicle add (feat branch) |
| **Step wizards** | `StepWizard` / `StepWizardFooter` — onboarding (full page, 3 steps), documents (3), infractions (3), vehicle register (2), border register **(WIP, 2)** |
| **Auth panels** | `AuthDialogCard` — login/register styled as centered cards on flag backdrop |
| **Detail modals** | Admin driver verification; **(WIP)** `VehicleDetailModal`, admin tables |
| **Evidence upload** | `EvidenceSlot` drag/drop in upload flows |
| **Camera / plate scan** | **(WIP)** `CameraCapture`, `PlateScanField` — capture image, manual confirm; `suggestPlateFromImage()` in `src/lib/plate-scan.ts` returns `null` (Phase 2 OCR hook) |
| **Gabon UI** | `GabonBackdrop`, brand CSS variables, glass sidebars/cards, flag accent on dialogs |
| **Maps** | Tracking locations link out to Google Maps when coordinates/text present |

**Intentionally full-page:** onboarding wizard, login/register/setup (dialog-*styled*, not modal triggers).

---

## 7. Roadmap alignment

National phases are marketed on `/` (French). Engineering status is detailed in `docs/ROADMAP_GAPS.md`.

### Landing page phases (marketing)

| Phase | Year | Status on site | MVP relevance |
|-------|------|----------------|---------------|
| Phase 1 | 2025 | “En cours” | Libreville pilot, 500 agents, 50 radars, public driver portal |
| Phase 2 | 2026 | “Planifié” | Provincial rollout, RCCM, Trésor/assurances, mobile apps |
| Phase 3 | 2027 | “Vision” | National coverage, predictive AI, parliamentary reporting |

### Phase 1 (2025) — codebase vs roadmap

| Roadmap item | Status |
|--------------|--------|
| Pilote Libreville | **Partial** — app works; no city/region scoping in data |
| 500 agents enrolled | **Partial** — agent apply + admin approve; no quotas/reporting |
| 50 radars integrated | **Missing** — no radar module or API |
| Public driver portal | **Done** — register, onboarding, documents, vehicles, infractions/payments view |

### Product slice on `origin/main` / `dev`

Done or largely done: role-based workspaces, 3-step onboarding, admin verification, agent search/infractions/check-ins, tracking timeline, agent application workflow, document expiry, analytics dashboards, friendly errors.

### On `feat/gabon-ux-dialog-forms` (PR #10, not merged)

Done: Gabon flag backdrop, glass light/dark, dialog + step forms for key flows, `ROADMAP_GAPS.md`.

### Local WIP (uncommitted)

In progress: foreign/border vehicles, country badges, camera capture UI, admin table refactor, plate-scan stub.

---

## 8. Known gaps / Phase 2

From `docs/ROADMAP_GAPS.md`, `README.md`, and code:

| Gap | Notes |
|-----|--------|
| **Payments** | Manual `unpaid` / `pending` / `paid` only; no Mobile Money, cards, Trésor |
| **OCR / ANPR** | `lib/plate-scan.ts` stub; camera UI **(WIP)** still needs manual plate entry |
| **Radar** | No ingestion or admin radar dashboard |
| **Mobile** | Web only; no iOS/Android |
| **i18n** | Landing FR; app UI mostly EN |
| **Notifications** | No SMS/email on infraction or document expiry |
| **2FA / Ministry OTP** | Marketing mention only |
| **RCCM / national DB** | Not connected |
| **PDF quittances** | Not implemented |
| **Tests** | No `*.test.ts` / `*.spec.ts` in repo; PR #2 proposes strategy docs only |
| **CI** | `.github/workflows/ci.yml` — lint, type-check, build on `main`/`dev`; may need GitHub billing/secrets per environment |
| **README drift** | `README.md` still references single `supabase/schema.sql`; production path is `db:push` + migrations |

---

## 9. How to run locally

### Prerequisites

- Node.js 18.17+ (20 recommended)
- Supabase project (separate dev project recommended)

### Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with Supabase API keys + DATABASE_URL
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First admin: [http://localhost:3000/setup](http://localhost:3000/setup) (requires `SUPABASE_SERVICE_ROLE_KEY`).

### Environment variables (`.env.example`)

| Variable | Required for | Notes |
|----------|----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | App + auth | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App + auth | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects | `http://localhost:3000` locally |
| `DATABASE_URL` | `db:push`, `db:studio` | Direct Postgres URI |
| `SUPABASE_SERVICE_ROLE_KEY` | `/setup` only | Server-only; never expose to client |

Optional: `.env.development.example` → copy patterns for a dev Supabase project.

### npm scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:push` | Apply migrations + post-migrations |
| `npm run db:push:tables-only` | Drizzle-kit push only (partial) |
| `npm run db:clean` | Wipe dev data (flags: `--with-auth`, `--full`) |
| `npm run db:reset` | Clean + push |
| `npm run db:generate` | Generate new Drizzle migration |
| `npm run db:studio` | Drizzle Studio |

### Supabase Auth (dashboard)

- Enable Email provider
- Site URL + redirect allow list for localhost (and production domain)
- Optional: disable email confirmation for faster local driver signup

---

## 10. Pre-production checklist

Use before merging to `main` or deploying a Supabase/Vercel environment.

### Database

- [ ] Set `DATABASE_URL` for the **target** Supabase project (prod vs preview)
- [ ] Run `npm run db:push` and confirm no fatal errors
- [ ] If deploying foreign-vehicle WIP: ensure `0006_foreign_vehicles.sql` and `03_foreign_vehicles_rls.sql` are committed and applied
- [ ] Verify storage buckets `documents` and `evidence` exist (post-migration `01_*`)

### Application config

- [ ] Vercel env vars: `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`, optional service role for setup-only routes
- [ ] Supabase Auth URLs match production domain
- [ ] `/setup` already used or intentionally run once per project

### Smoke test paths

| # | Path | Actor | Check |
|---|------|-------|-------|
| 1 | `/` | Public | Landing loads; theme toggle |
| 2 | `/register` → `/onboarding` | New driver | 3 steps; skip documents path |
| 3 | `/driver/documents` | Driver | Upload dialog; expiry display |
| 4 | `/driver` | Driver | Submit for verification; banner states |
| 5 | `/setup` or `/admin/drivers` | Admin | Approve driver; message/reject dialogs |
| 6 | `/admin/vehicles` | Admin | Pending filter; approve vehicle |
| 7 | `/register/agent` → `/admin/agents` | Agent applicant | Pending → approve → agent login |
| 8 | `/agent/search` | Agent | Search plate; view fines; log check-in |
| 9 | `/agent` (infraction dialog) | Agent | 3-step infraction + evidence upload |
| 10 | `/admin/tracking` | Admin | Events + map links |
| 11 | Light/dark | All roles | Readable glass UI on PR #10 branch |
| 12 | **(WIP)** `/agent/border` | Agent | Foreign vehicle 2-step register |

### CI / build

- [ ] `npm run lint && npm run type-check && npm run build` (matches GitHub Actions)
- [ ] Merge PR #10 into `dev` and open `dev` → `main` release PR when staging is green

---

## Related documentation

| Doc | Contents |
|-----|----------|
| `docs/PROJECT_FEATURES.md` | Feature catalog and workflows |
| `docs/ROADMAP_GAPS.md` | MVP vs national roadmap |
| `docs/ARCHITECTURE.md` | System design |
| `README.md` | Onboarding, branches, Vercel (partially outdated on schema) |

---

*For day-to-day feature detail, prefer `docs/PROJECT_FEATURES.md`. This report adds release/git context and WIP boundaries.*
