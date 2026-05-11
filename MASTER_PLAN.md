# Sales Pipeline System — Master Plan
**Last updated:** 2026-05-12  
**Design doc:** [docs/plans/2026-05-12-sales-pipeline-design.md](docs/plans/2026-05-12-sales-pipeline-design.md)  
**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · Vercel  
**Repo:** https://github.com/DreamWalker101/interview-project  
**Supabase project:** `mljfryprzvofhnyxxbfo` (Tokyo)

---

## Quick Reference

| Route | What it is |
|---|---|
| `/` | Public customer intake form (multi-step) |
| `/pipeline` | Admin Kanban board + availability blocker |
| `/update` | Admin phone-lookup → Sold / Not Interested |

**Admin credentials:** hardcoded (set during Phase 3), stored in env var  
**Auth mechanism:** client-side check → sessionStorage session  
**DB tables:** `leads`, `blocked_slots`  
**Calendar rules:** today + 5 days, 8am–9pm, 30-min slots

---

## Phases

### Phase 1 — Project Scaffold
**Goal:** Working Next.js app on Vercel with Supabase connected, all routes stubbed.

Tasks:
- [ ] Init Next.js 14 app with Tailwind (`npx create-next-app`)
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`
- [ ] Create Supabase client utility (`lib/supabase.ts`)
- [ ] Stub routes: `/`, `/pipeline`, `/pipeline/login`, `/update`
- [ ] Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy to Vercel, set env vars, confirm live URL

**Done when:** All three routes load on Vercel (even if blank).

---

### Phase 2 — Database Setup
**Goal:** Both Supabase tables live, schema matches design doc.

Tasks:
- [ ] Write migration: create `leads` table with all columns + constraints
- [ ] Write migration: create `blocked_slots` table with unique constraint on `slot_datetime`
- [ ] Push migrations to Supabase (`npx supabase db push`)
- [ ] Confirm tables visible in Supabase dashboard
- [ ] Disable RLS on both tables (simple project, no row-level security needed)

**Schema — `leads`:**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
first_name text NOT NULL,
last_name text NOT NULL,
email text NOT NULL,
phone text NOT NULL,
notes text,
employee_range text,
revenue_range text,
appointment_at timestamptz,
pipeline_stage text NOT NULL DEFAULT 'lead',
sold_amount numeric,
created_at timestamptz DEFAULT now()
```

