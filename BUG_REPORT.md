# SuperSearch QA Test Report
**Date:** 2026-04-12  
**URL:** https://supersearch-production.up.railway.app/search  
**Tester:** Automated QA (Claude)

---

## Test Results Summary

| Flow | Test | Result |
|------|------|--------|
| 1 | First-Time Visitor Search | PASS |
| 2 | Filter by Price | PASS |
| 3 | Filter by Beds & Baths | PASS |
| 4 | Square Footage Filter | PARTIAL — max sqft not captured |
| 5 | Acres Filter | SKIPPED |
| 6 | Sale vs Lease | PASS (with data quality issues) |
| 7 | Year Built Filter | PASS |
| 8 | Source Filter | FAIL — CREXI missing, URL param broken |
| 9 | Special Feature Toggles | FAIL — Pool includes null data |
| 10 | Garage Filter | SKIPPED |
| 11 | Draw Tool | PASS (activation verified) |
| 12 | Combined Filters | PASS (without source filter) |
| 13 | Listing Detail | PASS (with minor issues) |
| 14 | Map Interaction | PASS |
| 15 | Save & Compare | SKIPPED |
| 16 | Listing Card Data Quality | FAIL — multiple issues |

---

## Bugs Found

### BUG 1: CREXI Lease Prices Displayed as Raw $/SF Rates (HIGH)
**Severity:** High  
**Flow:** 6, 16  
**Description:** CREXI commercial lease listings show raw per-square-foot rates ($35, $12, $55, $42, $28) instead of monthly totals. MLS lease listings correctly show "$4K/MO", "$3K/MO" format. CREXI listings are missing the "/MO" suffix and display misleadingly low prices.  
**Examples:**
- "$35 lease — 2400 E Cesar Chavez St" (CREXI, 3,200 SF) — likely $35/SF/yr = ~$9,333/mo
- "$12 lease — 7701 E Ben White Blvd" (CREXI, 52,000 SF) — likely $12/SF/yr
- "$55 lease — 600 W 6th St" (CREXI, 5,500 SF)
- "$42 lease — 401 Congress Ave" (CREXI, 45,000 SF)

**Impact:** These misleadingly low prices sort to the top of results, pushing real listings down. Users see "$35" and "$12" listings first, which creates confusion.  
**Fix:** Convert CREXI $/SF/yr rates to monthly totals (price × sqft ÷ 12) or clearly label as "$/SF/yr".

---

### BUG 2: Address Data Quality Issues (MEDIUM)
**Severity:** Medium  
**Flow:** 16  
**Description:** Multiple address formatting problems in listing data:
- **"None" in addresses:** "903 Cardinal **None** #A", "3415 Menchaca Road **None** #109", "3415 Menchaca Road **None** #107"
- **Duplicate street suffixes:** "4004 Banister **Ln Ln** #214", "1529 Barton Springs **Road Rd** #13", "2801 Cedarview **#B Dr #B**"

**Impact:** Looks unprofessional, confuses users searching by address.  
**Fix:** Strip "None" from addresses. Deduplicate street suffixes (Ln/Ln, Road/Rd, etc.).

---

