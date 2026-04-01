"use client";

import { useEffect, useState } from "react";

interface PriceEvent {
  id: string;
  event: string;
  oldValue: string | null;
  newValue: string;
  changeDate: string;
}

interface PriceHistoryProps {
  listingId: string;
  currentPrice: number | null;
  listedDate: string | null;
}

export function PriceHistory({ listingId, currentPrice, listedDate }: PriceHistoryProps) {
  const [events, setEvents] = useState<PriceEvent[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    fetch(`/api/portal/price-history/${listingId}`)
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((data) => setEvents(data.events || []))
      .catch(() => {});
  }, [expanded, listingId]);

  // Build timeline including the listing creation
  const timeline: { date: string; label: string; value: string; type: string }[] = [];

  if (listedDate) {
    timeline.push({
      date: listedDate,
      label: "Listed",
      value: currentPrice ? `$${currentPrice.toLocaleString()}` : "Contact",
      type: "new_listing",
    });
  }

  events.forEach((e) => {
    if (e.event === "price_change") {
      timeline.push({
        date: e.changeDate,
        label: "Price Changed",
        value: `${e.oldValue ? `$${Number(e.oldValue).toLocaleString()} → ` : ""}$${Number(e.newValue).toLocaleString()}`,
        type: "price_change",
      });
    } else if (e.event === "status_change") {
      timeline.push({
        date: e.changeDate,
        label: "Status Changed",
        value: `${e.oldValue || ""} → ${e.newValue}`,
        type: "status_change",
      });
    }
  });

  // Sort by date descending
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const EVENT_COLORS: Record<string, string> = {
    new_listing: "bg-green-500",
    price_change: "bg-gold",
    status_change: "bg-blue-500",
  };

  return (
    <div className="bg-warm-gray">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-navy">Price & Status History</h3>
          <p className="text-[12px] text-mid-gray">Track changes over time</p>
        </div>
        <svg
          className={`w-5 h-5 text-gold transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {timeline.length === 0 ? (
            <p className="text-mid-gray text-sm">No recorded changes yet.</p>
          ) : (
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-navy/10" />

              {timeline.map((event, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white ${EVENT_COLORS[event.type] || "bg-navy/30"}`} />

                  <div className="bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-mid-gray">
                        {event.label}
                      </span>
                      <span className="text-[11px] text-mid-gray">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy mt-1">{event.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
