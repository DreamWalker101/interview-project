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

**Admin credentials:** hardcoded, stored in env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)  
**Auth mechanism:** client-side check → sessionStorage session  
**DB tables:** ONE table — `leads` (config row coexists using `row_type = 'config'`)  
**Blocked slots storage:** jsonb array on the single config row in `leads`  
**Calendar timezone:** hardcoded constant (client's local timezone, set in `lib/constants.ts`)  
**Calendar rules:** today + 4 days (5 total), 8am–9pm, 30-min slots (26 per day)  
**Phone uniqueness:** no unique constraint — multi-result UI handles duplicates

---

## Architecture Decision: Single-Table Config Row

There is **one table only: `leads`**. A dedicated config row coexists in this table identified by `row_type = 'config'`. This row stores the admin's blocked availability slots as a `jsonb` array.

- All lead queries must include `WHERE row_type = 'lead'`
- The config row is upserted (never inserted twice) using a fixed `id = '00000000-0000-0000-0000-000000000001'`
- Blocked slot format in jsonb: `["2026-05-12T09:00:00+09:00", "2026-05-12T09:30:00+09:00", ...]` (full ISO strings in the hardcoded timezone)

---

## Phases

### Phase 1 — Project Scaffold
**Goal:** Working Next.js app on Vercel with Supabase connected, all routes stubbed.

Tasks:
- [ ] Init Next.js 14 app with Tailwind (`npx create-next-app`)
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`
- [ ] Create Supabase client utility (`lib/supabase.ts`)
- [ ] Create timezone constant in `lib/constants.ts` (e.g. `export const BOOKING_TZ = 'America/New_York'` — confirm with client)
- [ ] Stub routes: `/`, `/pipeline`, `/pipeline/login`, `/update`
- [ ] Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- [ ] Deploy to Vercel, set env vars, confirm live URL

**Done when:** All three routes load on Vercel (even if blank).

---

### Phase 2 — Database Setup
**Goal:** `leads` table live with all columns including config row support. No second table.

Tasks:
- [ ] Write migration: create `leads` table with all columns below
- [ ] Push migration (`npx supabase db push`)
- [ ] Insert the config row via migration seed (fixed id, `row_type = 'config'`, `blocked_slots = '[]'`)
- [ ] Confirm table + config row visible in Supabase dashboard
- [ ] Disable RLS on `leads`
- [ ] Document: phone is NOT unique — duplicate phone numbers are allowed; phone lookup UI handles multi-result

**Schema — `leads` (the only table):**
```sql
id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
row_type        text        NOT NULL DEFAULT 'lead',   -- 'lead' | 'config'
first_name      text,                                  -- null on config row
last_name       text,
email           text,
phone           text,                                  -- no UNIQUE constraint
notes           text,
employee_range  text,
revenue_range   text,
appointment_at  timestamptz,
pipeline_stage  text,                                  -- null on config row
sold_amount     numeric,
blocked_slots   jsonb       DEFAULT '[]',              -- used only on config row
created_at      timestamptz DEFAULT now()
```

**Config row seed (run once in migration):**
```sql
INSERT INTO leads (id, row_type, blocked_slots)
VALUES ('00000000-0000-0000-0000-000000000001', 'config', '[]')
ON CONFLICT (id) DO NOTHING;
```

**Done when:** Table exists, config row present, RLS off.

---

### Phase 3 — Customer Landing Page (`/`)
**Goal:** Full multi-step form that writes a correct lead row to Supabase.

**Step structure:** 5 steps with a progress bar. One step visible at a time.

Tasks:

**Step 1 — Contact info:**
- [ ] Fields: first name, last name, email, phone, notes (optional)
- [ ] Client-side validation before allowing Next

**Step 2 — Employee range:**
- [ ] 5 clickable tile options: 1-5, 6-15, 16-30, 31-100, 100+

**Step 3 — Revenue range:**
- [ ] 4 clickable tile options: $0–$200K, $200K–$500K, $500K–$1M, $1M+
- [ ] $1M+ tile visually distinct (different accent)

**Step 4 — Calendar booking (detailed):**
- [ ] Hardcode timezone from `lib/constants.ts` — all datetime math uses this TZ
- [ ] Date row: 5 buttons (today through today+4), greyed out if no slots available
- [ ] On date select: generate 26 slots (8:00 AM – 8:30 PM, 30-min increments) in BOOKING_TZ
- [ ] Fetch config row from `leads` where `id = '00000000-0000-0000-0000-000000000001'` → parse `blocked_slots` jsonb → filter out blocked slots
- [ ] Fetch `appointment_at` values from all leads (`WHERE row_type = 'lead' AND appointment_at IS NOT NULL`) for selected date → filter those out (no double-booking)
- [ ] Render remaining slots as clickable buttons; selected = highlighted; unavailable = greyed + non-interactive
- [ ] "Skip — I'll book later" explicit button below slot grid, visually distinct (not hidden or small)
- [ ] Skipping sets `appointment_at = null` in form state and advances to review

**Step 5 — Review & submit:**
- [ ] Summary card: all entered data, appointment or "No appointment booked"
- [ ] Submit button: disabled immediately on first click, shows loading spinner
- [ ] On Supabase insert error: re-enable button so user can retry
- [ ] On success: navigate to `/success` (or inline success state)

**Stage assignment logic (enforced in submit handler, not comments):**
```
appointment_at IS NULL                          → pipeline_stage = 'lead'
appointment_at IS NOT NULL AND revenue < $1M    → pipeline_stage = 'appointment'
appointment_at IS NOT NULL AND revenue = '$1M+' → pipeline_stage = 'qualified'
```
Note: `$1M+` + no appointment = `lead`. Qualification requires BOTH conditions.

**Done when:** Form submission creates a correct `leads` row with correct `pipeline_stage`.

---

### Phase 4 — Admin Auth
**Goal:** Hardcoded login protecting `/pipeline` and `/update`.

Tasks:
- [ ] Build `/pipeline/login` page: username + password form
- [ ] On submit: compare against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars (client-readable, prefixed `NEXT_PUBLIC_` or checked via API route)
- [ ] On success: write auth token to `sessionStorage`
- [ ] `useAdminAuth` hook: reads `sessionStorage`, redirects to `/pipeline/login` if missing
- [ ] Apply `useAdminAuth` to `/pipeline` and `/update`
- [ ] Logout button clears `sessionStorage`, redirects to `/pipeline/login`

**Done when:** Unauthenticated access to `/pipeline` or `/update` redirects to login.

---

### Phase 5 — Pipeline Kanban Board (`/pipeline`)
**Goal:** Drag-and-drop Kanban, 5 stages, optimistic updates, sold amount inline edit.

Tasks:
- [ ] Fetch all leads `WHERE row_type = 'lead'` on page load
- [ ] Render 5 columns: Lead, Appointment, Qualified, Sold, Not Interested (each with card count badge)
- [ ] Build lead card: name, phone, email, revenue range badge, appointment datetime (if any)
- [ ] Implement drag-and-drop with `@dnd-kit`:
  - On drop: **immediately update local state** (optimistic — card moves visually at once)
  - Fire Supabase `UPDATE` in background
  - On Supabase error: revert card to original column + show error message on card
  - Do NOT re-fetch all leads after every drag (causes flicker). Only re-fetch on initial load and after a reverted failed update.
- [ ] Sold column — inline sold amount:
  - Display `sold_amount` formatted as currency, read-only by default
  - Click field → becomes editable input
  - Save on **Enter key** or explicit checkmark button (NOT on blur — blur causes accidental empty saves)
  - If field is cleared and confirmed: warn admin before saving null
  - Optimistic update + background Supabase write (same revert-on-error pattern)

**Done when:** Cards drag between columns, changes persist, sold amount saves on confirmation only.

---

### Phase 6 — Availability Blocker (on `/pipeline`)
**Goal:** Admin toggles time slots blocked/unblocked; blocked slots hidden from customer calendar.

Tasks:
- [ ] Fetch config row (`id = '00000000-0000-0000-0000-000000000001'`) → parse `blocked_slots` jsonb
- [ ] Build weekly grid: 7 columns (Mon–Sun), 26 rows (8:00 AM – 8:30 PM, 30-min slots)
- [ ] Render each cell: white = available, red/strikethrough = blocked
- [ ] On cell click:
  - If not blocked: add ISO datetime string to `blocked_slots` array → upsert config row
  - If blocked: remove from array → upsert config row
  - Optimistic UI: toggle cell immediately, revert on error
- [ ] Verify: blocked slot does not appear in Step 4 of the landing form calendar

**Done when:** Admin blocks a slot → customer sees it removed from the booking calendar.

---

### Phase 7 — Admin Update Tool (`/update`)
**Goal:** Phone lookup → mark lead Sold or Not Interested with edge case handling.

Tasks:
- [ ] Phone number input → query `leads WHERE row_type = 'lead' AND phone = $input`
- [ ] **No result:** show explicit "No lead found with this phone number." message, clear form
- [ ] **Multiple results (same phone):** show list of all matching leads (name + email + current stage); admin selects one before proceeding
- [ ] **Single result:** display name, email, current pipeline stage
- [ ] Outcome selector: "Sold" (green) or "Not Interested" (red/grey) — large radio buttons
- [ ] If Sold selected: reveal "Sold Amount ($)" number input
- [ ] Submit → `UPDATE leads SET pipeline_stage = $stage, sold_amount = $amount WHERE id = $id`
- [ ] Success state: "Updated! {Name} has been marked as [Sold for $X / Not Interested]." + "Search another" button that resets to phone input

**Done when:** Phone lookup finds lead(s), updates stage correctly, handles no-result and multi-result.

---

### Phase 8 — Polish & Vercel Deploy
**Goal:** Production-ready, all flows smoke-tested on live URL.

Tasks:
- [ ] Error boundaries on all async operations (Supabase failures surface cleanly)
- [ ] Loading states on all fetches and mutations
- [ ] Confirm all `WHERE row_type = 'lead'` filters are in place (config row never appears in UI)
- [ ] Final Vercel deploy with all env vars set
- [ ] Smoke test: submit form → appears in Kanban → drag to Sold → set amount → verify on `/update`
- [ ] Smoke test: block slot in admin grid → slot gone from customer calendar

**Done when:** Full end-to-end flow works on live Vercel URL.

---

## Dependency Order

```
Phase 1 (scaffold)
  └── Phase 2 (database)
        ├── Phase 3 (landing form)     ← can start after Phase 1+2
        ├── Phase 4 (admin auth)       ← can start after Phase 1
        │     ├── Phase 5 (kanban)
        │     ├── Phase 6 (availability blocker)
        │     └── Phase 7 (update tool)
        └── Phase 8 (polish + deploy)  ← after all above
```

Phases 3, 5, 6, 7 are parallelizable once 1, 2, and 4 are done.

---

## Environment Variables

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase anon key |
| `NEXT_PUBLIC_ADMIN_USERNAME` | `.env.local` + Vercel | Hardcoded admin username |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `.env.local` + Vercel | Hardcoded admin password |

---

## Key Invariants (must hold across all phases)

1. Every lead query includes `WHERE row_type = 'lead'` — config row must never appear in any UI
2. All datetime values written to Supabase are ISO strings in the hardcoded `BOOKING_TZ` timezone
3. Qualification requires BOTH `appointment_at IS NOT NULL` AND `revenue_range = '$1M+'`
4. Optimistic updates are used for all drag and sold-amount mutations; failures revert + show error
5. The submit button is disabled immediately on click to prevent duplicate lead rows
6. Blocked slots and booked slots are both filtered before rendering calendar time slots
