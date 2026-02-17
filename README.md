# AtlasCRE

Map-based commercial real estate dashboard for Austin TX and DFW TX. Aggregates listings from multiple CRE sources with deduplication, filtering, and export capabilities.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Map**: MapLibre GL JS (free, no API key required)
- **Database**: PostgreSQL on Neon (serverless)
- **ORM**: Prisma 7 with Neon adapter
- **Auth**: NextAuth.js (credentials provider)
- **Export**: xlsx (Excel), jsPDF (PDF), CSV

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd AtlasCRE
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random string for JWT signing
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `CRON_SECRET` - Secret for Vercel cron endpoint

### 3. Set up database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Create initial user

Use Prisma Studio or a seed script to create a Tenant and User:

```bash
npx prisma studio
```

Create a user with a bcrypt-hashed password. Generate one with:
```bash
node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"
```

### 5. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Deployment (Vercel)

```bash
npx vercel --prod
```

The `vercel.json` configures a daily cron job at 6 AM UTC to refresh listings.

## Project Structure

```
src/
  app/            # Next.js pages and API routes
  components/     # React components (Map, Filters, etc.)
  lib/            # Shared utilities (prisma, auth, filters, export)
  ingestion/      # Data ingestion pipeline
    providers/    # Source adapters (stub implementations)
    dedupe.ts     # Deduplication logic
    runner.ts     # Ingestion orchestrator
  types/          # TypeScript type definitions
  generated/      # Prisma generated client
docs/             # Documentation
```

## Data Sources

Provider adapters are in `src/ingestion/providers/`. Currently stub implementations:

| Provider | Markets | Status |
|----------|---------|--------|
| Realtor.com | Austin, DFW | Stub |
| LoopNet | Austin, DFW | Stub |
| Crexi | Austin, DFW | Stub |
| Davison & Vogel | Austin | Stub |
| Younger Partners | DFW | Stub |

See [docs/adding-a-provider.md](docs/adding-a-provider.md) for implementation guide.

## Documentation

- [Data Model](docs/data-model.md)
- [API Reference](docs/api-reference.md)
- [Adding a Provider](docs/adding-a-provider.md)
