# AtlasCRE — Collaborator Onboarding

## What Is This?

AtlasCRE is a commercial real estate listing aggregator built for the Austin and DFW markets. It pulls listings from multiple sources (LoopNet, ALN, Crexi, Realtor.com), normalizes them into a single database, and displays them on an interactive map. The goal is to give brokers a unified view of the market across sources they'd otherwise have to check individually.

---

## Access You Already Have

- **GitHub repo**: You have access — clone it to get started
- **Live preview**: https://atlas-cre-nine.vercel.app
- **Login**: Ask Nathan for credentials to the deployed app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database ORM | Prisma 7 + PostgreSQL (Neon serverless) |
| Map | MapLibre GL (open-source, no token required) |
| Auth | NextAuth.js v4 (credentials/email+password) |
| Deployment | Vercel |
| Scraper service | Node 20 + Express + Playwright (Chromium), hosted on DigitalOcean |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/nvargo-code/AtlasCRE.git
cd AtlasCRE
npm install
```

### 2. Create your `.env` file

Create a file named `.env` in the project root with the following contents:

```env
# Database (Neon PostgreSQL — shared, do not reset)
DATABASE_URL="postgresql://neondb_owner:npg_fxsXg0Km4jJp@ep-sweet-king-ajugkvkk.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="2eaeb4bc010d2bbc7810e80f2af8982eed98b12970253c64928e44eba53c7693"
NEXTAUTH_URL="http://localhost:3000"

# Scraper microservice (DigitalOcean droplet)
SCRAPER_SERVICE_URL="http://134.209.172.184:3333"
SCRAPER_SECRET="pdne1648urqf8*>6+nizekqw1278ce"

# Cron endpoint protection
CRON_SECRET="change-this-too"

# LoopNet credentials (for scraper)
LOOPNET_EMAIL="NathanVargo@Gmail.com"
LOOPNET_PASSWORD="0823fukk"

# Decodo residential proxy (required for LoopNet — CoStar blocks datacenter IPs)
LOOPNET_PROXY_URL="http://spip10uuys:Ct5j_vdbZU3s88zEht@gate.decodo.com:10001"
```

> **Note**: The database is shared. Do not run `prisma migrate reset` — it will wipe everyone's data. Use `prisma migrate dev` only for additive migrations and coordinate with Nathan first.

### 3. Generate Prisma client and run

```bash
npx prisma generate
npm run dev
```

App runs at http://localhost:3000.

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx            # Main map view
    admin/              # Admin panel — trigger ingestion, manage sources
    login/              # Auth login page
    favorites/          # Saved favorite listings
    saved-searches/     # Saved search filters
    api/                # API routes
      listings/         # Listing CRUD + search
      ingest/           # Trigger ingestion runs
      sources/          # Enable/disable data sources
      aln/              # ALN async job polling
      auth/             # NextAuth handler
  ingestion/            # Data ingestion pipeline
    runner.ts           # Registers all 6 providers
    providers/
      crexi.ts          # Crexi REST API
      realtor.ts        # Realtor.com GraphQL (unofficial)
      aln.ts            # ALN — delegates to scraper service
      loopnet.ts        # LoopNet — delegates to scraper service
      davisonvogel.ts   # Stub (not yet implemented)
      youngerpartners.ts# Stub (not yet implemented)
  lib/                  # Prisma client, utilities
  types/                # Shared TypeScript types
  generated/prisma/     # Auto-generated Prisma client (do not edit)

scraper-service/        # Separate Node/Express/Playwright microservice
  src/
    index.ts            # Express server, routes
    scrapers/
      loopnet.ts        # LoopNet browser automation
      aln.ts            # ALN browser automation + 2FA handling
```

---

## Data Sources

| Source | Method | Status | Notes |
|---|---|---|---|
| **Crexi** | REST API (`api.crexi.com`) | Not yet tested | Runs on Vercel, no browser needed |
| **Realtor.com** | Unofficial GraphQL API | Not yet tested | Runs on Vercel, no browser needed |
| **ALN** (Austin Luxury Network) | Playwright browser scraper | Working — 2FA required | Austin only. Requires SMS code on first login each session |
| **LoopNet** | Playwright browser scraper | Being unblocked | Was blocked by CoStar firewall — Decodo residential proxy now wired in, needs live test |
| **Davison Vogel** | TBD | Stub only | Not implemented |
| **Younger Partners** | TBD | Stub only | Not implemented |

---

## Triggering an Ingestion Run

From the running app, go to **`/admin`**. You'll see a panel to trigger ingestion by source and market (Austin or DFW). Results are stored in the Neon database and show up on the map.

For ALN specifically: the scraper sometimes requires a 2FA SMS code. The admin panel has a prompt for this — when the scraper is waiting, it will show a box to enter the code.

---

## Deployment

The app deploys automatically to Vercel on every push to `main`.

- **Vercel project**: https://atlas-cre-nine.vercel.app
- **Vercel env vars**: Must be set in the Vercel dashboard (Nathan has access). They mirror the `.env` file above, with `NEXTAUTH_URL` set to the production URL.

---

## The Scraper Service (DigitalOcean Droplet)

Two of the ingestion sources (ALN and LoopNet) require a real browser (Playwright/Chromium). Vercel serverless functions can't run Chromium, so we run a small Express server on a DigitalOcean Ubuntu droplet that handles the browser automation.

- **Droplet IP**: `134.209.172.184`
- **Port**: `3333`
- **Service name**: `atlas-scraper` (systemd)
- **SSH access**: Contact Nathan if you need it — not required for frontend/product work

The Next.js app calls `SCRAPER_SERVICE_URL` when it needs a LoopNet or ALN scrape. The scraper returns normalized listings back to the app, which writes them to the database.

---

## Markets

Two geographic markets are supported:

| Market | Bounds |
|---|---|
| Austin | 30.049–30.627°N, 97.421–97.968°W |
| DFW | 32.518–33.261°N, 96.463–97.478°W |

---

## Questions?

Nathan and the collaborator are in regular contact — coordinate directly for anything not covered here.