### BUG 3: CREXI Source Missing from Source Filter Dropdown (MEDIUM)
**Severity:** Medium  
**Flow:** 8  
**Description:** The source filter dropdown shows: MLS (6044), Realtor (209), Zillow (0), ZFSBO (0), Z-Coming Soon (0), ALN (361), Email (0), Clubhouse (0). **CREXI is not listed**, yet CREXI-sourced listings appear prominently in search results (they're the first several listings shown). Users cannot filter to show/hide CREXI listings.  
**Impact:** Users can't isolate or exclude commercial CREXI listings.  
**Fix:** Add CREXI as a source option in the dropdown with accurate count.

---

### BUG 4: Pool Filter Includes Null/Unknown Data (MEDIUM)
**Severity:** Medium  
**Flow:** 9  
**Description:** Clicking "Pool" filter shows 5,385 of 6,410 listings (84%). This is unrealistic — the filter appears to include listings where pool data is null/unknown rather than only explicitly pool=true listings. Same issue likely affects Waterfront, View, Guest, Boat Slip toggles.  
**Impact:** Feature filters are essentially useless — they barely narrow results.  
**Fix:** Only include listings where the feature is explicitly true, not null.

---

### BUG 5: Sqft Max Value Not Captured on Blur (LOW-MEDIUM)
**Severity:** Low-Medium  
**Flow:** 4  
**Description:** When entering min AND max sqft values, only the min value registers in the URL (`sfMin=1500`). The max value (`sfMax=3000`) never appears. The Sqft button shows "1,500–Any SF" instead of "1,500–3,000 SF". The filter chip shows "1,500+ SF".  
**Impact:** Users cannot set an upper bound on square footage.  
**Fix:** Ensure the max sqft input dispatches the correct state update on blur/change.

---

### BUG 6: "Clear All" Doesn't Reset Price Input Values Visually (LOW)
**Severity:** Low  
**Flow:** 2  
**Description:** After applying price filters ($300K min, $600K max) and clicking "Clear All", the filter is removed from the URL and results reset to all listings, but the Min/Max Price input fields still display "300000" and "600000". The search box also retains "78704" text.  
**Impact:** Users may think filters are still active when they're not.  
**Fix:** Reset input field values when Clear All is clicked.

---

### BUG 7: Source Filter via URL Parameter Returns 0 Results (MEDIUM)
**Severity:** Medium  
**Flow:** 12  
**Description:** Navigating to `?sources=MLS&bedsMin=3&bathsMin=2&priceMin=400000&priceMax=800000&sfMin=2000` returns 0 results. The same filters WITHOUT `sources=MLS` return 202 results. The source parameter breaks when loaded from URL.  
**Impact:** Shared URLs with source filters don't work. Bookmarked searches with source filters fail.  
**Fix:** Ensure `sources` URL parameter is properly parsed and applied on page load.

---

### BUG 8: Duplicate MLS Badges on Some Listings (LOW)
**Severity:** Low  
**Flow:** 16  
**Description:** Some listings show "MLS MLS" (duplicate badge):
- "3809 Valley View Rd #13" — shows "New MLS MLS"
- "1805 Collier St" — shows "New MLS MLS"  
**Impact:** Visual clutter, looks like a data bug.  
**Fix:** Deduplicate source badges per listing.

---

### BUG 9: Valuation Popup Repeatedly Appears (LOW)
**Severity:** Low (UX annoyance)  
**Flow:** All  
**Description:** The "What's Your Home Worth?" popup appears on every page load/navigation within the search. After closing it, it reappears when navigating to listing details or refreshing. It also blocks the listing sidebar on initial load.  
**Impact:** Blocks content, frustrating for repeat visitors.  
**Fix:** Remember dismissal in localStorage/session. Don't show on search page where sidebar is critical.

---

### BUG 10: Large Empty White Space on Listing Detail Page (LOW)
**Severity:** Low  
**Flow:** 13  
**Description:** On the listing detail page for 2401 Oakhaven Cir, there's a large empty white space between the address/price section and the "Property Details" section. This appears to be where a description would go, but it's empty for ALN-sourced listings.  
**Impact:** Page looks incomplete/broken.  
**Fix:** Hide the description section when empty, or show a placeholder.

---

### BUG 11: Price Rounding Inconsistency (COSMETIC)
**Severity:** Cosmetic  
**Flow:** 13  
**Description:** 2401 Oakhaven Cir shows "$3,950,000" in search results but "$4.0M" on the detail page. The rounding to $4.0M loses $50K of precision.  
**Impact:** Minor confusion when comparing prices.  
**Fix:** Use consistent formatting, e.g., "$3.95M" or "$3,950,000" in both places.

---

## Positive Observations

- **Search & autocomplete** work well — ZIP codes, neighborhoods, addresses all recognized
- **Map clustering** with numbered markers looks great
- **Filter chips** are clear and dismissible
- **SuperSearch vs Zillow comparison bar** is a nice marketing touch (6,410 vs 492)
- **"See 5,918 more listings"** CTA is compelling
- **Area Stats panel** (5,657 listings, $280K median, $347 avg $/SF) adds value
- **Listing detail page** has good layout: photo, Hot Score, agent contact, source attribution, map
- **URL persistence** works for most filters (price, beds, baths, sqft, listing type)
- **Heat map toggle** (No Heat / Density / Price) is a nice feature
- **Save Search** button is well-placed
- **Breadcrumb navigation** on detail pages works correctly
- **Responsive filter bar** accommodates many filter options cleanly

---

## Priority Fixes Recommended

1. **BUG 1** — CREXI price display (high impact, confusing to users)
2. **BUG 3** — Add CREXI to source dropdown
3. **BUG 4** — Fix Pool/feature filters to exclude nulls
4. **BUG 2** — Clean address data ("None", duplicate suffixes)
5. **BUG 7** — Fix source filter URL parameter
6. **BUG 5** — Fix sqft max input
7. **BUG 6** — Reset input values on Clear All
