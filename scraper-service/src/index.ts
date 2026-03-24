import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { chromium } from "playwright";
import { scrapeLoopNet } from "./scrapers/loopnet";
import { scrapeALN, TWO_FA_PENDING_FILE } from "./scrapers/aln";
import fs from "fs";

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
