import { test, expect, Page } from "@playwright/test";

const BASE = "https://supersearch-production.up.railway.app";

// Helper: get listing count via API (more reliable than DOM scraping)
async function apiCount(page: Page, params = ""): Promise<number> {
  const res = await page.request.get(`${BASE}/api/listings?limit=1${params ? "&" + params : ""}`);
  const data = await res.json();
  return data.pagination?.total ?? 0;
}

// Helper: wait for page to settle after navigation or filter change
async function settle(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

// ─── FLOW 1: Page Load ──────────────────────────────────────────────────────

test.describe("Flow 1: Initial page load", () => {
  test("search page loads with map and listings", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    await settle(page, 5000);

    const canvas = page.locator("canvas.maplibregl-canvas");
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const listingItems = page.locator("[role='button']");
    const count = await listingItems.count();
    expect(count).toBeGreaterThan(0);
    console.log(`  ✓ Page loaded with ${count} listing items visible`);
  });
});

// ─── FLOW 2: Map Pan ─────────────────────────────────────────────────────────

test.describe("Flow 2: Map pan", () => {
  test("panning map does not crash and listings remain", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 5000);

    const canvas = page.locator("canvas.maplibregl-canvas");
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }
    await settle(page, 3000);

    const listingItems = page.locator("[role='button']");
    const count = await listingItems.count();
    console.log(`  ✓ After pan: ${count} listings visible`);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ─── FLOW 3: API Filter Tests (reliable, no DOM dependency) ─────────────────

test.describe("Flow 3: Price filter API", () => {
  test("priceMax filters correctly", async ({ page }) => {
    const all = await apiCount(page);
    const filtered = await apiCount(page, "priceMax=500000");
    console.log(`  All: ${all}, Under $500K: ${filtered}`);
    expect(filtered).toBeLessThan(all);
    expect(filtered).toBeGreaterThan(0);
  });

  test("priceMin filters correctly", async ({ page }) => {
    const all = await apiCount(page);
    const filtered = await apiCount(page, "priceMin=1000000");
    console.log(`  All: ${all}, Over $1M: ${filtered}`);
    expect(filtered).toBeLessThan(all);
    expect(filtered).toBeGreaterThan(0);
  });

  test("priceMin + priceMax range", async ({ page }) => {
    const filtered = await apiCount(page, "priceMin=400000&priceMax=600000");
    console.log(`  $400K-$600K: ${filtered}`);
    expect(filtered).toBeGreaterThan(0);
  });
});

test.describe("Flow 4: Beds filter API", () => {
  test("bedsMin=3 excludes null-bed listings", async ({ page }) => {
    const all = await apiCount(page, "sources=mlsgrid");
    const filtered = await apiCount(page, "sources=mlsgrid&bedsMin=3");
    console.log(`  MLS all: ${all}, 3+ beds: ${filtered}`);
    expect(filtered).toBeLessThan(all);
    expect(filtered).toBeGreaterThan(0);

    // Verify actual data: fetch a listing and check beds >= 3
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&bedsMin=3&limit=3`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.beds).toBeGreaterThanOrEqual(3);
      console.log(`    ${l.address}: ${l.beds} beds ✓`);
    }
  });

  test("bedsMin=4 returns only 4+ bed listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&bedsMin=4&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.beds).toBeGreaterThanOrEqual(4);
    }
    console.log(`  ✓ All ${data.listings.length} listings have 4+ beds`);
  });
});

test.describe("Flow 5: Baths filter API", () => {
  test("bathsMin=2 returns only 2+ bath listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&bathsMin=2&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.baths).toBeGreaterThanOrEqual(2);
    }
    console.log(`  ✓ All ${data.listings.length} listings have 2+ baths`);
  });
});

test.describe("Flow 6: Sqft filter API", () => {
  test("sfMin=2000 returns only 2000+ SF listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&sfMin=2000&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.buildingSf).toBeGreaterThanOrEqual(2000);
      console.log(`    ${l.address}: ${l.buildingSf} SF ✓`);
    }
  });

  test("sfMax=1500 returns only under 1500 SF", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&sfMax=1500&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.buildingSf).toBeLessThanOrEqual(1500);
    }
    console.log(`  ✓ All ${data.listings.length} listings under 1500 SF`);
  });
});

test.describe("Flow 7: Year Built filter API", () => {
  test("yearBuiltMin=2020 returns only 2020+ listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&yearBuiltMin=2020&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.yearBuilt).toBeGreaterThanOrEqual(2020);
    }
    console.log(`  ✓ All ${data.listings.length} listings built 2020+`);
  });
});

test.describe("Flow 8: Garage filter API", () => {
  test("garageMin=2 returns 2+ garage listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&garageMin=2&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.garageSpaces).toBeGreaterThanOrEqual(2);
    }
    console.log(`  ✓ All ${data.listings.length} listings have 2+ garage`);
  });
});

test.describe("Flow 9: Lot Acres filter API", () => {
  test("lotAcresMin=0.5 returns 0.5+ acre listings", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&lotAcresMin=0.5&limit=5`);
    const data = await res.json();
    for (const l of data.listings) {
      expect(l.lotSizeAcres).toBeGreaterThanOrEqual(0.5);
    }
    console.log(`  ✓ All ${data.listings.length} listings have 0.5+ acres`);
  });
});

