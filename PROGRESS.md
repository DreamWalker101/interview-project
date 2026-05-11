# Sales Pipeline — Build Progress

**Repo:** https://github.com/DreamWalker101/interview-project  
**Live URL:** https://interview-project-rho-lake.vercel.app  
**Supabase project:** `mljfryprzvofhnyxxbfo` (Tokyo)  
**Local project dir:** `/home/ahmed/Desktop/SUPABSE`

---

## Phase 1 — Project Scaffold ✅ COMPLETE

**Goal:** Working Next.js 14 app on Vercel with Supabase connected, all routes stubbed.

### Completed tasks:
- [x] Next.js 14 app initialized with Tailwind CSS (App Router, TypeScript)
- [x] Dependencies installed: `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`
- [x] `lib/supabase.ts` — Supabase browser client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `lib/constants.ts` — exports `BOOKING_TZ = 'America/New_York'` (confirm with client before Phase 3)
- [x] Routes stubbed (placeholder pages, no logic yet):
  - `/` → `app/page.tsx`
  - `/pipeline` → `app/pipeline/page.tsx`
  - `/pipeline/login` → `app/pipeline/login/page.tsx`
  - `/update` → `app/update/page.tsx`
- [x] `.env.local` created with all 4 env vars (gitignored)
- [x] All 4 env vars added to Vercel project settings (persistent across all future deploys)
- [x] Git author email fixed: `ahmed03045215111@gmail.com` — was blocking Vercel auto-deploy
- [x] Deployed to Vercel — all routes load, build passes (`✓ Compiled successfully`)
- [x] GitHub repo connected: pushes auto-deploy via Vercel GitHub integration
- [x] `.claude/` added to `.gitignore`

### Env vars — confirmed in both `.env.local` AND Vercel project:
| Var | Vercel | .env.local |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `NEXT_PUBLIC_ADMIN_USERNAME` | ✅ | ✅ |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ✅ | ✅ |

### Key decisions made:
- **Design system** (`DESIGN (9).md` / Swap style reference) is deferred to Phase 8 (Polish). Build logic and structure first.
- **Stitch screens** are in `/stitch_lead_pipeline_intake_system/` — use as reference during Phase 3–7, not Phase 1–2.
- Admin credentials use `NEXT_PUBLIC_` prefix so they're readable client-side (intentional — no server routes for auth).
- `BOOKING_TZ` hardcoded as `'America/New_York'` — confirm with client before Phase 3 begins.

---

## Phase 2 — Database Setup ✅ COMPLETE

**Goal:** `leads` table live in Supabase with schema below. **ONE table only** — no `blocked_slots` table.

### Completed tasks:
- [x] Migration written: `supabase/migrations/20260512000000_create_leads.sql`
- [x] Pushed via `npx supabase db push` — applied successfully
- [x] Config row seeded (`id = 00000000-0000-0000-0000-000000000001`, `row_type = 'config'`, `blocked_slots = []`)
- [x] RLS disabled (`relrowsecurity = false` confirmed)
- [x] All 14 columns verified against schema spec

### Schema — `leads` (the only table):
```sql
id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
row_type        text        NOT NULL DEFAULT 'lead',   -- 'lead' | 'config'
first_name      text,
last_name       text,
email           text,
phone           text,                                  -- NO unique constraint
notes           text,
employee_range  text,
revenue_range   text,
appointment_at  timestamptz,
pipeline_stage  text,                                  -- null on config row
sold_amount     numeric,
blocked_slots   jsonb       DEFAULT '[]',              -- used only on config row
created_at      timestamptz DEFAULT now()
```


---

## Phase 3 — Customer Landing Page (`/`) ✅ COMPLETE

**Goal:** Full multi-step form that writes a correct lead row to Supabase.

### Completed tasks:
- [x] `date-fns` + `date-fns-tz` installed for timezone handling
- [x] Tailwind config updated with full Swap design system tokens (colors, fonts, spacing, shadows)
- [x] `globals.css` updated — Inter + Playfair Display fonts, base styles
- [x] `layout.tsx` updated — Google Font imports via `next/font/google`
- [x] `app/page.tsx` — full 5-step intake form (client component):
  - Step 1: first name, last name, email, phone, notes — client-side validation
  - Step 2: 5 employee-range clickable tiles with radio-style selection
  - Step 3: 4 revenue-range tiles — `$1M+` visually distinct (shadow-green accent + "Qualified" badge)
  - Step 4: 5-day date picker + 26 time slots (8:00 AM–8:30 PM, 30-min); fetches blocked_slots from config row and booked appointments; "Skip — I'll book later" button
  - Step 5: review summary card + submit with disabled-on-click + loading spinner + error re-enable
  - Inline success screen after submit (no route change)
- [x] Stage assignment enforced in submit handler:
  - `appointment_at IS NULL` → `pipeline_stage = 'lead'`
  - `appointment_at IS NOT NULL AND revenue_range = '$1M+'` → `pipeline_stage = 'qualified'`
  - `appointment_at IS NOT NULL AND revenue_range ≠ '$1M+'` → `pipeline_stage = 'appointment'`
- [x] Build passes clean (`✓ Compiled successfully`, zero TS errors)

---

## Phase 4–8 — Not started

See `MASTER_PLAN.md` for full task breakdown of Phases 4–8.

---

## Architecture Notes (critical — read before any phase)

1. **Single table:** `leads` only. Blocked slots live as a `jsonb` array on the config row (id = `00000000-0000-0000-0000-000000000001`, `row_type = 'config'`).
2. **Every lead query must filter:** `WHERE row_type = 'lead'` — config row must never appear in any UI.
3. **No unique constraint on phone** — duplicate phone numbers are allowed. Phase 7 (`/update`) handles multi-result UI.
4. **Timezone:** all datetimes written to Supabase use `BOOKING_TZ` from `lib/constants.ts`.
5. **Stage logic:**
   - `appointment_at IS NULL` → `pipeline_stage = 'lead'`
   - `appointment_at IS NOT NULL AND revenue < $1M` → `pipeline_stage = 'appointment'`
   - `appointment_at IS NOT NULL AND revenue = '$1M+'` → `pipeline_stage = 'qualified'`
6. **Optimistic updates** on all drag and sold-amount mutations in Phase 5 — revert on error, never re-fetch all leads after every drag.
7. **Submit button** disabled immediately on first click to prevent duplicate lead rows.

---

## Reference Files

| File | Purpose |
|---|---|
| `MASTER_PLAN.md` | Full phase breakdown with all tasks |
| `SCREEN_STRUCTURE.md` | Screen-by-screen UX spec (routes, steps, fields) |
| `DESIGN (9).md` | Swap design system (colors, fonts, tokens) — apply in Phase 8 |
| `stitch_lead_pipeline_intake_system/` | Stitch-generated HTML screens — visual reference for Phases 3–7 |
| `lib/supabase.ts` | Supabase client |
| `lib/constants.ts` | `BOOKING_TZ` constant |
| `.env` | Supabase CLI credentials (not gitignored — contains access token) |
| `.env.local` | App env vars (gitignored) |
