# Roadmap — What’s built vs what’s missing

This document maps the **national roadmap** (landing page phases + `PROJECT_FEATURES.md`) against the **current web MVP**.

---

## Phase 1 (2025 — “En cours”) — status

| Roadmap item | MVP status | Gap |
|--------------|------------|-----|
| Pilote Libreville | Partial | Web app works; no city/region scoping in data |
| 500 agents enrolled | Partial | Agent self-registration + admin approval ✅; no enrollment quotas or reporting |
| 50 radars integrated | **Missing** | No radar hardware/API; no radar admin module |
| Public driver portal | **Done** | Register, onboarding, documents, vehicles, infractions view |

---

## Product features — built in MVP

- Driver / agent / admin roles with RLS  
- 3-step driver onboarding (skip documents allowed)  
- Admin driver & vehicle verification (approve / reject / message)  
- Agent plate search, infraction filing, check-in tracking events  
- Lightweight vehicle tracking (not GPS hardware)  
- Agent application workflow (`/register/agent`)  
- Gabon-themed UI, light/dark mode, dialog-based forms (in progress)  
- Document uploads with expiry dates  
- Analytics dashboards (Recharts) per role  

---

## Explicitly out of scope (MVP) — still missing

| Capability | Why it matters | Suggested phase |
|------------|----------------|-----------------|
| **OCR / ANPR plate scan** | Agent field speed & accuracy | Phase 2 |
| **Native mobile apps (iOS/Android)** | Agents & drivers in the field | Phase 2 |
| **Real payment gateways** (Mobile Money, cards, Trésor) | End-to-end fine collection | Phase 2 |
| **Radar integration** | Automatic infractions | Phase 1 roadmap / Phase 2 tech |
| **SMS / push notifications** | Driver alerts for infractions & expiry | Phase 2 |
| **2FA / Ministry OTP** | Mentioned on marketing site | Phase 2 |
| **RCCM / national DB interconnection** | Vehicle & owner verification | Phase 2 |
| **PDF quittances (official receipts)** | Legal payment proof | Phase 2 |
| **Predictive AI / national reporting** | Phase 3 vision | Phase 3 |

---

## UX / UI gaps (your latest requests)

| Request | Status |
|---------|--------|
| Gabon flag background on all pages | **Implemented** — global backdrop + glass panels |
| Stronger light/dark with national colors | **Improved** — CSS variables, glass cards, dialog accent stripe |
| All forms in dialogs/popups | **Mostly done** — profile, documents, vehicles, agent search/infraction; onboarding remains full-page wizard (already stepped) |
| Step-based forms for long flows | **Improved** — document upload (3 steps), infraction (3 steps), vehicle register (2 steps); onboarding already 3 steps |
| Richer media upload UX | **Improved** — drag/drop `EvidenceSlot`; more work possible (camera capture, batch upload, progress %) |

---

## Remaining forms not yet in dialogs

- **Onboarding wizard** — intentional full-page multi-step flow  
- **Login / register / setup** — dialog-*styled* panels (not modal triggers)  
- **Admin inline actions** — role changer on agents table (could move to dialog)  
- **Agent register** — full-page dialog card (could add internal steps)  

---

## Operations & quality gaps

- Automated tests (E2E / unit) — minimal or none  
- CI may be blocked by GitHub billing (environment issue)  
- Production `db:push` must be run per Supabase project  
- Email templates / branded notifications — not configured  
- French i18n — marketing FR, app mostly EN  
- Accessibility audit (WCAG) — not done  
- Audit trail / parliamentary reporting — Phase 3  

---

## Recommended next engineering priorities

1. **Payments** — integrate one Mobile Money provider + receipt PDF  
2. **Notifications** — email/SMS on infraction + document expiry  
3. **Mobile** — PWA first, then native shell  
4. **OCR** — plate scan on agent search  
5. **Radar feed** — ingestion API + admin radar dashboard  
6. **i18n** — full French for government staff  

---

## How to read the landing roadmap

The homepage phases (2025 / 2026 / 2027) describe **national rollout**, not only this codebase. The web MVP covers the **driver portal** and **agent/admin workspaces** slice of Phase 1; hardware, payments, and mobile are still roadmap items above.
