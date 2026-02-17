"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
  geojson: GeoJSON.FeatureCollection | null;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onMarkerClick: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

// Austin center by default
const DEFAULT_CENTER: [number, number] = [-97.7431, 30.2672];
const DEFAULT_ZOOM = 11;

export function Map({ geojson, onBoundsChange, onMarkerClick, center, zoom }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const emitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    onBoundsChangeRef.current({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: center || DEFAULT_CENTER,
      zoom: zoom || DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      loadedRef.current = true;

      map.addSource("listings", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "listings",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#14b8a6", 10,
            "#0d9488", 30,
            "#0f766e",
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            18, 10,
            24, 30,
            32,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "listings",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#fff" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "listings",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#14b8a6",
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("listings") as maplibregl.GeoJSONSource;
        try {
          const z = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: z,
          });
        } catch {
          // ignore
        }
      });

      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        if (feature?.properties?.id) {
          onMarkerClickRef.current(feature.properties.id);
        }
      });

      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });

      emitBounds();
    });

    map.on("moveend", emitBounds);

    mapRef.current = map;

    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update GeoJSON data when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson || !loadedRef.current) return;

    const source = map.getSource("listings") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    }
  }, [geojson]);

  return <div ref={containerRef} className="w-full h-full" />;
}
