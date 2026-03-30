"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentItem {
  id: string;
  address: string;
  city: string;
  price: string;
  viewedAt: number;
}

const STORAGE_KEY = "shapiro_recently_viewed";
const MAX_ITEMS = 8;

export function addToRecentlyViewed(item: Omit<RecentItem, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const existing: RecentItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = existing.filter((i) => i.id !== item.id);
    filtered.unshift({ ...item, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable
  }
}

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored: RecentItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setItems(stored);
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="border-b border-navy/10 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray whitespace-nowrap flex-shrink-0">
            Recent
          </span>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="flex items-center gap-2 bg-warm-gray px-3 py-1.5 hover:bg-navy/5 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span className="text-[12px] text-navy font-medium truncate max-w-[150px]">
                {item.address}
              </span>
              <span className="text-[11px] text-gold font-semibold">{item.price}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
