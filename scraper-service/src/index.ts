import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { chromium } from "playwright";
import { scrapeLoopNet } from "./scrapers/loopnet";
import { scrapeALN } from "./scrapers/aln";

const app = express();
app.use(express.json());

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

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Atlas CRE scraper service running on port ${PORT}`);
});
