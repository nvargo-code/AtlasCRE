# SuperSearch / AtlasCRE — Claude Code Instructions

## Project Overview
Real estate platform for Shapiro Group (Austin, TX). Public site + agent portal + client portal.
- **Stack**: Next.js 16 (App Router), Prisma, Neon PostgreSQL, MapLibre, Recharts, Tailwind CSS
- **Branch**: `supersearch`
- **Design**: Navy (#0a1628) + Gold (#c9a96e) luxury aesthetic, Montserrat typography
- **Deploy**: Railway (`railway up --detach`) + GitHub (`git push origin supersearch`)
- **Live URL**: https://supersearch-production.up.railway.app

## When Resuming Work
1. Run `git log --oneline -10` to see recent work
2. Run `npx next build 2>&1 | grep -c "○\|●\|ƒ"` to verify build health (~140 routes)
3. Check TECH_STRATEGY.md for the full roadmap phases
4. Focus on: fixing broken features > completing partial features > building new features
5. Always run `npx next build` before committing to verify no type errors
6. Commit with descriptive messages and push to `supersearch` branch
7. Deploy with `railway up --detach`

## Demo Accounts
- `david@shapirogroup.co` / `david123` — ADMIN (full access)
- `admin@atlascre.com` / `demo123` — ADMIN
- `client@demo.com` / `demo123` — USER (client portal)

## Key Directories
- `src/app/(public)/` — Public pages (search, neighborhoods, blog, investment, etc.)
- `src/app/portal/` — Client portal (dashboard, saved, collections, showings, messages)
- `src/app/portal/agent/` — Agent tools (CMA, analytics, marketing, offers, calendar, etc.)
- `src/app/api/portal/` — Portal API endpoints
- `src/ingestion/` — Data scraping pipeline (Realtor, ALN, LoopNet, CREXi)
- `src/lib/` — Shared utilities (auth, prisma, GHL, notifications, alerts, search-alerts)
- `src/data/` — Static data (neighborhoods, blog articles, avatars)
- `prisma/schema.prisma` — Database schema

## Build & Deploy Commands
```bash
npm run dev          # Local dev server on :3000
npx next build       # Production build check
railway up --detach  # Deploy to Railway
git push origin supersearch  # Push to GitHub
npx prisma generate  # After schema changes
npx prisma db push   # Push schema to Neon DB
```

## Current Status (~140 routes, 75 commits)
Platform is comprehensive. All TECH_STRATEGY phases 60-95% complete.

### What's Working Well
- Full public site with SEO pages, blog, neighborhoods, investment calculator
- SuperSearch with autocomplete, heat maps, area stats, Zillow comparison
- Client portal: saved homes, collections, compare, showings, messages, notifications
- Agent portal: pipeline, CMA, AI writer, marketing, analytics, commissions, referrals
- Transaction tracker with milestones, tasks, compliance checklist
- Post-ingestion hooks for instant alerts and agent notifications
- GoHighLevel CRM webhook integration
- Registration gate creates real accounts + auto-signs in

### Remaining Gaps (Lower Priority)
- Email delivery (Resend API not configured — alerts log to console)
- ALN scraper needs full detail page scraping (photos, description, agent info)
- Social media auto-posting (content generated but manual copy/paste)
- youngerpartners + davisonvogel scrapers are stubs
- Dotloop/QuickBooks integrations not started

### 29 Bugs Fixed Across Audit Sessions
All critical connectivity, data flow, and UX issues resolved. See git log for details.
