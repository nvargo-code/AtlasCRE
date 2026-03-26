import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { chromium } from "playwright";
import { scrapeLoopNet } from "./scrapers/loopnet";
import { scrapeALN, TWO_FA_PENDING_FILE } from "./scrapers/aln";
import { NormalizedListing } from "./types";
import fs from "fs";

const app = express();
app.use(express.json());

// ── Job storage ───────────────────────────────────────────────────────────────
interface ScraperJob {
  id: string;
  status: "running" | "complete" | "error";
  listings?: NormalizedListing[];
  error?: string;
}
const jobs = new Map<string, ScraperJob>();

const PORT = process.env.PORT ?? 3333;
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!SCRAPER_SECRET) {
    next();
    return;
  }
  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${SCRAPER_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── LoopNet scrape ────────────────────────────────────────────────────────────
app.post("/scrape/loopnet", requireAuth, async (req: Request, res: Response) => {
  const market = req.body?.market as "austin" | "dfw" | undefined;
  if (!market || !["austin", "dfw"].includes(market)) {
    res.status(400).json({ error: "market must be 'austin' or 'dfw'" });
    return;
  }

  console.log(`[loopnet] Starting scrape for market=${market}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const listings = await scrapeLoopNet(browser, market);
    res.json(listings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[loopnet] Error:", msg);
    res.status(500).json({ error: msg });
  } finally {
    await browser.close();
  }
});

// ── ALN scrape ────────────────────────────────────────────────────────────────
app.post("/scrape/aln", requireAuth, async (_req: Request, res: Response) => {
  console.log("[aln] Starting scrape...");

  const browser = await chromium.launch({ headless: true });
  try {
    const listings = await scrapeALN(browser);
    res.json(listings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[aln] Error:", msg);
    res.status(500).json({ error: msg });
  } finally {
    await browser.close();
  }
});

// ── ALN async job routes ──────────────────────────────────────────────────────

// POST /scrape/aln/start — fire and forget, returns jobId immediately
app.post("/scrape/aln/start", requireAuth, (_req: Request, res: Response) => {
  const jobId = `aln-${Date.now()}`;
  jobs.set(jobId, { id: jobId, status: "running" });

  const launchArgs = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];
  chromium.launch({ headless: true, args: launchArgs }).then(browser =>
    scrapeALN(browser)
      .then(listings => {
        jobs.set(jobId, { id: jobId, status: "complete", listings });
        console.log(`[aln] Job ${jobId} complete: ${listings.length} listings`);
      })
      .catch(err => {
        // Try to recover partial results saved during scrape
        let partial: NormalizedListing[] = [];
        try { partial = JSON.parse(fs.readFileSync("/tmp/aln-listings.json", "utf8")); } catch {}
        if (partial.length > 0) {
          jobs.set(jobId, { id: jobId, status: "complete", listings: partial });
          console.log(`[aln] Job ${jobId} recovered ${partial.length} partial listings after error: ${err}`);
        } else {
          jobs.set(jobId, { id: jobId, status: "error", error: String(err) });
          console.error(`[aln] Job ${jobId} error:`, err);
        }
      })
      .finally(() => browser.close())
  ).catch(err => {
    jobs.set(jobId, { id: jobId, status: "error", error: String(err) });
  });

  console.log(`[aln] Started async job ${jobId}`);
  res.json({ jobId });
});

// GET /scrape/aln/job/:jobId — poll job status
app.get("/scrape/aln/job/:jobId", requireAuth, (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  // Don't include listings in status poll (too large) — only on complete fetch
  const { listings, ...meta } = job;
  res.json({ ...meta, listingCount: listings?.length });
});

// GET /scrape/aln/job/:jobId/results — fetch completed listings
app.get("/scrape/aln/job/:jobId/results", requireAuth, (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  if (job.status !== "complete") { res.status(409).json({ error: "Job not complete", status: job.status }); return; }
  res.json(job.listings ?? []);
  // Clean up after fetching results
  jobs.delete(req.params.jobId);
});

// ── ALN 2FA endpoints ─────────────────────────────────────────────────────────

// Returns whether the ALN scraper is currently waiting for a 2FA code
app.get("/2fa/aln/pending", requireAuth, (_req: Request, res: Response) => {
  const pending = fs.existsSync(TWO_FA_PENDING_FILE);
  res.json({ pending });
});

// Accepts a 2FA code from the admin UI and writes it to the polling file
app.post("/2fa/aln", requireAuth, (req: Request, res: Response) => {
  const code = req.body?.code as string | undefined;
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }
  fs.writeFileSync("/tmp/aln-2fa-code.txt", code.trim());
  console.log("[aln] 2FA code received via HTTP");
  res.json({ ok: true });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Atlas CRE scraper service running on port ${PORT}`);
});
