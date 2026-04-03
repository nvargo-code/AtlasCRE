# Shapiro Group Brokerage Tech Strategy
*Competitive analysis + build plan — March 2026*

---

## Part 1: What the Top Brokerages Are Doing

### Side-by-Side Comparison

| Function | SERHANT. | Compass | Kuper Sotheby's |
|---|---|---|---|
| **Website** | Luxury Presence (~$500+/mo) | Custom-built ($1.6B invested) | Global sothebysrealty.com (Drupal/Acquia) |
| **Search** | Draw-to-select map, universal search | AI "Recommended For You," draw search, Coming Soon/Private Exclusives | Global search across 75 countries, 15 languages |
| **CRM** | Rechat (AI-powered, "Lucy" assistant) | Proprietary "Contacts" (built in-house) | Cloze (brand-recommended) |
| **Lead Gen** | Ryan's personal brand (100M+ impressions/mo), Netflix, ADX geo-targeting | Private Exclusives (20K listings), Likely-to-Sell ML, Make-Me-Sell | Global referral network (1,100 offices), property syndication to WSJ/NYT/Bloomberg |
| **Lead Nurture** | S.MPLE AI + Rechat drip campaigns | Compass AI 2.0 (voice-activated, proactive, background automation) | ActivePipe automated emails + Cloze |
| **Marketing Tools** | In-house Studios (film/photo), ID Lab (branding), ADX | Marketing Center (templates, digital ads, Video Studio) | Design Vault, Presentation Studio, Video Studio, Curate AR |
| **Transaction Mgmt** | TotalBrokerage + Rechat | Glide (acquired) + Compass One client portal | Affiliate choice (likely Dotloop or SkySlope) |
| **AI** | S.MPLE "Large Action Model" ($45M funded, MCP + LangChain) | Compass AI 2.0 (generative + agentic + predictive) | PremierGPT (Florida affiliate won Inman AI Award) |
| **Back Office** | TotalBrokerage | Business Tracker + Glide | Affiliate-managed |
| **Agent Count** | 1,300+ (14 states) | 340,000+ (post-Anywhere merger) | 350+ (Texas) |
| **Annual Volume** | $5.3B | ~$300B+ (combined entity) | Part of SIR's $182B global |
| **Retention** | 99% | Not published | Not published |
| **Monthly Tech Cost to Agent** | Included in splits | Included in splits | Included in splits |

### Key Takeaways from the Big Three

1. **Compass** is genuinely a tech company — $1.6B invested, 320+ engineers, everything built in-house. You can't replicate their scale, but you can replicate their *concepts* (client portal, AI follow-up, predictive selling).

2. **Serhant** proves you don't need to build everything — they white-label best-in-class tools (Rechat, Luxury Presence, TotalBrokerage) and wrap them with proprietary AI (S.MPLE). Their secret weapon is *content* (Netflix, 100M social impressions).

3. **Kuper Sotheby's** rides the global brand — 18 apps in the CURRENT suite, automatic syndication to elite media, global referral network. Their tech is provided by the parent, not built in-house.

**The Serhant model is closest to what you should follow:** Best-in-class affordable tools + proprietary differentiators (SuperSearch) + content/brand as the lead engine.

---

## Part 2: Your Current Stack Assessment

### What You Have (KEEP)

| Tool | Cost | Verdict | Why |
|---|---|---|---|
| **GoHighLevel** | $79-150/mo | **KEEP** | CRM, pipeline, automation, email/SMS, funnels — covers 80% of what Follow Up Boss + marketing automation does. At $150/mo for a team of 4, this is a steal. |
| **myCRMSIM** | ~$20-30/mo | **KEEP** | iMessage integration into GHL is a huge advantage — personal, high open rates, not available on most CRMs |
| **AtlasCRE / SuperSearch** | $0 (self-built) | **KEEP + EXPAND** | This is your proprietary differentiator. No other Austin brokerage has a search tool that shows more listings than Zillow with a live comparison. |

**Current monthly cost: ~$130-180/mo** — This is exceptional for what you're getting.

### What You Need to Add

