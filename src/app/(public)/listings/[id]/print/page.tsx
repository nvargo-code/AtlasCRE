import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintListingPage({ params }: Props) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      variants: {
        include: { source: { select: { name: true } } },
      },
    },
  });

  if (!listing) notFound();

  const price = listing.priceAmount
    ? `$${Number(listing.priceAmount).toLocaleString()}`
    : "Contact for Price";

  return (
    <html>
      <head>
        <title>{listing.address} | Shapiro Group</title>
        <style>{`
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            @page { margin: 0.5in; }
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #0A1628;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.5;
          }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #C9A96E; padding-bottom: 20px; }
          .price { font-size: 36px; font-weight: 700; }
          .address { font-size: 18px; color: #555; margin-top: 4px; }
          .badge { display: inline-block; background: #C9A96E; color: white; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 24px 0; padding: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: 700; }
          .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; margin-top: 4px; }
          .section { margin: 24px 0; }
          .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; margin-bottom: 12px; }
          .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .detail { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; }
          .detail-value { font-weight: 600; margin-top: 2px; }
          .description { color: #555; font-size: 14px; line-height: 1.7; }
          .sources { display: flex; gap: 8px; flex-wrap: wrap; }
          .source { background: #f5f3ef; padding: 4px 12px; font-size: 12px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #C9A96E; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 18px; font-weight: 700; letter-spacing: 0.06em; }
          .brand span { font-weight: 300; color: #C9A96E; }
          .contact { text-align: right; font-size: 13px; color: #555; }
          .print-btn { position: fixed; bottom: 20px; right: 20px; background: #0A1628; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
          .print-btn:hover { background: #C9A96E; }
          .photo { width: 100%; max-height: 400px; object-fit: cover; margin-bottom: 20px; }
        `}</style>
      </head>
      <body>
        {/* Print button */}
        <script dangerouslySetInnerHTML={{ __html: `document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('pb');if(b)b.onclick=function(){window.print();}});` }} />
        <button id="pb" className="print-btn no-print" type="button">
          Print / Save PDF
        </button>

        {/* Photo */}
        {listing.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt={listing.address} className="photo" />
        )}

        {/* Header */}
        <div className="header">
          <div>
            <div className="price">{price}</div>
            <div className="address">{listing.address}</div>
            <div className="address">{listing.city}, {listing.state} {listing.zip}</div>
          </div>
          <span className="badge">For {listing.listingType}</span>
        </div>

        {/* Quick stats */}
        <div className="stats">
          {listing.beds && (
            <div className="stat">
              <div className="stat-value">{listing.beds}</div>
              <div className="stat-label">Bedrooms</div>
            </div>
          )}
          {listing.baths && (
            <div className="stat">
              <div className="stat-value">{Number(listing.baths)}</div>
              <div className="stat-label">Bathrooms</div>
            </div>
          )}
          {listing.buildingSf && (
            <div className="stat">
              <div className="stat-value">{Number(listing.buildingSf).toLocaleString()}</div>
              <div className="stat-label">Sq Ft</div>
            </div>
          )}
          {listing.yearBuilt && (
            <div className="stat">
              <div className="stat-value">{listing.yearBuilt}</div>
              <div className="stat-label">Year Built</div>
            </div>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <div className="section">
            <h2>Description</h2>
            <p className="description">{listing.description}</p>
          </div>
        )}

        {/* Property details */}
        <div className="section">
          <h2>Property Details</h2>
          <div className="details-grid">
            {listing.propertyType && (
              <div className="detail">
                <div className="detail-label">Type</div>
                <div className="detail-value">{listing.propSubType || listing.propertyType}</div>
              </div>
            )}
            {listing.lotSizeAcres && (
              <div className="detail">
                <div className="detail-label">Lot Size</div>
                <div className="detail-value">{Number(listing.lotSizeAcres)} acres</div>
              </div>
            )}
            {listing.garageSpaces && (
              <div className="detail">
                <div className="detail-label">Garage</div>
                <div className="detail-value">{listing.garageSpaces} car</div>
              </div>
            )}
            {listing.stories && (
              <div className="detail">
                <div className="detail-label">Stories</div>
                <div className="detail-value">{listing.stories}</div>
              </div>
            )}
            {listing.brokerName && (
              <div className="detail">
                <div className="detail-label">Listed By</div>
                <div className="detail-value">{listing.brokerName}</div>
              </div>
            )}
            {listing.brokerCompany && (
              <div className="detail">
                <div className="detail-label">Brokerage</div>
                <div className="detail-value">{listing.brokerCompany}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        {listing.variants.length > 0 && (
          <div className="section">
            <h2>Found on {listing.variants.length} Source{listing.variants.length > 1 ? "s" : ""}</h2>
            <div className="sources">
              {listing.variants.map((v) => (
                <span key={v.id} className="source">{v.source.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer — branding */}
        <div className="footer">
          <div className="brand">SHAPIRO <span>GROUP</span></div>
          <div className="contact">
            512.537.6023<br />
            team@shapirogroup.co<br />
            Brokered by eXp Realty
          </div>
        </div>
      </body>
    </html>
  );
}