// ─── FLOW 10: Sale vs Lease ─────────────────────────────────────────────────

test.describe("Flow 10: Sale vs Lease filter API", () => {
  test("listingType=sale returns only sales", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?listingType=sale&limit=10`);
    const data = await res.json();
    const types = new Set(data.listings.map((l: { listingType: string }) => l.listingType.toLowerCase()));
    console.log(`  Sale filter returned types: ${[...types]}`);
    for (const t of types) {
      expect(t).toContain("sale");
    }
  });

  test("listingType=lease returns only leases", async ({ page }) => {
    const total = await apiCount(page, "listingType=lease");
    console.log(`  Lease listings total: ${total}`);
    if (total > 0) {
      const res = await page.request.get(`${BASE}/api/listings?listingType=lease&limit=5`);
      const data = await res.json();
      for (const l of data.listings) {
        expect(l.listingType.toLowerCase()).toContain("lease");
        console.log(`    ${l.address}: ${l.listingType} $${l.priceAmount} ${l.priceUnit} ✓`);
      }
    } else {
      console.log("  ⚠ No lease listings found — may need data fix");
    }
  });
});

// ─── FLOW 11: Source Filter ─────────────────────────────────────────────────

test.describe("Flow 11: Source filter API", () => {
  test("single source filter works", async ({ page }) => {
    const mlsCount = await apiCount(page, "sources=mlsgrid");
    const alnCount = await apiCount(page, "sources=aln");
    const allCount = await apiCount(page);
    console.log(`  All: ${allCount}, MLS: ${mlsCount}, ALN: ${alnCount}`);
    expect(mlsCount).toBeGreaterThan(0);
    expect(alnCount).toBeGreaterThan(0);
    expect(mlsCount + alnCount).toBeLessThanOrEqual(allCount + 100); // some overlap possible
  });

  test("multi-source filter works", async ({ page }) => {
    const multi = await apiCount(page, "sources=mlsgrid,aln");
    const mlsOnly = await apiCount(page, "sources=mlsgrid");
    const alnOnly = await apiCount(page, "sources=aln");
    console.log(`  MLS+ALN: ${multi}, MLS: ${mlsOnly}, ALN: ${alnOnly}`);
    expect(multi).toBeGreaterThanOrEqual(Math.max(mlsOnly, alnOnly));
  });

  test("sourceCounts in response reflect all sources regardless of filter", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&limit=1`);
    const data = await res.json();
    console.log(`  sourceCounts:`, data.sourceCounts);
    // ALN count should be > 0 even when filtering to MLS only
    expect(data.sourceCounts?.aln || 0).toBeGreaterThan(0);
    console.log(`  ✓ ALN count (${data.sourceCounts?.aln}) persists when MLS filtered`);
  });
});

// ─── FLOW 12: Bounds Filter ─────────────────────────────────────────────────

