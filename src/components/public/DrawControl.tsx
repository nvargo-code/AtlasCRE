"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface DrawControlProps {
  map: maplibregl.Map | null;
  onPolygonComplete: (polygon: [number, number][]) => void;
  onClear: () => void;
}

export function DrawControl({ map, onPolygonComplete, onClear }: DrawControlProps) {
  const [drawing, setDrawing] = useState(false);
  const [hasPolygon, setHasPolygon] = useState(false);
  const pointsRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!map || !drawing) return;

    // Add draw source and layers
    if (!map.getSource("draw-polygon")) {
      map.addSource("draw-polygon", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "draw-polygon-fill",
        type: "fill",
        source: "draw-polygon",
        paint: {
          "fill-color": "#C9A96E",
          "fill-opacity": 0.1,
        },
      });

      map.addLayer({
        id: "draw-polygon-line",
        type: "line",
        source: "draw-polygon",
        paint: {
          "line-color": "#C9A96E",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      map.addLayer({
        id: "draw-polygon-points",
        type: "circle",
        source: "draw-polygon",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#C9A96E",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }

    map.getCanvas().style.cursor = "crosshair";

    function handleClick(e: maplibregl.MapMouseEvent) {
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      pointsRef.current.push(point);
      updateDrawSource();
    }

    function handleDblClick(e: maplibregl.MapMouseEvent) {
      e.preventDefault();
      if (pointsRef.current.length >= 3) {
        completePolygon();
      }
    }

    function updateDrawSource() {
      const source = map!.getSource("draw-polygon") as maplibregl.GeoJSONSource;
      if (!source) return;

      const points = pointsRef.current;
      const features: GeoJSON.Feature[] = [];

      // Points
      points.forEach((p) => {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: p },
          properties: {},
        });
      });

      // Line/polygon
      if (points.length >= 3) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[...points, points[0]]],
          },
          properties: {},
        });
      } else if (points.length === 2) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: {},
        });
      }

      source.setData({ type: "FeatureCollection", features });
    }

    function completePolygon() {
      const points = pointsRef.current;
      if (points.length >= 3) {
        setDrawing(false);
        setHasPolygon(true);
        map!.getCanvas().style.cursor = "";
        onPolygonComplete(points);
      }
    }

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, drawing, onPolygonComplete]);

  function startDraw() {
    pointsRef.current = [];
    setDrawing(true);
    setHasPolygon(false);

    // Clear existing polygon
    if (map) {
      const source = map.getSource("draw-polygon") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }

  function clearDraw() {
    pointsRef.current = [];
    setDrawing(false);
    setHasPolygon(false);

    if (map) {
      const source = map.getSource("draw-polygon") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({ type: "FeatureCollection", features: [] });
      }
      map.getCanvas().style.cursor = "";
    }
    onClear();
  }

  return (
    <div className="absolute top-3 left-3 z-10 flex gap-2">
      {!drawing && !hasPolygon && (
        <button
          onClick={startDraw}
          className="bg-white shadow-md px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors flex items-center gap-1.5"
          title="Draw to search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Draw
        </button>
      )}

      {drawing && (
        <div className="bg-white shadow-md px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-gold">
          Click to add points. Double-click to complete.
        </div>
      )}

      {hasPolygon && (
        <button
          onClick={clearDraw}
          className="bg-white shadow-md px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray hover:text-red-500 transition-colors"
        >
          Clear Draw
        </button>
      )}
    </div>
  );
}
