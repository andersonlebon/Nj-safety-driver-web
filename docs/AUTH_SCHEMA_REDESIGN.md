# Auth & Schema Redesign

## Overview

This document defines the revised authentication structure and database schema for NJ Safety. The goal is a single, unified identity per person that can accumulate multiple roles over time — rather than multiple disconnected profile records.

---

## Core Model

```
auth.users (Supabase built-in)
    └── public.profiles            ← ONE per auth user
            ├── profile_types[]    ← array: ['driver'], ['agent','admin'], etc.
            ├── driver_profile     ← ONE row, linked by profile_id
            ├── agent_profile      ← ONE row, linked by profile_id
            └── admin_profile      ← ONE row, linked by profile_id
```

A person is always one `auth.user` → one `profile`. The roles they play are tracked in the `profile_types` array on that single profile. The type-specific data (license info, badge number, etc.) lives in a separate type table that holds exactly one row per profile.

---

## Database Schema

### `public.profiles`

The central identity record. Created automatically on first sign-up.

```sql
CREATE TABLE public.profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text,
  phone          text,
  national_id    text UNIQUE,
  email          text NOT NULL,
  profile_types  user_role[] NOT NULL DEFAULT '{}',  -- e.g. '{driver,agent}'
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

**Rules:**
- `id` equals the Supabase `auth.uid()` — no surrogate key needed.
- `profile_types` is the authoritative list of roles this person holds.
- A profile with an empty `profile_types` array is a new user who has not yet registered for any role.

---

### `public.driver_profiles`

Role-specific data for drivers. At most one row per profile.

```sql
CREATE TABLE public.driver_profiles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_license    text UNIQUE,
  address           text,
  license_expiry    date,
  verified          boolean NOT NULL DEFAULT false,
  verified_at       timestamptz,
  verified_by       uuid REFERENCES public.admin_profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.agent_profiles`

Role-specific data for traffic agents. At most one row per profile.

```sql
CREATE TABLE public.agent_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_number    text UNIQUE,
  zone            text,
  active          boolean NOT NULL DEFAULT true,
  promoted_at     timestamptz,               -- set when promoted to admin
  promoted_by     uuid REFERENCES public.admin_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.admin_profiles`

Role-specific data for administrators. At most one row per profile. Cannot be self-created — only created via promotion or the bootstrap setup flow.

```sql
CREATE TABLE public.admin_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoted_by     uuid REFERENCES public.admin_profiles(id),  -- null = bootstrap admin
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.infractions`

Created by an agent against a driver. Both actor IDs are required.

```sql
CREATE TABLE public.infractions (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_profile_id uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE RESTRICT,
  agent_profile_id  uuid NOT NULL REFERENCES public.agent_profiles(id)  ON DELETE RESTRICT,
  vehicle_id        uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  plate_number      text NOT NULL,
  infraction_type   text NOT NULL,
  description       text,
  location          text,
  fine_amount       numeric(10,2) NOT NULL DEFAULT 0,
  status            payment_status NOT NULL DEFAULT 'unpaid',
  evidence_path     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.vehicles`

Owned by a driver profile (not a raw auth user).

```sql
CREATE TABLE public.vehicles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_profile_id uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  plate_number    text NOT NULL UNIQUE,
  brand           text,
  model           text,
  color           text,
  year            integer,
  insurance_status  boolean NOT NULL DEFAULT false,
  inspection_status boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.documents`

Documents are attached to a profile and tagged with the context role they belong to.

```sql
CREATE TABLE public.documents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_type    user_role NOT NULL,   -- which role context this doc belongs to
  doc_type        document_type NOT NULL,
  file_path       text NOT NULL,
  file_name       text,
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);
```

---

## Auth Flow

### 1. Login (all roles — single entry point)

```
/login  →  Supabase email/password auth
         →  on success: redirect to /profile
```

There is **one login page** for everyone. No role-specific login URLs.

---

### 2. Profile Selection Page (`/profile`)

After login the user lands on `/profile`. This page reads their `profile_types` array and renders accordingly:

| Condition | What the page shows |
|-----------|---------------------|
| Has one type | Single card; clicking it enters that role's dashboard |
| Has multiple types | One card per type; user picks which context to enter |
| Has no types | No role cards. Shows registration buttons for **driver** and **agent** only. No admin registration option is available on this page. |

The selected role is stored in a short-lived server-side cookie (`active_role`) scoped to the session. All subsequent requests read this cookie to determine which dashboard, data scope, and navigation to render.

```
/profile
  ├── [has driver]  →  Driver card  →  /driver/dashboard
  ├── [has agent]   →  Agent card   →  /agent/dashboard
  ├── [has admin]   →  Admin card   →  /admin/dashboard
  └── [no types]    →  Register as Driver | Register as Agent