| Need | Build vs Buy | Recommendation | Est. Cost |
|---|---|---|---|
| **Website with IDX** | **BUILD** | Custom Next.js site with MLS IDX feed + SuperSearch | ~$30/mo hosting (Vercel + domain) |
| **IDX Data Feed** | **BUY** | MLS IDX feed from your local MLS (ACTRIS/Austin) or aggregator like MLS Grid / Spark API | ~$50-100/mo |
| **Transaction Management** | **BUY** | Dotloop ($31/mo) or SkySlope ($25/mo per agent) | ~$31-100/mo |
| **Listing Marketing** | **USE FREE + AI** | Canva Pro ($13/mo) + AI-generated content | ~$13/mo |
| **Virtual Tours** | **BUY** | Zillow 3D Home (free) for standard, Matterport for luxury | $0-50/mo |
| **Showing Management** | **BUY** | ShowingTime ($15/mo per agent) | ~$60/mo |
| **AI Assistant** | **BUILD** | Claude/GPT-powered assistant for listing descriptions, follow-up drafts, lead scoring | ~$20-50/mo API costs |
| **Homeowner Nurture** | **BUY** | Homebot (free for agents) — monthly home value digest keeps you top-of-mind with sphere | $0 |

### What You DON'T Need

- **Separate CRM** — GoHighLevel already does this
- **Separate email marketing** — GHL has this built in
- **Separate landing page builder** — GHL has this
- **Separate appointment scheduling** — GHL has this
- **Lead gen ads platform** — GHL can run this, or run Meta/Google ads yourself
- **Expensive website** — $200/mo IDX websites are overpriced for what they deliver

---

## Part 3: The Custom Website — Build vs Buy

### Why Build ($30/mo vs $200/mo)

You already have most of the tech in AtlasCRE. Here's what a custom brokerage website gives you:

| Feature | $200/mo IDX Site (Luxury Presence, etc.) | Custom Build (AtlasCRE-based) |
|---|---|---|
| MLS listings display | Yes | Yes (via IDX feed) |
| Map search | Basic | Advanced (MapLibre, draw-to-search) |
| SuperSearch comparison | No | **Yes — exclusive to you** |
| Lead capture | Basic forms | Custom — behavioral tracking, what they viewed, search history sent to GHL |
| Design control | Template-based | Full control |
| Branding | Limited customization | Fully branded |
| SEO | Decent | Full control (Next.js SSR is great for SEO) |
| Monthly cost | $200+/mo | ~$30/mo (Vercel Pro + domain) |
| Ongoing updates | Wait for vendor | Ship same day |

### The SuperSearch Lead Capture Flow

This is your competitive moat — no other Austin brokerage has this:

```
Buyer visits your site
    |
    v
Searches by zip/city (standard IDX results)
    |
    v
Sees: "SuperSearch found 847 listings | Zillow shows 612"
    |
    v
"Register to see 235 listings not on Zillow" <-- LEAD CAPTURE GATE
    |
    v
Lead captured --> pushed to GoHighLevel via API/webhook
    |
    v
GHL automation: instant text via myCRMSIM + drip sequence
    |
    v
Agent gets notification: "New lead — viewed 3BR homes in 78704, budget $400-500K"
```

**This is exactly what Compass does with Private Exclusives** — they gate premium listings behind registration. You're doing the same thing but with *comprehensiveness* as the hook instead of *exclusivity*.

### Website Tech Stack

Already built / in progress:
- **Framework**: Next.js (App Router) — already set up in AtlasCRE
- **Database**: Neon PostgreSQL + Prisma — already running
- **Maps**: MapLibre GL (free, open-source) — already integrated
- **Hosting**: Vercel — already deployed

Still needed:
- **IDX Feed**: Connect to ACTRIS (Austin MLS) via RESO Web API or a bridge like MLS Grid/Spark API
- **Public-facing pages**: Home page, search, listing detail, agent profiles, neighborhood pages
- **Lead capture forms**: Registration gate, contact forms, saved search alerts
- **GHL integration**: Webhook to push leads + their search behavior into GoHighLevel
- **SEO pages**: Neighborhood/zip code landing pages (huge for organic Google traffic)

---

## Part 4: The Complete Affordable Stack

### Monthly Cost Breakdown

| Tool | Purpose | Monthly Cost |
|---|---|---|
| GoHighLevel (team) | CRM, automation, email/SMS, funnels, pipeline | $150 |
| myCRMSIM | iMessage integration | ~$25 |
| Custom website (Vercel Pro) | Brokerage site + SuperSearch | $20 |
| Domain + DNS | shapirogroup.co or similar | ~$2 |
| IDX data feed | MLS listings on your site | ~$50-100 |
| Dotloop (team) | Transaction management + e-signatures | $31 |
| Canva Pro | Listing flyers, social content | $13 |
| Homebot | Sphere nurture (home value digests) | $0 |
| Zillow 3D Home | Virtual tours (basic) | $0 |
| Claude/OpenAI API | AI assistant for content + lead scoring | ~$30 |
| **TOTAL** | | **~$320-370/mo** |

