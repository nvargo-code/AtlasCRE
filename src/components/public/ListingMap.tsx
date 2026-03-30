"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface ListingMapProps {
  lat: number;
  lng: number;
  address: string;
}

export function ListingMap({ lat, lng, address }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [lng, lat],
      zoom: 14,
      attributionControl: false,
    });

    // Add marker
    const el = document.createElement("div");
    el.className = "listing-marker";
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.backgroundColor = "#C9A96E";
    el.style.borderRadius = "50%";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

    new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 15 }).setText(address))
      .addTo(map);

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, address]);

  return (
    <div ref={containerRef} className="w-full h-[250px]" />
  );
}