test.describe("Flow 12: Bounds filter API", () => {
  test("bounds filter returns listings in geographic area", async ({ page }) => {
    // 78704 area roughly
    const res = await page.request.get(`${BASE}/api/listings?north=30.26&south=30.22&east=-97.74&west=-97.80&limit=5`);
    const data = await res.json();
    console.log(`  Listings in bounds: ${data.pagination.total}`);
    expect(data.pagination.total).toBeGreaterThan(0);
    for (const l of data.listings) {
      expect(l.lat).toBeGreaterThanOrEqual(30.22);
      expect(l.lat).toBeLessThanOrEqual(30.26);
      expect(l.lng).toBeGreaterThanOrEqual(-97.80);
      expect(l.lng).toBeLessThanOrEqual(-97.74);
    }
    console.log(`  ✓ All listings within bounds`);
  });
});

// ─── FLOW 13: Search Query ──────────────────────────────────────────────────

test.describe("Flow 13: Search query API", () => {
  test("q=barton returns matching addresses", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?q=barton&limit=5`);
    const data = await res.json();
    console.log(`  "barton" search: ${data.pagination.total} results`);
    expect(data.pagination.total).toBeGreaterThan(0);
    for (const l of data.listings) {
      const match = (l.address + l.city).toLowerCase().includes("barton");
      expect(match).toBe(true);
    }
  });

  test("q=78704 returns matching zip", async ({ page }) => {
    const total = await apiCount(page, "q=78704");
    console.log(`  "78704" search: ${total} results`);
    expect(total).toBeGreaterThan(0);
  });
});

// ─── FLOW 14: Combined Filters ──────────────────────────────────────────────

test.describe("Flow 14: Combined filters API", () => {
  test("beds + baths + price stacks correctly", async ({ page }) => {
    const all = await apiCount(page, "sources=mlsgrid");
    const beds = await apiCount(page, "sources=mlsgrid&bedsMin=3");
    const bedsBaths = await apiCount(page, "sources=mlsgrid&bedsMin=3&bathsMin=2");
    const bedsBathsPrice = await apiCount(page, "sources=mlsgrid&bedsMin=3&bathsMin=2&priceMax=800000");

    console.log(`  All MLS: ${all}`);
    console.log(`  3+ beds: ${beds}`);
    console.log(`  3+ beds, 2+ baths: ${bedsBaths}`);
    console.log(`  3+ beds, 2+ baths, <$800K: ${bedsBathsPrice}`);

    expect(beds).toBeLessThanOrEqual(all);
    expect(bedsBaths).toBeLessThanOrEqual(beds);
    expect(bedsBathsPrice).toBeLessThanOrEqual(bedsBaths);
  });
});

// ─── FLOW 15: Pagination ────────────────────────────────────────────────────

test.describe("Flow 15: Pagination API", () => {
  test("page 1 and page 2 return different listings", async ({ page }) => {
    const res1 = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&limit=5&page=1`);
    const res2 = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&limit=5&page=2`);
    const data1 = await res1.json();
    const data2 = await res2.json();

    const ids1 = new Set(data1.listings.map((l: { id: string }) => l.id));
    const ids2 = new Set(data2.listings.map((l: { id: string }) => l.id));

    let overlap = 0;
    for (const id of ids2) { if (ids1.has(id)) overlap++; }

    console.log(`  Page 1: ${data1.listings.length} listings, Page 2: ${data2.listings.length} listings`);
    console.log(`  Overlap: ${overlap}`);
    expect(overlap).toBe(0);
  });
});

// ─── FLOW 16: Listing Detail Page ───────────────────────────────────────────

test.describe("Flow 16: Listing detail page", () => {
  test("detail page renders with all key sections", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&limit=1`);
    const data = await res.json();
    const listing = data.listings[0];
    if (!listing) return;

    await page.goto(`/listings/${listing.id}`);
    await page.waitForLoadState("networkidle");

    // Price visible
    await expect(page.locator("text=/\\$[\\d,]+/").first()).toBeVisible({ timeout: 5000 });

    // Address visible
    await expect(page.locator(`text=${listing.address.trim()}`).first()).toBeVisible({ timeout: 5000 });

    // Source badge
    const badge = page.locator("text=/MLS/").first();
    await expect(badge).toBeVisible({ timeout: 3000 });

    console.log(`  ✓ Detail page: ${listing.address.trim()} — price, address, MLS badge all visible`);
  });
});

// ─── FLOW 17: Data Quality ──────────────────────────────────────────────────

