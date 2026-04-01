"use client";

import { useState } from "react";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

interface NearbyAmenitiesProps {
  zip: string | null;
  city: string;
}

export function NearbyAmenities({ zip, city }: NearbyAmenitiesProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"schools" | "fitness" | "restaurants" | "wellness">("schools");

  // Find matching neighborhood by ZIP
  const hood = NEIGHBORHOODS.find((n) =>
    n.zips.includes(zip || "") || n.name.toLowerCase().includes(city.toLowerCase())
  );

  if (!hood) return null;

  const tabs = [
    { key: "schools" as const, label: "Schools", count: hood.schools.length },
    { key: "fitness" as const, label: "Fitness", count: hood.fitness.length },
    { key: "restaurants" as const, label: "Dining", count: hood.restaurants.length },
    { key: "wellness" as const, label: "Wellness", count: hood.wellness.length },
  ].filter((t) => t.count > 0);

  return (
    <div className="bg-warm-gray">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-navy">Nearby in {hood.name}</h3>
          <p className="text-[12px] text-mid-gray">Schools, fitness, restaurants, wellness</p>
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
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                  activeTab === tab.key
                    ? "bg-navy text-white"
                    : "bg-white text-navy/50 hover:text-navy"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Schools */}
          {activeTab === "schools" && (
            <div className="space-y-2">
              {hood.schools.map((school) => (
                <div key={school.name} className="bg-white p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{school.name}</p>
                    <p className="text-[11px] text-mid-gray">{school.district} &middot; {school.type}</p>
                    {school.notes && <p className="text-[11px] text-navy/40 mt-0.5">{school.notes}</p>}
                  </div>
                  <span className="text-lg font-bold text-gold flex-shrink-0 ml-3">{school.rating}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fitness */}
          {activeTab === "fitness" && (
            <div className="space-y-2">
              {hood.fitness.map((item) => (
                <div key={item.name} className="bg-white p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-navy">{item.name}</p>
                    <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-gold bg-gold/10 px-1.5 py-0.5 flex-shrink-0 ml-2">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-mid-gray leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Restaurants */}
          {activeTab === "restaurants" && (
            <div className="space-y-2">
              {hood.restaurants.map((item) => (
                <div key={item.name} className="bg-white p-3">
                  <p className="text-sm font-medium text-navy">{item.name}</p>
                  <p className="text-[12px] text-mid-gray leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Wellness */}
          {activeTab === "wellness" && (
            <div className="space-y-2">
              {hood.wellness.map((item) => (
                <div key={item.name} className="bg-white p-3">
                  <p className="text-sm font-medium text-navy">{item.name}</p>
                  <p className="text-[12px] text-mid-gray leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Link to full neighborhood guide */}
          <a
            href={`/neighborhoods/${hood.slug}`}
            className="block text-center mt-4 text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark transition-colors"
          >
            View Full {hood.name} Guide &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
