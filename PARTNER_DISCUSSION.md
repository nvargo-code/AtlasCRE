# Partner Discussion Items
*Generated 2026-03-30 — Review before next partner meeting*

---

## 1. Product Name: "SuperSearch" Needs to Change

**Problem:** "SuperSearch" has trademark conflicts and the .com domain is malware.

- 5+ active products already use "SuperSearch" (Instantly.ai, MyHeritage, Microsoft, Liberty Global)
- Likely unregistrable at USPTO — "Super" + "Search" is descriptively generic
- supersearch.com is a browser hijacker/malware redirect
- supersearch.io is for sale at $2,595

**Top Replacement Options:**

| Name | Why | Domain Available | Trademark Risk |
|------|-----|-----------------|----------------|
| **Atlas Search** | Already built "AtlasCRE" brand. "Atlas Intelligence," "Atlas Pricing," etc. are on the site. Natural extension. | atlaslisting.com YES | LOW — unique in RE context |
| **Trove** | A trove = hidden collection of valuable things. "Trove found 847 listings. Zillow found 612." Short, premium, memorable. | trovesearch.com YES | LOW — distinctive |
| **Surface** | Verb: "to bring hidden things to light." Clean, modern. "Surface the listings Zillow can't." | surfacere.com YES | LOW |
| **ListPrism** | A prism reveals the full spectrum. Very trademarkable. | listprism.com YES | VERY LOW |
| **Delve** | "Delve deeper than Zillow." Action-oriented, professional. | delvelisting.com YES | LOW |

**Recommendation:** "Atlas Search" or just "Atlas" — everything is already aligned in the codebase and branding.

**Action needed:**
- [ ] Pick a name
- [ ] Register the .com domain ($10-15/year)
- [ ] Consult trademark attorney (~$500-1500 for search + filing)
- [ ] File USPTO trademark application (~$250-350/class)

---

## 2. Gmail Integration — Need Google Cloud OAuth Setup

The email scanner (auto-detects pocket listings from your inbox) needs:

- [ ] Google Cloud Console project with Gmail API enabled
- [ ] OAuth2 credentials (Web Application type)
- [ ] David authorizes his Gmail (one-time flow at /api/gmail/auth)
- [ ] Decide: scan david@shapirore.com? team@shapirogroup.co? Both?
- [ ] Set ANTHROPIC_API_KEY for AI-powered email parsing (optional, ~$0.01/email)

**What it does:** Scans inbox 4x daily, detects pocket listing keywords ("off market," "exclusive," "pocket listing"), extracts listing data, geocodes, enriches from tax records, and ingests into the search platform automatically.

---

## 3. GoHighLevel Webhook Connection

All lead capture forms are built and ready. Need webhook URLs from GHL to activate:

- [ ] Contact form → GHL pipeline
- [ ] Registration gate ("See X more listings") → GHL pipeline
- [ ] Newsletter signup → GHL automation
- [ ] Home valuation request → GHL pipeline
- [ ] Dream home finder → GHL pipeline
- [ ] Save search alerts → GHL automation

**Env vars needed:** `GHL_LEAD_WEBHOOK`, `GHL_CONTACT_WEBHOOK`, `GHL_NEWSLETTER_WEBHOOK`

---

## 4. Domain Strategy — Consolidating Sites

Current state:
- **shapirore.com** — WordPress site (legacy)
- **austinloves.me** — Webflow template site (legacy, mostly broken)
- **AtlasCRE on Vercel** — The new platform (what we just built)

**Decision needed:**
- [ ] What domain should the new site live on? Options:
  - `shapirogroup.co` (clean, professional, matches email)
  - `shapirore.com` (existing, has SEO equity)
  - New domain based on product name (e.g., `atlaslisting.com`)
- [ ] Set up 301 redirects from old domains to new
- [ ] Point DNS and deploy on Vercel
- [ ] Cancel Webflow subscription (austinloves.me)

---

## 5. IDX / MLS Data Feed

The platform is built to ingest MLS data but doesn't have a feed connected yet.

- [ ] Apply for ACTRIS (Austin MLS) IDX feed via RESO Web API
- [ ] Or use an aggregator: MLS Grid, Spark API, Bridge Interactive
- [ ] Estimated cost: $50-100/month
- [ ] This is what powers the "real" listing count vs Zillow comparison

---

## 6. Content & Marketing Decisions

- [ ] Hero image/video for homepage — professional Austin skyline photo or drone footage?
- [ ] YouTube channel integration — embed videos on blog/neighborhood pages?
- [ ] Blog content strategy — who writes? AI-assisted? Manual review?
- [ ] Headshot photos — current ones from shapirore.com, or schedule new shoot?

---

## 7. Budget Summary

| Item | Monthly Cost | One-Time Cost |
|------|-------------|---------------|
| Vercel Pro (hosting) | $20 | — |
| Domain registration | $2 | $10-15 |
| IDX/MLS data feed | $50-100 | — |
| Anthropic API (email parsing) | ~$5-20 | — |
| Trademark filing | — | $750-1,500 |
| **Total** | **~$75-140/mo** | **~$760-1,515** |

---

## 8. What's Built (for partner context)

The new platform includes:
- 22+ pages with luxury design (SERHANT-inspired)
- SuperSearch with map, filters, Zillow comparison, draw-to-search
- 6 lead capture funnels (all ready for GHL webhook)
- Gmail pocket listing scanner (4x daily, AI-powered)
- Tax record enrichment (TCAD lookup)
- Rich neighborhood guides (gyms, restaurants, schools, biohacking spots)
- 4 buyer avatars driving content (Tech Founder, Health Exec, Family, Investor)
- SEO: sitemap, robots, JSON-LD, OG images
- Mortgage calculator, image gallery, share buttons
- Full copy overhaul — confident, declarative, no fluff
- Real logos integrated
- Redirects from legacy sites

**Not yet built:** MLS feed, market data dashboards, heat maps, historical sold data tracking
