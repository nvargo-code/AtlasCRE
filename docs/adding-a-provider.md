# Adding a New Data Provider

## Steps

### 1. Create the provider file

Create `src/ingestion/providers/yourprovider.ts`:

```typescript
import { ListingProvider, NormalizedListing } from "../types";

export const yourProvider: ListingProvider = {
  slug: "yourprovider",
  name: "Your Provider",

  async fetchListings(market): Promise<NormalizedListing[]> {
    // 1. Fetch data from the source (API, scraping, etc.)
    // 2. Normalize each result to NormalizedListing format
    // 3. Return the array

    const results: NormalizedListing[] = [];

    // Example: fetch from an API
    // const response = await fetch(`https://api.example.com/listings?market=${market}`);
    // const data = await response.json();
    // for (const item of data) {
    //   results.push({
    //     externalId: item.id,
    //     sourceSlug: "yourprovider",
    //     address: item.address,
    //     city: item.city,
    //     state: "TX",
    //     lat: item.latitude,
    //     lng: item.longitude,
    //     market,
    //     propertyType: mapPropertyType(item.type),
    //     listingType: mapListingType(item.saleOrLease),
    //     buildingSf: item.squareFeet,
    //     priceAmount: item.price,
    //     priceUnit: "total",
    //     brokerName: item.broker,
    //     sourceUrl: item.url,
    //     rawData: item,
    //   });
    // }

    return results;
  },
};
```

### 2. Register the provider

Add it to the `ALL_PROVIDERS` array in `src/ingestion/runner.ts`:

```typescript
import { yourProvider } from "./providers/yourprovider";

const ALL_PROVIDERS: ListingProvider[] = [
  // ...existing providers
  yourProvider,
];
```

### 3. Required fields

The `NormalizedListing` type requires these fields:
- `externalId` - Unique ID from the source
- `sourceSlug` - Must match your provider's `slug`
- `address`, `city`, `state` - Location
- `lat`, `lng` - Coordinates (required for map)
- `market` - "austin" or "dfw"
- `propertyType` - Office, Retail, Industrial, etc.
- `listingType` - Sale, Lease, Sublease
- `rawData` - Store the full raw response for debugging

### 4. Property type mapping

Normalize source-specific property types to standard values:
- Office, Retail, Industrial, Multifamily, Land, Mixed Use, Hospitality, Special Purpose

### 5. Testing

Run the provider individually via the admin page or API:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"provider": "yourprovider", "market": "austin"}'
```

### 6. Rate limiting

Be respectful of source APIs:
- Add delays between paginated requests
- Cache responses where possible
- Check robots.txt for scraping targets
