"use client";

import { useState } from "react";

interface CommuteCalculatorProps {
  listingAddress: string;
  listingCity: string;
  lat: number;
  lng: number;
}

export function CommuteCalculator({ listingAddress, listingCity, lat, lng }: CommuteCalculatorProps) {
  const [destination, setDestination] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Common Austin destinations
  const presets = [
    { label: "Downtown Austin", address: "Congress Ave, Austin, TX", lat: 30.2672, lng: -97.7431 },
    { label: "The Domain", address: "The Domain, Austin, TX", lat: 30.4021, lng: -97.7253 },
    { label: "UT Austin", address: "University of Texas, Austin, TX", lat: 30.2849, lng: -97.7341 },
    { label: "Austin Airport", address: "Austin-Bergstrom Airport, TX", lat: 30.1975, lng: -97.6664 },
    { label: "Tesla Gigafactory", address: "Tesla Gigafactory, Austin, TX", lat: 30.2214, lng: -97.6165 },
  ];

  function getDistance(lat2: number, lng2: number): { miles: number; driveMin: number } {
    // Haversine formula for rough distance
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat) * Math.PI / 180;
    const dLng = (lng2 - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const miles = R * c;
    // Rough drive time estimate (Austin avg ~25mph with traffic)
    const driveMin = Math.round(miles / 25 * 60);
    return { miles: Math.round(miles * 10) / 10, driveMin };
  }

  function getGoogleMapsUrl(destAddress: string): string {
    const from = encodeURIComponent(`${listingAddress}, ${listingCity}, TX`);
    const to = encodeURIComponent(destAddress);
    return `https://www.google.com/maps/dir/${from}/${to}`;
  }

  return (
    <div className="bg-warm-gray">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-navy">Commute Times</h3>
          <p className="text-[12px] text-mid-gray">How far is this from where you need to be?</p>
        </div>
        <svg
          className={`w-5 h-5 text-gold transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Preset destinations */}
          <div className="space-y-2">
            {presets.map((preset) => {
              const { miles, driveMin } = getDistance(preset.lat, preset.lng);
              return (
                <a
                  key={preset.label}
                  href={getGoogleMapsUrl(preset.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white hover:bg-gold/5 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-navy group-hover:text-gold transition-colors">{preset.label}</p>
                    <p className="text-[11px] text-mid-gray">{miles} miles</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy">~{driveMin} min</p>
                    <p className="text-[10px] text-mid-gray">drive</p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Custom destination */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-2">
              Custom Destination
            </p>
            <div className="flex gap-2">
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter an address or place..."
                className="flex-1 border border-navy/15 px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
              />
              {destination && (
                <a
                  href={getGoogleMapsUrl(destination)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gold text-white px-4 py-2 text-[11px] font-semibold hover:bg-gold-dark transition-colors whitespace-nowrap"
                >
                  Get Directions
                </a>
              )}
            </div>
          </div>

          <p className="text-[10px] text-mid-gray italic">
            Drive times are rough estimates based on distance. Actual times vary with traffic.
            Click any destination to open in Google Maps for real-time routing.
          </p>
        </div>
      )}
    </div>
  );
}
