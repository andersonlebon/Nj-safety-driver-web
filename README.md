# NJ Safety Driver

A professional MVP web platform for road safety management, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

It provides three role-based workspaces:

- **Driver** — register personal info and vehicles, upload documents, view infractions and payment status.
- **Agent** — search vehicles by plate number, review driver/vehicle records, file infractions with evidence, update payment status.
- **Admin** — system-wide oversight of drivers, agents, vehicles, and infractions, with summary statistics.

## Tech stack

- [Next.js 14 App Router](https://nextjs.org/docs/app) with TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) — Auth, Postgres database, Storage
- [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) for cookie-based session management
- [Lucide React](https://lucide.dev/) icons
- Ready for [Vercel](https://vercel.com/) deployment

## Project structure

```
src/
├── app/
│   ├── (auth)/                # Login & register pages
│   ├── admin/                 # Admin dashboard
│   ├── agent/                 # Agent dashboard
│   ├── driver/                # Driver dashboard
│   ├── auth/signout/          # POST handler to sign out
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Public landing page
├── components/
│   ├── dashboard/             # Sidebar, Topbar, StatCard, PageHeader
│   └── ui/                    # Button, Input, Card, EmptyState, etc.
├── lib/
│   ├── supabase/              # client / server / middleware helpers
│   ├── types/database.ts      # Strongly-typed Database schema
│   ├── auth.ts                # requireRole, getCurrentProfile
│   └── utils.ts
└── middleware.ts              # Refresh sessions + route protection
supabase/
└── schema.sql                 # Tables, RLS policies, storage buckets
```

## Local development

### 1. Prerequisites

- Node.js 18.17+ (Node 20 recommended)
- A free [Supabase](https://supabase.com/) project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Optional, for privileged server-side scripts only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values under **Project Settings → API** in the Supabase dashboard.

### 4. Apply the database schema

Open the **SQL Editor** in your Supabase project and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), then run it.

This will create:

- enums: `user_role`, `payment_status`, `document_type`
- tables: `profiles`, `vehicles`, `documents`, `infractions`
- a trigger that auto-creates a `profiles` row when a new auth user signs up
- row-level security policies for all tables
- two storage buckets (`documents`, `evidence`) and matching access policies

### 5. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication → Providers** and ensure **Email** is enabled.
2. Under **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (use your production domain in prod).
   - Add `http://localhost:3000/**` (and your prod domain) to the redirect allow list.
3. For development, you may want to disable "Confirm email" so newly registered drivers can sign in immediately.

### 6. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 7. Create your first admin

1. Register a regular account at `/register` (this creates a `driver` profile).
2. In the Supabase SQL Editor, promote the user to admin:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

3. Sign in again — you will be routed to `/admin`.

To promote agents:

```sql
update public.profiles set role = 'agent' where email = 'agent@example.com';
```

## Roles & access control

| Route          | driver | agent | admin |
| -------------- | :----: | :---: | :---: |
| `/driver/*`    |   ✓    |       |   ✓   |
| `/agent/*`     |        |   ✓   |   ✓   |
| `/admin/*`     |        |       |   ✓   |

Routes are protected by middleware **and** by server-side `requireRole` checks. The Postgres RLS policies in `supabase/schema.sql` enforce data access at the database layer (drivers see only their own records; agents/admins can search across the system).

## Storage buckets

| Bucket      | Used for                                          | Access                                     |
| ----------- | ------------------------------------------------- | ------------------------------------------ |
| `documents` | Identity, license, insurance, inspection uploads  | Owner uploads to `<userId>/...`; staff can read all |
| `evidence`  | Infraction photos uploaded by agents              | Only agents/admins write; drivers can read |

Files are private; the app generates short-lived signed URLs for downloads.

## Available scripts

- `npm run dev` — start the local dev server
- `npm run build` — build for production
- `npm start` — run the production build
- `npm run lint` — lint the codebase
- `npm run type-check` — run TypeScript without emitting

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **New Project** and import the repo.
3. Add the same environment variables as in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel production URL)
   - *(optional)* `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Vercel will build with `npm run build` automatically.
5. Back in Supabase, update **Auth → URL Configuration** to include your production domain in the Site URL and redirect URL allow list.

## Development workflow

This repo uses two long-lived branches:

| Branch | Purpose                          | Vercel environment |
| ------ | -------------------------------- | ------------------ |
| `main` | Production-ready code            | Production         |
| `dev`  | Active development & integration | Preview / staging  |

Recommended flow:

1. Create a feature branch off `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feat/short-description
   ```
2. Commit your work, push, and open a PR **into `dev`**.
3. Once `dev` is stable and green in CI, open a PR from `dev` → `main` to release.

### Environment files

- `.env.example` — reference template (committed).
- `.env.development.example` — copy this to `.env.local` for local dev pointing at a **dev Supabase project**.
- `.env.local` — your real local secrets (git-ignored).

> **Tip:** create a **separate Supabase project** for development so experimental schema changes or test data never touch production.

### Continuous integration

GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) runs on every push and pull request to `main` and `dev`:

- `npm run lint`
- `npm run type-check`
- `npm run build`

The workflow uses stub Supabase env vars at build time so it works without secrets configured.

### Vercel preview deployments

After importing the repo on Vercel:

- **Production branch:** `main` → maps to your production domain.
- **Preview deployments:** every push to `dev` (and every PR) gets its own preview URL.
- Set environment variables **per environment** in Vercel: use your dev Supabase keys for the Preview environment and prod keys for Production.

## MVP scope (intentionally limited)

This MVP **does not** include:

- OCR for documents
- AI license plate recognition
- A native mobile app
- Real payment gateway integration

Payments are tracked manually using three statuses — `unpaid`, `pending`, `paid` — which agents and admins can update from the dashboard.

## License

Internal MVP project. All rights reserved.