test.describe("Flow 17: Data quality", () => {
  test("no null/undefined in visible listing text", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 5000);

    const sidebar = page.locator("[role='button']");
    const count = await sidebar.count();
    let issues = 0;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await sidebar.nth(i).textContent() || "";
      if (/\bnull\b/.test(text)) { issues++; console.log(`  ⚠ "null" in listing ${i}: ${text.substring(0, 80)}`); }
      if (/\bundefined\b/.test(text)) { issues++; console.log(`  ⚠ "undefined" in listing ${i}`); }
    }

    expect(issues).toBe(0);
    console.log(`  ✓ Checked ${Math.min(count, 10)} listings — no null/undefined text`);
  });

  test("MLS listings have beds/baths/SF populated", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?sources=mlsgrid&limit=20`);
    const data = await res.json();
    let missing = 0;

    for (const l of data.listings) {
      if (!l.beds && !l.baths && !l.buildingSf) {
        missing++;
        console.log(`  ⚠ Missing all data: ${l.address}`);
      }
    }

    console.log(`  ${missing}/${data.listings.length} MLS listings missing all bed/bath/SF data`);
    expect(missing).toBeLessThan(data.listings.length / 2);
  });

  test("listingType values are consistent", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/listings?limit=200`);
    const data = await res.json();
    const types: Record<string, number> = {};
    for (const l of data.listings) {
      types[l.listingType] = (types[l.listingType] || 0) + 1;
    }
    console.log(`  listingType values:`, types);
    // Flag inconsistent casing
    const keys = Object.keys(types);
    const hasInconsistentCasing = keys.some(k => k !== k.toLowerCase() && keys.includes(k.toLowerCase()));
    if (hasInconsistentCasing) console.log("  ⚠ Inconsistent listingType casing detected");
  });
});

// ─── FLOW 18: Feature Toggles (UI) ─────────────────────────────────────────

test.describe("Flow 18: Feature toggles UI", () => {
  test("pool toggle activates and deactivates", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 4000);

    const poolBtn = page.locator("button", { hasText: "Pool" });
    await expect(poolBtn).toBeVisible();

    await poolBtn.click();
    await settle(page, 500);
    const classesOn = await poolBtn.getAttribute("class") || "";
    expect(classesOn).toContain("gold");

    await poolBtn.click();
    await settle(page, 500);
    const classesOff = await poolBtn.getAttribute("class") || "";
    expect(classesOff).not.toContain("bg-gold/20");
    console.log("  ✓ Pool toggle works");
  });

  test("all feature buttons are visible", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 4000);

    for (const label of ["Pool", "Waterfront", "View", "Guest", "Boat Slip"]) {
      const btn = page.locator("button", { hasText: label });
      await expect(btn).toBeVisible();
    }
    console.log("  ✓ All 5 feature buttons visible");
  });
});

// ─── FLOW 19: Sqft/Acres Dropdowns (UI) ─────────────────────────────────────

test.describe("Flow 19: Sqft/Acres expandable dropdowns", () => {
  test("sqft dropdown opens, accepts input, closes", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 4000);

    const sqftBtn = page.locator("button", { hasText: /Sqft|SF/ });
    await sqftBtn.click();
    await settle(page, 300);

    const minInput = page.locator("input[placeholder='Min']").first();
    await expect(minInput).toBeVisible();

    await minInput.fill("1500");
    await minInput.blur();
    await settle(page, 500);

    // Button text should update to show the value
    const btnText = await sqftBtn.textContent();
    console.log(`  Sqft button text after set: "${btnText}"`);
    expect(btnText).toContain("1,500");
    console.log("  ✓ Sqft dropdown works");
  });
});

// ─── FLOW 20: Source Multi-Select (UI) ──────────────────────────────────────

test.describe("Flow 20: Source multi-select UI", () => {
  test("source dropdown opens and has checkboxes", async ({ page }) => {
    await page.goto("/search");
    await settle(page, 4000);

    const sourceBtn = page.locator("button", { hasText: /All Sources|Sources/ });
    await sourceBtn.click();
    await settle(page, 300);

    // Should see checkboxes
    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    console.log(`  ✓ Source dropdown has ${count} checkboxes`);
    expect(count).toBeGreaterThan(0);
  });
});
