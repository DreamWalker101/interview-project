# Sales Pipeline System — Design Doc
**Date:** 2026-05-12  
**Stack:** Next.js (App Router) · Supabase · Vercel  

---

## Overview

Three-screen sales pipeline: a public customer intake form, an admin Kanban pipeline board with availability management, and an admin update tool for closing deals.

---

## Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Customer landing — multi-step survey + calendar booking | Public |
| `/pipeline` | Kanban board + weekly availability blocker | Admin (hardcoded login) |
| `/update` | Phone lookup → mark Sold or Not Interested | Admin (same hardcoded login) |

---

## Dashboard 1 — `/` (Customer Landing)

Multi-step form, one step visible at a time:

1. **Contact Info** — First name, Last name, Email, Phone, Notes (optional)
2. **Team Size** — Range selector (radio/slider): `1-5`, `6-15`, `16-30`, `31-100`, `100+`
3. **Annual Revenue** — Radio: `$0–$200K`, `$200K–$500K`, `$500K–$1M`, `$1M+`
4. **Book a Meeting** — Calendar (today + up to 5 days out), time slots 8:00am–9:00pm in 30-min increments. Slots that are blocked by admin or already booked are hidden.
5. **Review & Submit** — Summary of all inputs, confirm button

### Pipeline Stage Auto-Assignment

| Condition | Stage Assigned |
|---|---|
| Submitted form, skipped calendar step | `lead` |
| Booked appointment, revenue < $1M | `appointment` |
| Booked appointment, revenue = `$1M+` | `qualified` |

---

## Dashboard 2 — `/pipeline` (Admin Kanban)

### Auth
Hardcoded credentials checked client-side. A simple login page at `/pipeline/login` redirects to `/pipeline` on success. Session stored in `sessionStorage`.

### Kanban Board
Five columns (left to right):
1. **Lead**
2. **Appointment**
3. **Qualified**
4. **Sold**
5. **Not Interested**

Each card displays:
- Full name
- Phone + email
- Booked appointment date/time (if any)
- Revenue range
- Sold amount (Sold stage only — inline editable field)

Cards are drag-and-drop between columns using `@dnd-kit/core`. Dropping a card updates `pipeline_stage` in Supabase immediately. Sold cards show an editable dollar amount input; changes are saved on blur.

### Availability Blocker
Weekly grid below the Kanban (or in a collapsible panel). Shows Mon–Sun × 8:00am–9:00pm in 30-min slots. Clicking a slot toggles it blocked/unblocked. Blocked slots are written to the `blocked_slots` table and are hidden from the customer calendar on `/`.

---

## Dashboard 3 — `/update` (Admin Update Tool)

1. Enter customer phone number → query `leads` table
2. Display: customer name, email, current pipeline stage
3. Select outcome: **Sold** or **Not Interested**
4. If Sold: enter dollar amount
5. Submit → updates `pipeline_stage` and `sold_amount` in Supabase

Same hardcoded auth as `/pipeline`.

---

## Database Schema

### Table: `leads`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `first_name` | `text` | Required |
| `last_name` | `text` | Required |
| `email` | `text` | Required |
| `phone` | `text` | Required |
| `notes` | `text` | Nullable |
| `employee_range` | `text` | e.g. `"1-5"` |
| `revenue_range` | `text` | e.g. `"$1M+"` |
| `appointment_at` | `timestamptz` | Nullable — null means no booking |
| `pipeline_stage` | `text` | `lead` \| `appointment` \| `qualified` \| `sold` \| `not_interested` |
| `sold_amount` | `numeric` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |

### Table: `blocked_slots`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `slot_datetime` | `timestamptz` | The exact 30-min slot that is blocked |
| `created_at` | `timestamptz` | Default `now()` |

Unique constraint on `slot_datetime` to prevent duplicates. Toggle = insert if missing, delete if present.

---

## Calendar Rules

- Booking window: today through today + 5 days (rolling)
- Available hours: 8:00am – 9:00pm (last slot starts at 8:30pm)
- Slot duration: 30 minutes
- Blocked if: slot exists in `blocked_slots` OR `appointment_at` for an existing lead matches that slot

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | DB client |
| `@supabase/ssr` | SSR-safe Supabase client for Next.js |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop Kanban |
| `react-calendar` or custom | Date picker on landing |
| `tailwindcss` | Styling |

---

## Vercel Deployment

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No server-side secrets needed (anon key is sufficient with RLS disabled for this project scope)
- Auto-deploys from `main` branch on GitHub (`DreamWalker101/interview-project`)
