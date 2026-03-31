import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const collection = await prisma.collection.findUnique({
    where: { shareToken: token },
    select: { name: true, _count: { select: { listings: true } } },
  });
  if (!collection) return { title: "Collection Not Found" };
  return {
    title: `${collection.name} — ${collection._count.listings} Homes | Shapiro Group`,
    description: `View this curated collection of ${collection._count.listings} homes from the Shapiro Group.`,
  };
}

export default async function SharedCollectionPage({ params }: Props) {
  const { token } = await params;

  const collection = await prisma.collection.findUnique({
    where: { shareToken: token },
    include: {
      createdBy: { select: { name: true } },
      listings: {
        include: {
          listing: {
            select: {
              id: true, address: true, city: true, state: true, zip: true,
              priceAmount: true, beds: true, baths: true, buildingSf: true,
              imageUrl: true, listingType: true, propSubType: true, propertyType: true,
            },
          },
          reactions: { select: { reaction: true } },
          comments: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!collection) notFound();

  return (
    <>
      <section className="pt-32 pb-12 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Shared Collection
          </p>
          <h1 className="text-3xl md:text-5xl font-light text-white">
            {collection.name}
          </h1>
          <p className="text-white/50 text-sm mt-3">
            {collection.listings.length} homes &middot; Curated by {collection.createdBy.name || "Shapiro Group"}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.listings.map((cl) => {
              const l = cl.listing;
              const loves = cl.reactions.filter((r) => r.reaction === "love").length;
              const likes = cl.reactions.filter((r) => r.reaction === "like").length;

              return (
                <div key={cl.id} className="bg-warm-gray overflow-hidden">
                  <Link href={`/listings/${l.id}`}>
                    <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-mid-gray text-sm">No Photo</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                        {l.listingType}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link href={`/listings/${l.id}`}>
                      <p className="text-lg font-semibold text-navy hover:text-gold transition-colors">
                        {l.priceAmount ? `$${Number(l.priceAmount).toLocaleString()}` : "Contact"}
                      </p>
                      <p className="text-sm text-navy/70 truncate">{l.address}</p>
                      <p className="text-[12px] text-mid-gray">{l.city}, {l.state}</p>
                    </Link>

                    <div className="flex items-center gap-3 mt-2 text-[12px] text-mid-gray">
                      {l.beds && <span>{l.beds} bd</span>}
                      {l.baths && <span>{Number(l.baths)} ba</span>}
                      {l.buildingSf && <span>{Number(l.buildingSf).toLocaleString()} SF</span>}
                    </div>

                    {(loves > 0 || likes > 0) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-navy/5 text-[12px] text-mid-gray">
                        {loves > 0 && <span>{"\u2764\uFE0F"} {loves}</span>}
                        {likes > 0 && <span>{"\uD83D\uDC4D"} {likes}</span>}
                      </div>
                    )}

                    {cl.comments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {cl.comments.slice(0, 2).map((c) => (
                          <p key={c.id} className="text-[11px]">
                            <span className="font-semibold text-navy">{c.user.name}: </span>
                            <span className="text-mid-gray">{c.body}</span>
                          </p>
                        ))}
                        {cl.comments.length > 2 && (
                          <p className="text-[11px] text-navy/30">+{cl.comments.length - 2} more comments</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/register" className="btn-primary">
              Create Your Own Account
            </Link>
            <p className="text-mid-gray text-[12px] mt-3">
              Sign up free to save homes, create collections, and message an agent.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