```

---

### 3. Role Registration

Drivers and agents self-register by filling in a form that creates the type-specific row and appends the role to `profile_types`.

```
/register/driver  →  insert into driver_profiles  →  append 'driver' to profile.profile_types
/register/agent   →  insert into agent_profiles   →  append 'agent'  to profile.profile_types
```

There is **no `/register/admin` route**. Admin accounts are created only through:
1. The one-time bootstrap setup at `/setup` (first deploy only).
2. Admin promotion of an existing agent (see below).

---

### 4. Agent Promotion to Admin

An admin can promote an agent. This action does **not** remove the agent role — it adds admin on top.

**Steps performed server-side (admin action):**

```ts
// 1. Verify caller is an admin
// 2. Check target profile has 'agent' in profile_types
// 3. Check no existing admin_profiles row for this profile_id
// 4. Insert into admin_profiles
// 5. Append 'admin' to profile.profile_types
// 6. Set agent_profiles.promoted_at and agent_profiles.promoted_by
```

After promotion the target user will see both an Agent card and an Admin card on `/profile`. Their agent data and history are untouched.

**Result:**
```
profile.profile_types = ['agent', 'admin']
agent_profiles row    ← unchanged, promoted_at set
admin_profiles row    ← newly created
```

---

### 5. Session Context

The `active_role` cookie tells the server which role context is active for the current session. Middleware enforces that the active role is present in the user's `profile_types` — if not (e.g., cookie is tampered), the user is redirected to `/profile` to re-select.

```
Cookie: active_role = 'agent'

Middleware check:
  profile.profile_types.includes(active_role) → pass
  else → redirect /profile
```

---

## Ownership Relationships

Who creates / owns each entity:

| Table | Created by | Key FK columns |
|-------|-----------|----------------|
| `profiles` | Auth trigger (auto) | `id = auth.uid()` |
| `driver_profiles` | Driver (self-register) | `profile_id` |
| `agent_profiles` | Agent (self-register) | `profile_id` |
| `admin_profiles` | Admin (promotion / bootstrap) | `profile_id`, `promoted_by` |
| `vehicles` | Driver | `driver_profile_id` |
| `infractions` | Agent | `driver_profile_id`, `agent_profile_id` (both required) |
| `documents` | Profile owner | `profile_id`, `profile_type` |

---

## RLS Policy Approach

Each table enforces access based on `auth.uid()` resolved through `profiles.id`.

**Helper function (define once):**

```sql
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(role user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT profile_types @> ARRAY[role]
  FROM public.profiles WHERE id = auth.uid()
$$;
```

**Example policies:**

```sql
-- Profiles: owner reads own, admin reads all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT USING (public.has_role('admin'));

-- Infractions: driver reads own, agent reads created-by-self, admin reads all
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infractions_driver" ON public.infractions
  FOR SELECT USING (
    driver_profile_id IN (
      SELECT id FROM public.driver_profiles WHERE profile_id = auth.uid()
    )
  );
CREATE POLICY "infractions_agent" ON public.infractions
  FOR SELECT USING (
    agent_profile_id IN (
      SELECT id FROM public.agent_profiles WHERE profile_id = auth.uid()
    )
  );
CREATE POLICY "infractions_admin" ON public.infractions
  FOR ALL USING (public.has_role('admin'));
```

---

## Type Reference

```ts
// Canonical TypeScript shape
type ProfileType = 'driver' | 'agent' | 'admin'

interface Profile {
  id: string                  // = auth.uid()
  full_name: string | null
  phone: string | null
  national_id: string | null
  email: string
  profile_types: ProfileType[]
  created_at: string
  updated_at: string
}

interface DriverProfile {
  id: string
  profile_id: string          // FK → profiles.id
  driver_license: string | null
  address: string | null
  license_expiry: string | null
  verified: boolean
  verified_at: string | null
  verified_by: string | null  // FK → admin_profiles.id
}

interface AgentProfile {
  id: string
  profile_id: string
  badge_number: string | null
  zone: string | null
  active: boolean
  promoted_at: string | null
  promoted_by: string | null  // FK → admin_profiles.id
}

interface AdminProfile {
  id: string
  profile_id: string
  promoted_by: string | null  // null = bootstrap admin
}
```

---

## What Changes from Current Schema

| Current | New |
|---------|-----|
| `profiles.role` (single enum) | `profiles.profile_types` (array of enums) |
| `user_profile_links` junction table | Removed — array on profile is the source of truth |
| `profiles` has driver-specific columns (`driver_license`, `address`) | Moved to `driver_profiles` |
| `infractions.driver_id → profiles.id` | `infractions.driver_profile_id → driver_profiles.id` |
| `infractions.agent_id → profiles.id` | `infractions.agent_profile_id → agent_profiles.id` |
| `vehicles.owner_id → profiles.id` | `vehicles.driver_profile_id → driver_profiles.id` |
| Multiple login flows / entry points | Single `/login` → `/profile` |
| Admin created via `/setup` form only | Admin created via bootstrap OR promotion action |
