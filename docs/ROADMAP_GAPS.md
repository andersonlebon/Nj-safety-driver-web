# Roadmap — What’s built vs what’s missing

Maps the **national roadmap** (landing page phases + `PROJECT_FEATURES.md`) against the **current web MVP**.

---

## Phase 1 (2025 — “En cours”) — status

| Roadmap item | MVP status | Gap |
|--------------|------------|-----|
| Pilote Libreville | Partial | Web app works; no city/region scoping in data |
| 500 agents enrolled | Partial | Agent self-registration + admin approval ✅; no enrollment quotas |
| 50 radars integrated | **Missing** | No radar hardware/API; no radar admin module |
| Public driver portal | **Done** | Register, onboarding, documents, vehicles, infractions view |
| Border / foreign vehicles | **Done (MVP)** | Country on plate, agent border registration, transit without local owner |

---

## Recent product delivery (web MVP)

| Feature | Status |
|---------|--------|
| Sign out → home page | **Done** |
| Agent self-register + admin approval | **Done** |
| Gabon flag watermark background | **Done** |
| Light / dark theme toggle | **Done** (fixed next-themes crash) |
| Dialog + step forms (upload, infraction, vehicle) | **Done** |
| Admin drivers — read-only table + detail modal | **Done** |
| Admin vehicles — read-only table + detail modal | **Done** |
| Vehicle detail modal + `/driver/vehicles/[id]` | **Done** |
| Foreign / border vehicles + country badges | **Done** |
| Agent border registration (`/agent/border`) | **Done** |
| Camera capture + plate scan UX | **Done** (manual confirm; OCR stub) |
| Driver/vehicle/admin verification workflows | **Done** |
| Lightweight vehicle tracking | **Done** |

---

## UX / UI — remaining polish (non-blocking)

| Item | Status |
|------|--------|
| Onboarding | Full-page 3-step wizard (intentional) |
| Login / register / setup | Dialog-styled panels on flag backdrop |
| Admin agents table | Inline role changer (could move to modal) |
| Real plate OCR / ANPR | **Phase 2** — `lib/plate-scan.ts` stub only |

---

## Explicitly out of scope (Phase 2+)

| Capability | Phase |
|------------|-------|
| OCR / ANPR (production AI) | Phase 2 |
| Native mobile apps | Phase 2 |
| Real payment gateways (Mobile Money, Trésor) | Phase 2 |
| Radar integration | Phase 1 national / Phase 2 tech |
| SMS / push notifications | Phase 2 |
| 2FA / Ministry OTP | Phase 2 |
| RCCM / national DB interconnection | Phase 2 |
| PDF quittances | Phase 2 |
| Predictive AI / parliamentary reporting | Phase 3 |

---

## Operations

| Item | Status |
|------|--------|
| Automated E2E tests | Minimal |
| CI | May fail on GitHub billing (account issue) |
| Production DB | Run `npm run db:push` per Supabase project |
| French i18n | Marketing FR; app mostly EN |

---

## Recommended next engineering priorities

1. Production plate OCR (on-device or API)
2. Mobile Money + PDF receipts
3. SMS/email on infraction + document expiry
4. PWA / native mobile shell
5. Radar ingestion API + admin dashboard
6. Full French UI for government staff