**Schema — `blocked_slots`:**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
slot_datetime timestamptz NOT NULL UNIQUE,
created_at timestamptz DEFAULT now()
```

**Done when:** Both tables exist in hosted Supabase with correct columns.

---

### Phase 3 — Customer Landing Page (`/`)
**Goal:** Full multi-step form that writes a lead to Supabase with correct pipeline stage.

Steps in the form:
1. Contact info (first name, last name, email, phone, notes)
2. Employee range (radio: 1-5, 6-15, 16-30, 31-100, 100+)
3. Revenue range (radio: $0–$200K, $200K–$500K, $500K–$1M, $1M+)
4. Calendar booking (date picker → time slot picker, respects blocked slots + existing bookings)
5. Review & submit

Tasks:
- [ ] Build multi-step form shell with step progress indicator
- [ ] Step 1: contact info fields with validation
- [ ] Step 2: employee range radio group
- [ ] Step 3: revenue range radio group
- [ ] Step 4: date picker (today + 5 days), fetch blocked slots from Supabase, render available time slots
- [ ] Step 5: review summary screen
- [ ] On submit: determine pipeline stage, insert row into `leads`
- [ ] Handle "skip booking" path → stage = `lead`
- [ ] Success screen after submit

**Stage logic:**
```
no appointment_at           → lead
appointment_at + rev < $1M  → appointment
appointment_at + rev = $1M+ → qualified
```

**Done when:** Submitting the form creates a correct row in `leads` with proper stage.

---

### Phase 4 — Admin Auth (shared across `/pipeline` and `/update`)
**Goal:** Hardcoded login protecting both admin routes.

Tasks:
- [ ] Add `ADMIN_USERNAME` + `ADMIN_PASSWORD` to env vars
- [ ] Build `/pipeline/login` page with username/password form
- [ ] On success: store auth token in `sessionStorage`
- [ ] Create `useAdminAuth` hook that checks `sessionStorage` token
- [ ] Redirect unauthenticated users from `/pipeline` and `/update` to `/pipeline/login`
- [ ] Logout button clears `sessionStorage`

**Done when:** Visiting `/pipeline` unauthenticated redirects to login; correct creds grant access.

---

### Phase 5 — Pipeline Kanban Board (`/pipeline`)
**Goal:** Drag-and-drop Kanban with all 5 stages, live data from Supabase.

Tasks:
- [ ] Fetch all leads from Supabase on page load
- [ ] Render 5 columns: Lead, Appointment, Qualified, Sold, Not Interested
- [ ] Build lead card component (name, phone, email, booked time, revenue range)
- [ ] Implement drag-and-drop with `@dnd-kit` — dropping card updates `pipeline_stage` in Supabase
- [ ] Sold column: show `sold_amount` on card, inline editable input, save on blur
- [ ] Real-time updates or polling (re-fetch after any mutation)

**Done when:** Cards can be dragged between all 5 columns and changes persist in Supabase.

---

### Phase 6 — Availability Blocker (on `/pipeline`)
**Goal:** Admin can block/unblock 30-min time slots that hide from the customer calendar.

Tasks:
- [ ] Build weekly grid UI (Mon–Sun rows or columns, 8am–9pm time slots)
- [ ] Fetch existing blocked slots from `blocked_slots` on load
- [ ] Highlight blocked slots visually
- [ ] Click slot: if not blocked → insert to `blocked_slots`; if blocked → delete from `blocked_slots`
- [ ] Optimistic UI update on click
- [ ] Verify blocked slots disappear from `/` calendar

**Done when:** Admin blocks a slot → customer cannot select that slot on the landing page.

---

### Phase 7 — Admin Update Tool (`/update`)
**Goal:** Phone lookup form to mark leads as Sold or Not Interested.

Tasks:
- [ ] Phone number input → query `leads` by phone
- [ ] Display: full name, email, current pipeline stage
- [ ] Radio: Sold / Not Interested
- [ ] If Sold: text input for dollar amount
- [ ] Submit → update `pipeline_stage` (and `sold_amount` if sold) in Supabase
- [ ] Success confirmation with updated info

**Done when:** Entering a phone number finds the lead and updates their stage correctly.

---

### Phase 8 — Polish & Deployment
**Goal:** Production-ready, all flows tested end-to-end.

Tasks:
- [ ] Mobile-responsive layout on all three pages
- [ ] Error states: form validation messages, "phone not found", Supabase errors
- [ ] Loading states on all async operations
- [ ] Final Vercel deployment with all env vars set
- [ ] Smoke test full flow: submit form → appears in pipeline → mark sold → sold amount shows on card
- [ ] Smoke test availability: block slot → slot gone from customer calendar

**Done when:** Full end-to-end flow works on the live Vercel URL.

---

## Dependency Order

```
Phase 1 (scaffold)
  → Phase 2 (database)
    → Phase 3 (landing form)   ← independent of Phase 4+
    → Phase 4 (admin auth)
        → Phase 5 (kanban)
        → Phase 6 (availability blocker)
        → Phase 7 (update tool)
              → Phase 8 (polish + deploy)
```

Phases 3, 5, 6, 7 can be worked in parallel once Phases 1, 2, and 4 are done.

---

## Environment Variables

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Public anon key |
| `ADMIN_USERNAME` | `.env.local` + Vercel | Hardcoded admin login |
| `ADMIN_PASSWORD` | `.env.local` + Vercel | Hardcoded admin password |
