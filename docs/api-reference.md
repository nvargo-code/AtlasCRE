# API Reference

All endpoints require authentication via NextAuth session (except the cron endpoint).

## Listings

### GET /api/listings
Returns paginated listings with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| market | string | `austin` or `dfw` |
| propertyType | string | Comma-separated: Office,Retail,Industrial,etc. |
| listingType | string | Comma-separated: Sale,Lease,Sublease |
| priceMin | number | Minimum price |
| priceMax | number | Maximum price |
| sfMin | number | Minimum building SF |
| sfMax | number | Maximum building SF |
| yearBuiltMin | number | Minimum year built |
| yearBuiltMax | number | Maximum year built |
| status | string | Listing status (default: active) |
| brokerCompany | string | Filter by broker company |
| q | string | Text search (address, city, ZIP) |
| north/south/east/west | number | Map viewport bounds |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50, max: 200) |
| format | string | `geojson` for map data |

**Response (default):**
```json
{
  "listings": [...],
  "pagination": { "page": 1, "limit": 50, "total": 123, "totalPages": 3 }
}
```

**Response (format=geojson):**
```json
{
  "type": "FeatureCollection",
  "features": [{ "type": "Feature", "geometry": {...}, "properties": {...} }]
}
```

### GET /api/listings/[id]
Returns a single listing with all variants and favorite status.

## Favorites

### GET /api/favorites
Returns all favorited listings for the current user.

### POST /api/favorites/[listingId]
Add a listing to favorites. Body: `{ "notes": "optional" }`

### DELETE /api/favorites/[listingId]
Remove a listing from favorites.

## Saved Searches

### GET /api/saved-searches
Returns all saved searches for the current user.

### POST /api/saved-searches
Create a saved search. Body: `{ "name": "Search name", "filters": {...} }`

### DELETE /api/saved-searches
Delete a saved search. Body: `{ "id": "search-id" }`

## Export

### GET /api/export
Export listings matching current filters.

**Query Parameters:** Same as `/api/listings` plus:
| Param | Type | Description |
|-------|------|-------------|
| format | string | `xlsx` (default), `csv`, or `pdf` |

Returns file download.

## Ingestion

### POST /api/ingest
Trigger manual data refresh. **Admin only.**

Body: `{ "provider": "realtor" }` (optional, runs all if omitted)

### GET /api/ingest/cron
Vercel cron endpoint. Requires `Authorization: Bearer <CRON_SECRET>` header.
