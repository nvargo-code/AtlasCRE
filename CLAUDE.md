# SuperSearch / AtlasCRE — Claude Code Instructions

## Project Overview
Real estate platform for Shapiro Group (Austin, TX). Public site + agent portal + client portal.
- **Stack**: Next.js 16 (App Router), Prisma, Neon PostgreSQL, MapLibre, Recharts, Tailwind CSS
- **Branch**: `supersearch`
- **Design**: Navy (#0a1628) + Gold (#c9a96e) luxury aesthetic, Montserrat-like typography
- **Deploy**: Railway (`railway up --detach`) + GitHub (`git push origin supersearch`)

## When Resuming Work
1. Run `git log --oneline -10` to see recent work
2. Run `npx next build 2>&1 | grep -c "○\|●\|ƒ"` to verify build health
3. Check TECH_STRATEGY.md for the full roadmap phases
4. Focus on: fixing broken features > completing partial features > building new features
5. Always run `npx next build` before committing to verify no type errors
6. Commit with descriptive messages and push to `supersearch` branch
7. Deploy with `railway up --detach`

## Key Directories
- `src/app/(public)/` — Public pages (search, neighborhoods, blog, etc.)
- `src/app/portal/` — Client portal (dashboard, saved, collections, showings, messages)
- `src/app/portal/agent/` — Agent tools (CMA, analytics, marketing, offers, etc.)
- `src/app/api/portal/` — Portal API endpoints
- `src/ingestion/` — Data scraping pipeline (Realtor, ALN, LoopNet, CREXi)
- `src/lib/` — Shared utilities (auth, prisma, GHL, notifications, alerts)
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

## Current Status (~133 routes)
Most TECH_STRATEGY phases are 60-85% complete. Key remaining gaps:
- Email delivery (Resend API not configured)
- ALN scraper needs to pull full listing detail (photos, description, agent info)
- Social media auto-posting (content generated but manual copy/paste)
- Some Phase 2 data moat features (social monitoring, sold database)
