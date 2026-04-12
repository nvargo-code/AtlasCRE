# SuperSearch — User Flow Test Plan

## Flow 1: First-Time Visitor Search
1. Visit /search — map loads centered on Austin, listings appear
2. Pan/zoom the map — listings update to match visible area
3. Type "78704" in search bar → hit Search — results filter to 78704 area
4. Type "Barton Hills" → autocomplete suggestions appear
5. Click a suggestion — map moves, results update

**Watch for:**
- Listings disappearing when first moving the map
- Total count changing unexpectedly
- Map markers not matching the listing sidebar

## Flow 2: Filter by Price
1. Enter "300000" in Min Price → blur — results update
2. Enter "600000" in Max Price → blur — results narrow
3. Clear Min Price — results expand
4. Verify: no listings below $300K or above $600K in results

**Watch for:**
- Lease listings ($1,900/mo) being filtered out by sale price ranges
- "Price N/A" listings disappearing or not

## Flow 3: Filter by Beds & Baths
1. Select "3+" beds — results update
2. Select "2+" baths — results narrow further
3. Verify: all listed results show 3+ beds, 2+ baths, OR null (unknown data)
4. Total count should still include unknown-data listings

**Watch for:**
- ALN listings (mostly null beds/baths) disappearing entirely
- Count going to 0

## Flow 4: Square Footage Filter
1. Click "Sqft" button — min/max panel expands
2. Enter 1500 in Min, 3000 in Max → blur
3. Button text should show "1,500–3,000 SF" in gold
4. Click ✕ to clear — button returns to "Sqft"
5. Verify listings match the SF range or have null SF

## Flow 5: Acres Filter
1. Click "Acres" button — min/max panel expands
2. Enter 0.5 in Min → blur
3. Verify results include 0.5+ acre properties and null-acre properties
4. Click ✕ to clear

## Flow 6: Sale vs Lease
1. Select "For Sale" — only sale listings
2. Select "For Lease" — only lease listings (e.g., 201 Ramona)
3. Verify lease listings show /MO in price
4. Switch back to "Sale / Lease" (all) — both types show

**Watch for:**
- Lease listings still showing as "For Sale" badge
- Price not showing /MO suffix

## Flow 7: Year Built Filter
1. Select "2020+" — results narrow to newer construction
2. Verify: listed results have yearBuilt >= 2020 OR null
3. Switch to "2000+" — more results

## Flow 8: Source Filter (Multi-Select)
1. Click source dropdown — shows All Sources (total)
2. Check "MLS" checkbox — only MLS listings on map and sidebar
3. Verify: counts for other sources still show their totals
4. Check "ALN" additionally — now MLS + ALN listings show
5. Uncheck both → click "All Sources" — resets to all
6. Verify total count matches "All Sources" number

**Watch for:**
- Other source counts going to 0 when filtering
- Checkbox state not matching displayed results

## Flow 9: Special Feature Toggles
1. Click "Pool" — button highlights gold
2. Verify only pool-tagged listings show (if any in current view)
3. Click "Pool" again to deactivate
4. Test: Waterfront, View, Guest, Boat Slip

**Watch for:**
- No results (most listings don't have features populated yet)
- Toggle not visually deactivating

## Flow 10: Garage Filter
1. Select "2+" garage
2. Verify results have 2+ garage or null
3. Select "3+" — fewer results

## Flow 11: Draw Tool
1. Click "Draw" button on map
2. Click 4-5 points to draw a polygon
3. Double-click to complete
4. Verify: only listings INSIDE the polygon show (not just bounding box)
5. Click "Clear Draw" — all listings in viewport return

**Watch for:**
- Listings outside polygon still showing
- Map markers not updating after draw
- Sidebar listings not matching map markers

## Flow 12: Combined Filters
1. Set: 3+ beds, 2+ baths, $400K-$800K, 2000+ sqft, MLS source
2. Verify all results match ALL criteria
3. Remove one filter at a time — results should expand
4. "Clear All" on filter chips — everything resets

**Watch for:**
- Filters not stacking properly
- Count not updating
- Filter chips not showing

## Flow 13: Listing Detail
1. Click a listing in the sidebar — detail panel opens
2. Verify: price, address, beds/baths/SF, source badges all correct
3. Check "Found on X Sources" section at bottom
4. Source badges should show colored labels (MLS=sky, ALN=purple)
5. Price should show /MO for leases, $ for sales
6. Click breadcrumb "SuperSearch" to go back to search

## Flow 14: Map Interaction
1. Zoom in on a cluster — it expands to individual markers
2. Click a map marker — popup shows
3. Pan the map — sidebar updates with new area listings
4. Zoom out significantly — more listings load
5. Zoom to a different city — listings update

**Watch for:**
- Listings not updating on pan
- Old listings persisting after move
- Performance with many markers

## Flow 15: Mobile View
1. Resize browser to mobile width
2. Toggle between Map and List views
3. Filters should still work
4. Draw tool should work on mobile

## Flow 16: URL Persistence
1. Apply several filters (beds, price, source)
2. Copy the URL
3. Open in new tab — same filters should be applied
4. Results should match original

## Flow 17: Load More / Pagination
1. Scroll to bottom of listing sidebar
2. "Load More" button appears if more results
3. Click it — additional listings append
4. Verify no duplicates

## Flow 18: Save & Compare (Authenticated)
1. Log in as david@shapirogroup.co / david123
2. Click heart icon on a listing — saves
3. Click "Compare" on 2-3 listings
4. Compare drawer appears at bottom
5. Navigate to /portal/saved — saved listing appears

## Flow 19: Listing Card Data Quality
1. Browse listings and check for:
   - Missing images (placeholder shows)
   - "$0" or weird prices
   - "null" showing in text
   - Source badges appearing correctly
   - Lease vs Sale badge accuracy

## Flow 20: Edge Cases
1. Search with no results (obscure address) — empty state shows
2. Very large price range ($0 - $999,999,999)
3. Max out all filters — should get 0 results gracefully
4. Rapid filter changes — no crashes
5. Draw polygon, then change filters — polygon stays active
