import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { MapFeature, MapLayer, PersonalPlace } from "./types";

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  getBboxString: () => string | undefined;
  getBboxArray: () => number[] | undefined;
}

interface MapViewProps {
  layers: MapLayer[];
  features: MapFeature[];
  visibleLayerIds: Set<string>;
  personalPlaces?: PersonalPlace[];
  onFeatureClick?: (feature: MapFeature) => void;
  onMoveEnd?: (bbox: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  highlightFeatureId?: string | null;
}

const AUS_CENTER: [number, number] = [-33.8688, 151.2093]; // Sydney default

const TILES = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

function isDarkMode(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/** Allow-list #RGB / #RRGGBB only — never interpolate untrusted colour into icon HTML. */
function sanitizeHexColor(raw: unknown, fallback = "#005B7F"): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return value;
  return fallback;
}

function colorForLayer(layer?: MapLayer): string {
  return sanitizeHexColor(layer?.color, "#005B7F");
}

function makeDivIcon(color: string, label = "Map marker"): L.DivIcon {
  const safe = sanitizeHexColor(color);
  const aria = escapeHtml(label);
  // 44×44 hit target; visual pin stays 16px. Colour is allow-listed hex only.
  // Span (not <button>) so Leaflet keyboard:true remains the sole focusable control.
  return L.divIcon({
    className: "mapable-pin",
    html: `<span role="img" aria-label="${aria}" style="display:flex;align-items:center;justify-content:center;width:44px;height:44px"><span aria-hidden="true" style="display:block;width:16px;height:16px;border-radius:50% 50% 50% 0;background:${safe};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function popupHtml(f: MapFeature, layer?: MapLayer): string {
  const attrs = f.attributes || {};
  const rows = Object.entries(attrs)
    .filter(([k, v]) => !k.startsWith("_") && v != null && String(v).trim() !== "" && String(v).length < 200)
    .slice(0, 8)
    .map(([k, v]) => `<div style="display:flex;gap:6px;font-size:12px;margin-top:2px"><strong style="color:#555">${escapeHtml(k)}:</strong><span>${escapeHtml(String(v))}</span></div>`)
    .join("");
  return `<div style="min-width:180px;max-width:260px" role="group" aria-label="${escapeHtml(f.name)}">
    <div style="font-weight:700;font-size:14px;color:#004766">${escapeHtml(f.name)}</div>
    ${layer ? `<div style="font-size:11px;color:#888;margin-top:1px">${escapeHtml(layer.name)}</div>` : ""}
    ${f.description ? `<div style="font-size:12px;margin-top:4px">${escapeHtml(f.description)}</div>` : ""}
    ${rows}
  </div>`;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const lineLayerRef = useRef<L.LayerGroup | null>(null);
  const personalLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const themeObserverRef = useRef<MutationObserver | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 15) => {
      mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 });
    },
    getBboxString: () => {
      const b = mapRef.current?.getBounds();
      if (!b) return undefined;
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(",");
    },
    getBboxArray: () => {
      const b = mapRef.current?.getBounds();
      if (!b) return undefined;
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    },
  }));

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: props.center || AUS_CENTER,
      zoom: props.zoom || 12,
      zoomControl: true,
    });
    const initTiles = isDarkMode() ? TILES.dark : TILES.light;
    const tileLayer = L.tileLayer(initTiles.url, {
      attribution: initTiles.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Swap tiles when the app theme (dark class) toggles
    const themeObserver = new MutationObserver(() => {
      const next = isDarkMode() ? TILES.dark : TILES.light;
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(next.url);
        tileLayerRef.current.options.attribution = next.attribution;
        map.attributionControl?.addAttribution(next.attribution);
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    themeObserverRef.current = themeObserver;

    const cluster = (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    lineLayerRef.current = L.layerGroup().addTo(map);
    personalLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);

    map.on("moveend", () => {
      const b = map.getBounds();
      props.onMoveEnd?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(","));
    });

    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      themeObserverRef.current?.disconnect();
      themeObserverRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render features
  useEffect(() => {
    if (!ready || !clusterRef.current || !lineLayerRef.current) return;
    const layerById = new Map(props.layers.map((l) => [l.id, l]));
    clusterRef.current.clearLayers();
    lineLayerRef.current.clearLayers();

    const markers: L.Marker[] = [];
    for (const f of props.features) {
      if (!props.visibleLayerIds.has(f.layerId)) continue;
      const layer = layerById.get(f.layerId);
      const geomType = f.geometry?.type;

      if (geomType === "Point") {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        if (typeof lat !== "number" || typeof lng !== "number") continue;
        const marker = L.marker([lat, lng], {
          icon: makeDivIcon(colorForLayer(layer), f.name),
          title: f.name,
          alt: f.name,
          keyboard: true,
          riseOnHover: true,
        });
        marker.bindPopup(popupHtml(f, layer));
        const activate = () => {
          props.onFeatureClick?.(f);
          marker.openPopup();
        };
        marker.on("click", activate);
        marker.on("keypress", (e: L.LeafletKeyboardEvent) => {
          if (e.originalEvent.key === "Enter" || e.originalEvent.key === " ") {
            e.originalEvent.preventDefault();
            activate();
          }
        });
        markers.push(marker);
      } else if (geomType === "LineString") {
        const coords = (f.geometry.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
        const color = sanitizeHexColor(f.attributes?._color, colorForLayer(layer));
        const line = L.polyline(coords, { color, weight: 4, opacity: 0.8 });
        line.bindPopup(popupHtml(f, layer));
        if (props.onFeatureClick) line.on("click", () => props.onFeatureClick!(f));
        line.addTo(lineLayerRef.current!);
      } else if (geomType === "Polygon" || geomType === "MultiPolygon") {
        try {
          const gj = L.geoJSON(f.geometry as any, { style: { color: colorForLayer(layer), weight: 2, fillOpacity: 0.1 } });
          gj.bindPopup(popupHtml(f, layer));
          gj.addTo(lineLayerRef.current!);
        } catch { /* skip malformed */ }
      }
    }
    if (markers.length) clusterRef.current.addLayers(markers);
  }, [ready, props.features, props.visibleLayerIds, props.layers, props.onFeatureClick]);

  // Render personal places
  useEffect(() => {
    if (!ready || !personalLayerRef.current) return;
    personalLayerRef.current.clearLayers();
    for (const p of props.personalPlaces || []) {
      const lat = Number(p.lat), lng = Number(p.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      const marker = L.marker([lat, lng], {
        icon: makeDivIcon("#F8C51C", p.name),
        title: p.name,
        alt: p.name,
        keyboard: true,
        riseOnHover: true,
      });
      marker.bindPopup(`<div style="font-weight:700;color:#004766">${escapeHtml(p.name)}</div>${p.address ? `<div style="font-size:12px">${escapeHtml(p.address)}</div>` : ""}`);
      marker.on("keypress", (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === "Enter" || e.originalEvent.key === " ") {
          e.originalEvent.preventDefault();
          marker.openPopup();
        }
      });
      marker.addTo(personalLayerRef.current!);
    }
  }, [ready, props.personalPlaces]);

  // Highlight + fly to a feature
  useEffect(() => {
    if (!ready || !props.highlightFeatureId) return;
    const f = props.features.find((x) => x.id === props.highlightFeatureId);
    if (f?.lat && f?.lng) {
      mapRef.current?.flyTo([Number(f.lat), Number(f.lng)], 16, { duration: 0.8 });
    }
  }, [ready, props.highlightFeatureId, props.features]);

  const visibleFeatures = props.features.filter((f) =>
    props.visibleLayerIds.has(f.layerId),
  );
  const layerById = new Map(props.layers.map((l) => [l.id, l]));

  return (
    <div className={props.className} style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        ref={containerRef}
        style={{ flex: 1, minHeight: "12rem", width: "100%" }}
        data-testid="map-view"
        role="region"
        aria-label="Interactive accessibility map"
      />
      <div
        className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        data-testid="map-feature-list"
      >
        <h2 className="text-sm font-bold text-[#0C1833] dark:text-white">
          Map features ({visibleFeatures.length})
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Text alternative synchronised with the map. Activate a row to focus that feature.
        </p>
        {visibleFeatures.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No features in the current view.</p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {visibleFeatures.slice(0, 50).map((f) => {
              const layer = layerById.get(f.layerId);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C] dark:hover:bg-slate-800"
                    onClick={() => {
                      props.onFeatureClick?.(f);
                      if (f.lat != null && f.lng != null) {
                        mapRef.current?.flyTo(
                          [Number(f.lat), Number(f.lng)],
                          16,
                          { duration: 0.6 },
                        );
                      }
                    }}
                  >
                    <span className="truncate font-medium">{f.name}</span>
                    {layer ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {layer.name}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});
