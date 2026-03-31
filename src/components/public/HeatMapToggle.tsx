"use client";

import { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";

interface HeatMapToggleProps {
  map: maplibregl.Map | null;
  geojson: GeoJSON.FeatureCollection | null;
}

type HeatMapMode = "off" | "price" | "density";

export function HeatMapToggle({ map, geojson }: HeatMapToggleProps) {
  const [mode, setMode] = useState<HeatMapMode>("off");
  const sourceAdded = useRef(false);

  useEffect(() => {
    if (!map || !geojson) return;

    // Add heat source if not exists
    if (!sourceAdded.current && !map.getSource("heat-data")) {
      map.addSource("heat-data", {
        type: "geojson",
        data: geojson,
      });
      sourceAdded.current = true;
    } else if (map.getSource("heat-data")) {
      (map.getSource("heat-data") as maplibregl.GeoJSONSource).setData(geojson);
    }

    // Remove existing heat layers
    if (map.getLayer("heat-layer")) map.removeLayer("heat-layer");
    if (map.getLayer("heat-point")) map.removeLayer("heat-point");

    if (mode === "off") return;

    if (mode === "price") {
      // Price heat map — weighted by listing price
      map.addLayer(
        {
          id: "heat-layer",
          type: "heatmap",
          source: "heat-data",
          maxzoom: 15,
          paint: {
            // Weight by price (normalize roughly)
            "heatmap-weight": [
              "interpolate", ["linear"],
              ["coalesce", ["get", "priceAmount"], 0],
              0, 0,
              200000, 0.2,
              500000, 0.4,
              1000000, 0.7,
              2000000, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              0, 1, 13, 3,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(201,169,110,0)",
              0.1, "rgba(201,169,110,0.1)",
              0.3, "rgba(201,169,110,0.3)",
              0.5, "rgba(218,165,32,0.5)",
              0.7, "rgba(255,140,0,0.7)",
              0.9, "rgba(255,69,0,0.85)",
              1, "rgba(220,20,60,1)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              0, 15, 13, 30, 15, 40,
            ],
            "heatmap-opacity": [
              "interpolate", ["linear"], ["zoom"],
              12, 0.8, 15, 0.3,
            ],
          },
        },
        "unclustered-point" // Place below markers
      );
    } else if (mode === "density") {
      // Listing density — uniform weight
      map.addLayer(
        {
          id: "heat-layer",
          type: "heatmap",
          source: "heat-data",
          maxzoom: 15,
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              0, 1, 13, 3,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(10,22,40,0)",
              0.1, "rgba(10,22,40,0.05)",
              0.3, "rgba(10,22,40,0.15)",
              0.5, "rgba(201,169,110,0.4)",
              0.7, "rgba(201,169,110,0.6)",
              0.9, "rgba(201,169,110,0.8)",
              1, "rgba(201,169,110,1)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              0, 20, 13, 35, 15, 50,
            ],
            "heatmap-opacity": [
              "interpolate", ["linear"], ["zoom"],
              12, 0.7, 15, 0.2,
            ],
          },
        },
        "unclustered-point"
      );
    }
  }, [map, geojson, mode]);

  return (
    <div className="absolute top-3 right-14 z-10 flex gap-1">
      {(["off", "density", "price"] as HeatMapMode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`bg-white shadow-md px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors ${
            mode === m
              ? "text-gold border border-gold"
              : "text-navy/50 hover:text-navy border border-transparent"
          }`}
        >
          {m === "off" ? "No Heat" : m === "density" ? "Density" : "Price"}
        </button>
      ))}
    </div>
  );
}
