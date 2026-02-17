# Data Model

## Overview

AtlasCRE uses a multi-source listing aggregation model with deduplication.

## Entity Relationships

```
Tenant 1──* User
User 1──* SavedSearch
User 1──* FavoriteListing
Listing 1──* ListingVariant
Listing 1──* FavoriteListing
ListingSource 1──* RawListing
ListingSource 1──* ListingVariant
```

## Models

### Tenant
Multi-tenancy support. Each user belongs to a tenant.

### User
- `email` (unique) - Login credential
- `passwordHash` - bcrypt hashed password
- `role` - USER or ADMIN
- `tenantId` - FK to Tenant

### ListingSource
Represents a data provider (Realtor.com, LoopNet, Crexi, etc.)
- `slug` (unique) - Machine identifier
- `lastRunAt` / `lastRunStatus` - Ingestion tracking

### RawListing
Raw data stored as JSON from each source, keyed by `sourceId + externalId`.

### Listing (Master)
Deduplicated master listing record.
- `dedupeKey` (unique) - Generated from address + SF + type + broker
- Geographic: `lat`, `lng`, `market`, `city`, `state`, `zip`
- Property: `propertyType`, `listingType`, `buildingSf`, `lotSizeAcres`
- Financial: `priceAmount`, `priceUnit`
- Status: `active`, `pending`, `closed`

### ListingVariant
Per-source version of a listing, preserving source-specific data.
- Links to both `Listing` (master) and `ListingSource`
- Has its own price, broker contact info, description, source URL

### SavedSearch
User-saved filter configurations stored as JSON.

### FavoriteListing
User favorites with optional notes. Unique per user+listing pair.

## Deduplication Strategy

Listings are deduplicated by generating a key from:
1. Normalized address (lowercase, abbreviations standardized)
2. Building square footage
3. Property type
4. Broker name

When multiple sources report the same listing, one becomes the master `Listing` and the rest are stored as `ListingVariant` records.
