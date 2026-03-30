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

const DEFAULT_CENTER: [number, number] = [-97.7431, 30.2672];
const DEFAULT_ZOOM = 11;

function formatPopupPrice(amount: number | null): string {
  if (!amount) return "Contact";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function Map({ geojson, onBoundsChange, onMarkerClick, center, zoom }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
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

      // Cluster circles — gold theme
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "listings",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#C9A96E", 10,
            "#A8883F", 30,
            "#8B7033",
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            18, 10, 24, 30, 32,
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

      // Individual markers — navy with gold stroke
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "listings",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0A1628",
          "circle-radius": 7,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#C9A96E",
        },
      });

      // Cluster click — zoom in
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

      // Marker click — open detail
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        if (feature?.properties?.id) {
          onMarkerClickRef.current(feature.properties.id);
        }
      });

      // Marker hover — show popup preview
      map.on("mouseenter", "unclustered-point", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feature.properties || {};
        const price = formatPopupPrice(props.priceAmount);
        const details = [
          props.beds ? `${props.beds}bd` : null,
          props.baths ? `${props.baths}ba` : null,
          props.buildingSf ? `${Number(props.buildingSf).toLocaleString()} SF` : null,
        ].filter(Boolean).join(" · ");

        const html = `
          <div style="font-family:system-ui,sans-serif;min-width:180px;padding:2px">
            <div style="font-size:16px;font-weight:700;color:#0A1628;margin-bottom:2px">${price}</div>
            <div style="font-size:12px;color:#0A1628;opacity:0.7;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">${props.address || ""}</div>
            <div style="font-size:11px;color:#9A9A9A">${props.city || ""}${details ? " · " + details : ""}</div>
            <div style="font-size:10px;color:#C9A96E;font-weight:600;margin-top:4px;letter-spacing:0.05em;text-transform:uppercase">Click for details</div>
          </div>
        `;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          maxWidth: "260px",
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson || !loadedRef.current) return;
    const source = map.getSource("listings") as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(geojson);
  }, [geojson]);

  return <div ref={containerRef} className="w-full h-full" />;
}