### vs. What Others Pay

| Approach | Monthly Cost |
|---|---|
| **Your stack (above)** | **$320-370/mo** |
| Follow Up Boss + Ylopo + IDX site + Dotloop | $1,200-1,800/mo |
| kvCORE/BoldTrail all-in-one | $800-1,200/mo |
| Luxury Presence + Follow Up Boss + SkySlope | $1,500-2,000/mo |
| Compass (included in higher splits) | $0/mo visible, but 20-30% higher split = thousands/deal |

**You'd be running a tech stack comparable to a $1,500/mo setup for under $400/mo**, plus you own the code and the data.

---

## Part 5: Build Roadmap — FULL COMPETITIVE PLATFORM

### The Goal: Not 80%. Not 100%. More.

Everything Compass, Serhant, and Kuper Sotheby's can do — plus proprietary data advantages none of them have.

---

### Phase 1: Public Website + SuperSearch Lead Engine (Weeks 1-3)
*Start capturing leads immediately*

**Website Core:**
- [ ] Public homepage — clean, luxury-feeling, branded for Shapiro Group
- [ ] Listing search page with SuperSearch comparison bar
- [ ] Listing detail pages with full photos, maps, details, contact forms
- [ ] Agent profile pages (team of 4, each with their own page)
- [ ] Mobile-first responsive design
- [ ] SEO: Neighborhood/zip code landing pages (auto-generated for every Austin zip)

**IDX + Data:**
- [ ] Connect IDX feed from ACTRIS (Austin MLS) via RESO Web API
- [ ] Merge IDX data with existing scraped data (Realtor.com, ALN, LoopNet)
- [ ] SuperSearch comparison: "SuperSearch: 847 listings | Zillow: 612"
- [ ] Registration gate: "See 235 listings not on Zillow — create free account"

**Lead Capture + GHL Integration:**
- [ ] Webhook to GoHighLevel on registration
- [ ] Pass behavioral data: what they searched, what they viewed, what they saved
- [ ] Auto-tag leads in GHL (buyer/seller, price range, neighborhoods, search mode)
- [ ] Trigger GHL automation: instant iMessage via myCRMSIM + drip sequence

---

### Phase 2: Proprietary Data Moat — The Intelligence Engine (Weeks 3-6)
*This is what nobody else has*

**Multi-Source Listing Ingestion:**
- [ ] Email parser: Forward broker emails / pocket listing blasts → auto-extract listing data
- [ ] ALN (Austin Luxury Network) scraper: Pull exclusive luxury listings
- [ ] Social media monitor: Instagram, Facebook, TikTok — detect listing posts from top agents
- [ ] Clubhouse/networking event data capture
- [ ] Manual entry form: Quick-add for listings agents hear about verbally

**Top 1,000 Agent Monitoring System:**
- [ ] Build a curated list of the top 1,000 agents in the Austin metro
- [ ] Monitor their Instagram, Facebook, TikTok, LinkedIn for:
  - New listing announcements (especially off-market / pocket listings)
  - Sold announcements with prices
  - Coming soon teasers
  - Market commentary / pricing intel
- [ ] AI-powered post classification: Is this a listing? A sold? Market intel? Personal?
- [ ] Auto-ingest detected listings into SuperSearch database
- [ ] Alert your agents: "Agent X just posted a pocket listing at 123 Main St — 4BR/3BA, ~$850K"

**Proprietary Sold Database:**
- [ ] Compile sold data from MLS, social media posts, ALN, broker announcements
- [ ] Include off-market solds that never hit MLS
- [ ] Searchable by address, zip, neighborhood, price range, date, beds/baths
- [ ] Powers better CMAs than anyone using MLS-only data
- [ ] Historical price tracking per neighborhood

**Data Deduplication + Quality:**
- [ ] Fuzzy matching to prevent duplicate listings from multiple sources
- [ ] Source attribution: "Found on MLS + spotted on @agent_jane's Instagram"
- [ ] Confidence scoring: MLS-sourced = high confidence, social media = needs verification
- [ ] Agent verification workflow: Flag uncertain listings for human review

---

### Phase 3: Agent Command Center (Weeks 6-9)
*Match Compass's agent tools + Serhant's S.MPLE*

