# NJ Safety Driver — MVP Architecture

## Goals
- Deliver a lean, role-based web MVP (Driver / Agent / Admin)
- Keep costs low (Supabase + Vercel)
- Enforce security at the database layer (RLS)
- Keep the codebase maintainable with strict TypeScript + shared UI primitives

## Stack
- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS (brand palette + shared classes)
- Supabase: Auth, Postgres, Storage
- `@supabase/ssr` for cookie-based sessions
- Deployed on Vercel

## High-level architecture
Browser → Next.js App (Vercel) → Supabase (Auth / Postgres / Storage)

### Key principles
- Prefer Server Components for data fetching.
- Use Client Components only for forms / uploads / interactions.
- Never bypass RLS. No service role key in client code.

## App structure (expected)
```
src/
  app/
    (auth)/login
    (auth)/register
    driver/*
    agent/*
    admin/*
  components/
    ui/*
    dashboard/*
  lib/
    auth.ts
    supabase/{client,server,middleware}.ts
    types/database.ts
supabase/
  migrations/
  schema.sql (minimal / notes only)
```

## Data model
- `profiles` (role: driver | agent | admin)
- `vehicles`
- `documents`
- `infractions`
- `payments` (manual status tracking in MVP)

## Auth & authorization
- Supabase Auth for sessions
- Route protection via `src/middleware.ts`
- Server-side checks via `requireRole([...])`

## Storage
- Bucket: `documents` (owner write; staff read)
- Bucket: `evidence` (agent/admin write; all roles read)

## Database migrations
- Drizzle ORM is used for schema generation only.
- RLS policies and storage policies remain SQL migrations.

## Environments
- `nj-safety-driver-dev` Supabase project for development
- Vercel Preview for `dev` branch
- Vercel Production for `main` branch
