# Project Context

## Overview
Interview project (30-min scope). Working directory: `/home/ahmed/Desktop/SUPABSE`

## What's Been Set Up

### Git
- Initialized repo, branch `main`
- Remote: `https://github.com/DreamWalker101/interview-project` (public)
- Initial commit pushed: `init: project setup with supabase`
- `.gitignore` excludes: `node_modules/`, `.env`, `.env.local`, `.env.*.local`, `.supabase/`

### Supabase
- CLI available via `npx supabase` (v2.98.2)
- Project initialized (`supabase/config.toml` exists)
- Linked to existing hosted project:
  - **Project name**: DreamWalker101's Project
  - **Ref ID**: `mljfryprzvofhnyxxbfo`
  - **Region**: Northeast Asia (Tokyo)
  - **URL**: `https://mljfryprzvofhnyxxbfo.supabase.co`

### Environment
`.env` file created at project root (not committed) with:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`

## Accounts
- **GitHub**: `DreamWalker101` (authenticated via `gh` CLI)
- **Supabase**: authenticated via access token in `.env`

## Next Steps
- Decide what to build (no feature work started yet)
- Run `npx supabase db pull` if you want to sync remote schema locally
- Use `SUPABASE_ACCESS_TOKEN` env var prefix when running Supabase CLI commands headlessly