**Agent Dashboard:**
- [ ] Login for each agent with their assigned leads
- [ ] Activity feed: "Lead John viewed 3BR homes in 78704 three times today"
- [ ] Hot lead alerts pushed to phone (like Compass's proactive AI)
- [ ] Pipeline board: leads → active clients → under contract → closed
- [ ] Team leaderboard: GCI, deals closed, leads converted

**Saved Searches + Alerts (Match Compass Collections):**
- [ ] Buyers save searches → get email/text when new matches appear
- [ ] Agents create curated "Collections" for clients (like Compass)
- [ ] Sharable collection links — client can view, comment, favorite
- [ ] Real-time updates when new listings match collection criteria

**CMA Tool (Match/Beat Compass CMA):**
- [ ] Pull comp data from MLS + your proprietary sold database
- [ ] AI-suggested adjustments (like Compass's ML-powered adjustments)
- [ ] Side-by-side comparison views
- [ ] Beautiful, shareable PDF/web report
- [ ] Include off-market solds that Compass CMA can't access

**Listing Presentations:**
- [ ] Template-based listing presentation builder
- [ ] Auto-pull market data, comps, neighborhood stats
- [ ] Include SuperSearch advantage: "Our platform shows buyers more listings than Zillow"
- [ ] Export to PDF or share as web link

---

### Phase 4: AI Assistant — "Atlas AI" (Weeks 9-12)
*Match S.MPLE + Compass AI 2.0*

**Content Generation:**
- [ ] Listing descriptions: Input property details + photos → MLS-ready copy
- [ ] Social media posts: Auto-generate from new listings with hashtags, market stats
- [ ] Email campaigns: Personalized drip content based on lead behavior
- [ ] Market reports: Weekly neighborhood summaries, auto-generated

**Smart Follow-Up:**
- [ ] AI drafts personalized follow-up messages based on lead behavior
- [ ] "John viewed 4 homes in Westlake this week — here's a draft text about the new listing at 123 Oak"
- [ ] Agent reviews and sends (one tap) via myCRMSIM / iMessage
- [ ] AI lead scoring: hot/warm/cold based on recency, frequency, price alignment

**Voice-to-Action (Like S.MPLE):**
- [ ] Agent records voice note after showing/meeting
- [ ] AI transcribes and extracts: contact info, follow-up tasks, listing notes
- [ ] Auto-updates GHL contact record
- [ ] Schedules follow-up reminders
- [ ] Drafts follow-up message for agent approval

**Predictive Intelligence:**
- [ ] "Likely to Sell" model for your sphere (like Compass)
- [ ] Track homeowners in your database: how long owned, estimated equity, life events
- [ ] Surface top 50 most likely sellers each month
- [ ] Auto-trigger nurture sequences for likely sellers

---

### Phase 5: Client Experience Portal (Weeks 12-16)
*Match Compass One*

**Buyer Portal:**
- [ ] Personalized dashboard after registration
- [ ] Saved searches, favorited listings, collection boards
- [ ] Search history and recommendations ("Based on what you've viewed...")
- [ ] Direct messaging with their agent
- [ ] Showing request button → auto-schedules via ShowingTime or direct
- [ ] Mortgage calculator, neighborhood data, school ratings

**Transaction Portal (Under Contract):**
- [ ] Timeline: offer → inspection → appraisal → title → close
- [ ] Task list for buyer (upload docs, schedule inspection, etc.)
- [ ] Document sharing (secure)
- [ ] Real-time status updates
- [ ] Connected to Dotloop for e-signatures

**Seller Portal:**
- [ ] Live showing feedback from agents/buyers
- [ ] Marketing activity report: views, saves, inquiries
- [ ] Comp updates and market position analysis
- [ ] Offer management dashboard (when offers come in)

---

### Phase 6: Marketing Engine (Weeks 12-16, parallel with Phase 5)
*Match Serhant Studios + Compass Marketing Center*

**Automated Listing Marketing:**
- [ ] New listing → auto-generate: flyer, social post, email blast, web page
- [ ] Just Sold → auto-generate: social post, email to sphere, price update in sold DB
- [ ] Open House → auto-generate: invite, social post, sign-up page, follow-up sequence
- [ ] Price reduction → auto-notify saved-search matches + retarget previous viewers

**Social Media Automation:**
- [ ] Auto-post new listings to agent's Instagram/Facebook/TikTok
- [ ] Market update templates (weekly/monthly)
- [ ] Agent branding consistency across all channels
- [ ] Content calendar with AI-suggested topics

**Video Tools:**
- [ ] Listing video generator: photos + AI voiceover + music → 30-60 sec video
- [ ] Market update video templates
- [ ] Virtual tour integration (Matterport / Zillow 3D)

---

### Phase 7: Back Office + Analytics (Weeks 16-20)
*Match TotalBrokerage + Compass Business Tracker*

**Commission Tracking:**
- [ ] Track deals from contract to close to commission payment
- [ ] Support split structures, caps, referral fees
- [ ] Agent commission statements
- [ ] Integration with QuickBooks or similar

**Business Analytics:**
- [ ] Team performance dashboard: GCI, deals, conversion rates, avg sale price
- [ ] Lead source ROI: which channels produce the most closed deals?
- [ ] Marketing ROI: which listings got most views, fastest sales?
- [ ] Market analytics: price trends, DOM trends, inventory by neighborhood

**Compliance:**
- [ ] Document checklist per transaction type
- [ ] Missing document alerts
- [ ] Audit trail

---

### Phase 8: Expansion Features (Months 5+)
*Go beyond what anyone else has*

- [ ] **Agent recruitment tool**: Show prospective agents the tech stack as a recruiting advantage
- [ ] **Referral network**: Connect with agents in other markets for referral fee income
- [ ] **Property valuation API**: Offer instant valuations on your website (using your proprietary sold data)
- [ ] **Investment analysis tool**: Cash flow, cap rate, ROI calculations for investor clients
- [ ] **Direct MLS access**: Replace IDX feed with RESO Web API direct connection (when you scale)
- [ ] **White-label offering**: License your tech stack to other brokerages (like Serhant licenses S.MPLE)
- [ ] **Mobile app**: Native iOS/Android app for clients (push notifications, saved searches, showing requests)

---

## Part 6: Integrations Map

```
                    YOUR WEBSITE (Next.js/Vercel)
                    - SuperSearch engine
                    - IDX listing display
                    - Lead capture forms
                    - Neighborhood SEO pages
                           |
                    [Webhook: new lead + behavior data]
                           |
                           v
                    GOHIGHLEVEL (CRM Hub)
                    - Contact management
                    - Pipeline stages
                    - Drip sequences
                    - Email campaigns
                    - Appointment booking
                    - Funnels/landing pages
                           |
              +------------+------------+
              |            |            |
              v            v            v
         myCRMSIM     Dotloop      Homebot
         (iMessage)   (Transactions) (Sphere nurture)
              |            |
              v            v
         Personal      E-signatures
         texting       Compliance
         from agent    Document mgmt

    SUPPORTING TOOLS:
    - Canva Pro (marketing collateral)
    - Claude API (AI content + lead scoring)
    - Zillow 3D / Matterport (virtual tours)
    - ShowingTime (showing scheduling)
```

---

## Part 7: What Makes This Competitive

### You Match or Beat the Big Three On:

| Capability | Sirhant | Compass | Kuper | You |
|---|---|---|---|---|
| Comprehensive listing search | IDX only | IDX + Private Exclusives | Global SIR platform | **SuperSearch (more than Zillow)** |
| Lead capture from search | Standard | Registration gate | Standard | **"See X more listings" gate** |
| CRM + automation | Rechat | Proprietary | Cloze | **GoHighLevel (comparable)** |
| Personal texting | Standard SMS | Standard SMS | Standard SMS | **iMessage via myCRMSIM** |
| AI follow-up | S.MPLE | Compass AI 2.0 | Basic | **Claude API (buildable)** |
| Transaction mgmt | TotalBrokerage | Glide | Dotloop/SkySlope | **Dotloop** |
| Listing marketing | In-house Studios | Marketing Center | Design Vault | **Canva + AI** |
| Monthly tech cost | Included (high splits) | Included (high splits) | Included (high splits) | **~$350/mo (low splits)** |
| Code ownership | No | No | No | **Yes — you own everything** |

### Your Unique Advantages:

1. **SuperSearch** — No other Austin brokerage shows buyers they have more listings than Zillow
2. **iMessage** — myCRMSIM gives you the highest-open-rate channel (98% vs 20% email)
3. **Cost structure** — $350/mo vs thousands means you keep more per deal
4. **Speed** — You can ship features in days, not quarters (no enterprise bureaucracy)
5. **Data ownership** — You own your lead data, search behavior data, and listing data — not locked in a vendor

---

*Next step: Start Phase 1 — design the public-facing website and connect the IDX feed.*
