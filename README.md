# Sales Pipeline — Interview Project

A full-stack sales pipeline built with Next.js 14, Supabase, and Tailwind CSS.

**Live:** https://interview-project-rho-lake.vercel.app  
**Repo:** https://github.com/DreamWalker101/interview-project  
**Supabase project:** `mljfryprzvofhnyxxbfo` (Tokyo)

---

## Routes

| Route | Audience | Description |
|---|---|---|
| `/` | Public | Customer intake form (5-step wizard) |
| `/pipeline/login` | Admin | Login (`admin` / `admin`) |
| `/pipeline` | Admin | Kanban board + availability blocker |
| `/update` | Admin | Phone lookup → mark lead Sold or Not Interested |

---

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** Supabase (single `leads` table)
- **Styling:** Tailwind CSS with Swap design tokens
- **Drag-and-drop:** `@dnd-kit/core`
- **Deploy:** Vercel (auto-deploy from `main`)

---

## Local Dev

```bash
npm install
npm run dev   # http://localhost:3000
```

Env vars required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_USERNAME=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

---

## Docs

| File | Purpose |
|---|---|
| `docs/PROGRESS.md` | Phase-by-phase build log |
| `docs/MASTER_PLAN.md` | Full phase breakdown and task list |
| `docs/SCREEN_STRUCTURE.md` | Screen-by-screen UX spec |
| `docs/reference/design-system.md` | Swap design token reference |
| `docs/reference/stitch/` | Stitch-generated HTML screens (visual reference) |
| `docs/reference/calendar-ui/` | Calendar UI reference screen |
