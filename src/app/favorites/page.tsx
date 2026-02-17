"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

interface FavoriteItem {
  id: string;
  listingId: string;
  notes: string | null;
  createdAt: string;
  listing: {
    id: string;
    address: string;
    city: string;
    state: string;
    propertyType: string;
    listingType: string;
    priceAmount: number | null;
    priceUnit: string | null;
    buildingSf: number | null;
    status: string;
  };
}

function formatPrice(amount: number | null, unit: string | null): string {
  if (!amount) return "Price N/A";
  const formatted = `$${amount.toLocaleString()}`;
  switch (unit) {
    case "per_sf": return `${formatted}/SF`;
    case "per_sf_yr": return `${formatted}/SF/yr`;
    case "per_sf_mo": return `${formatted}/SF/mo`;
    default: return formatted;
  }
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        setFavorites(data);
        setLoading(false);
      });
  }, [status]);

  async function removeFavorite(listingId: string) {
    await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.listing.id !== listingId));
  }

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Favorites</h1>

        {loading ? (
          <p className="text-gray-500">Loading favorites...</p>
        ) : favorites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No favorites yet. Click the heart icon on any listing to save it here.
          </p>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => router.push(`/?q=${encodeURIComponent(fav.listing.address)}`)}
                >
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {fav.listing.address}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fav.listing.city}, {fav.listing.state}
                  </p>
                  <div className="flex gap-3 mt-1.5 text-sm">
                    <span className="text-teal-600 font-semibold">
                      {formatPrice(fav.listing.priceAmount, fav.listing.priceUnit)}
                    </span>
                    <span className="text-gray-500">{fav.listing.propertyType}</span>
                    <span className="text-gray-500">{fav.listing.listingType}</span>
                    {fav.listing.buildingSf && (
                      <span className="text-gray-500">{fav.listing.buildingSf.toLocaleString()} SF</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(fav.listing.id)}
                  className="text-red-400 hover:text-red-600 p-2 transition-colors"
                  title="Remove favorite"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
