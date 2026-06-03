# NJ Safety Driver — Project Features & Activities

Road safety management platform for Gabon. Web MVP built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, Postgres, Storage).

---

## User roles

| Role | Access |
|------|--------|
| **Driver** | Personal profile, vehicles, documents, infractions, payments |
| **Agent** | Search vehicles, create infractions, upload evidence |
| **Admin** | Full oversight, verification, statistics, role management |

---

## Public & authentication

- **Landing page** — Gabon-themed marketing site with driver/agent entry points
- **Login / Register** — Supabase Auth; new users default to **driver** role
- **Agent application (`/register/agent`)** — Self-service signup; profile stays **pending** until an admin approves; approved users get **agent** role
- **Sign out** — Returns to the public home page (`/`)
- **First-time setup (`/setup`)** — One-time bootstrap to create the first **admin** (locks after an admin exists)
- **Dark / light theme** — Toggle on all navbars; preference persisted locally

---

## Driver onboarding (3 steps)

1. **Personal information** — Name, phone, national ID, license, address  
2. **Personal documents** — ID & license photos (can **Skip for now**)  
3. **First vehicle** — Plate, brand, model, color, insurance/inspection + optional evidence  

**Skip behaviour:** Drivers can finish without uploading documents. The profile is **not fully active** until documents are submitted and an admin approves.

**Verification statuses (profile):**

| Status | Meaning |
|--------|---------|
| `pending_documents` | Missing uploads or not yet submitted for review |
| `pending_review` | Submitted; waiting for admin |
| `active` | Approved — full active profile |
| `rejected` | Admin rejected; driver sees instructions |

---

## Driver dashboard

- **Status banner** — Shows verification state, admin messages, and **Submit for verification** button
- **Overview** — KPIs, fines chart, payment donut, compliance score
- **Personal info** — Edit profile fields
- **Vehicles** — Card grid with **photo preview**, country badge, verification badge; click card for **detail modal** or full page; **Add vehicle** with country + plate scan/camera
- **Documents** — Upload with **expiration date**; grouped list with expiry warnings; submit for admin review
- **Infractions / Payments** — View fines and payment status (manual tracking: unpaid / paid / pending)

---

## Document management

- Storage bucket: `documents` (private, user-scoped paths)
- Types: identity, driver license, insurance, inspection, vehicle photo, registration, other
- **Expiration dates** on every upload — UI warns when expired or expiring within 30 days
- Replace / delete from the documents page

---

## Agent dashboard

- **Application** — Register at `/register/agent`; pending applicants see `/register/agent/pending` until approved
- **Search / scan** by plate + **country** — camera capture (confirm manually; OCR Phase 2), view driver & vehicle details, **outstanding fines banner**
- **Border transit** (`/agent/border`) — register foreign vehicles at checkpoints
- **Create infraction** — type, description, location, fine, evidence photo
- **Overview analytics** — weekly activity, top infraction types, resolution rate

---

## Admin dashboard

- **Overview analytics** — drivers, agents, vehicles, infractions, fines collected vs outstanding, charts
- **Drivers** — Read-only table; **View details** modal for role change, approve/reject, admin messages
- **Vehicles** — Read-only table with country badge; **View** modal for full details + approve/reject; filters (status + domestic/foreign)
- **Agents** — Review **pending applications** (approve / reject); manage agent accounts and roles
- **Infractions** — System-wide infraction list

Admin actions use **dialog modals** for messages and rejections where appropriate.

---

## Foreign & border vehicles

- **Registration country** on vehicles and infractions (unique plate per country)
- **Foreign / border transit** — agents register vehicles without a local owner; transit driver contact fields
- **Driver nationality** on profiles (`nationality_country`)
- **Country badges** across driver, admin, and agent UIs
- Plate **camera capture** on driver add-vehicle and agent search (manual confirm; AI OCR planned Phase 2)

---

## Database & infrastructure

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Apply schema migrations + RLS/triggers/storage |
| `npm run db:clean` | Wipe dev data (optional `--with-auth`, `--full`) |
| `npm run db:reset` | Clean + push |
| `npm run dev` | Local development |

**Key tables:** `profiles`, `vehicles`, `documents`, `infractions`  
**Security:** Row Level Security on all tables; service role only for `/setup` bootstrap

---

## Typical activities (workflow)

### New driver
1. Register → complete onboarding (with or without documents)
2. Upload documents + set expiry dates on `/driver/documents`
3. Click **Submit for verification**
4. Wait for admin approval → status becomes **Active**

### Admin daily
1. Review **Drivers** with `pending_review` status
2. Open **Vehicles** → filter **Pending** → approve cars with valid photos/papers
3. Send **required action** messages (e.g. “Renew blurry license photo”)
4. Monitor **Overview** charts for infraction trends

### Agent in the field
1. Search plate → confirm driver/vehicle
2. Record infraction + upload evidence
3. Update payment status when fine is paid

---

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL` (for `db:push`)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, `/setup`)

---

## Vehicle tracking (lightweight)

Real-time GPS/telematics is **not** in the MVP (no hardware). Instead, the platform builds a **location & activity history** from events already in the system:

| Event type | Source |
|------------|--------|
| `registration` | Vehicle registered (onboarding or dashboard) |
| `infraction` | Agent files infraction with location |
| `agent_checkin` | Agent logs a manual check-in on plate search |
| `verification` | Admin approves/rejects (future) |

**Who sees what:**
- **Admin** → `/admin/tracking` — all vehicles, last known location, full timeline
- **Agent** → plate search shows timeline + **Log check-in** dialog
- **Driver** → vehicle cards show **Last seen** location when available

Locations link to Google Maps when clicked. Existing infractions are backfilled into tracking on `db:push`.

---

## Out of scope (MVP)

- **AI plate OCR** (camera capture works; recognition stub in `lib/plate-scan.ts`)
- Mobile app
- Real payment gateway (Airtel Money, etc.)
- Radar hardware integration

These are planned in later roadmap phases.
