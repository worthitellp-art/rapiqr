import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadiusMapProps {
  latitude: number;
  longitude: number;
  /** Coverage radius in km — drawn as a circle around the pin. 0 hides the circle. */
  radiusKm?: number;
  /** When provided, the pin is draggable and clicking the map moves it. */
  onMove?: (latitude: number, longitude: number) => void;
  className?: string;
}

// A CSS dot instead of Leaflet's default PNG marker, which breaks under bundlers
// (the image URLs resolve relative to the CSS file, not the built assets).
const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:#171717;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/**
 * Real OpenStreetMap view with a pin and a radius circle. Tiles are fetched by
 * the browser straight from tile.openstreetmap.org (map imagery only — no
 * coordinates of the user are sent anywhere except as tile x/y/z indexes).
 */
export default function RadiusMap({ latitude, longitude, radiusKm = 0, onMove, className }: RadiusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
      .setView([latitude, longitude], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([latitude, longitude], { icon: PIN_ICON, draggable: Boolean(onMoveRef.current) }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onMoveRef.current?.(p.lat, p.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!onMoveRef.current) return;
      marker.setLatLng(e.latlng);
      onMoveRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;
    // The container can mount hidden/zero-sized (step transitions, popups
    // animating in) — re-measure now and whenever it changes size.
    setTimeout(() => map.invalidateSize(), 0);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null;
    observer?.observe(containerRef.current);

    return () => {
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow position + radius changes.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const center = L.latLng(latitude, longitude);
    marker.setLatLng(center);

    if (radiusKm > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle(center, {
          radius: radiusKm * 1000,
          color: '#171717',
          weight: 2,
          fillColor: '#171717',
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(center);
        circleRef.current.setRadius(radiusKm * 1000);
      }
      map.fitBounds(circleRef.current.getBounds(), { padding: [24, 24], animate: true });
    } else {
      circleRef.current?.remove();
      circleRef.current = null;
      map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [latitude, longitude, radiusKm]);

  return <div ref={containerRef} className={className || 'h-64 w-full rounded-md border border-neutral-200 overflow-hidden z-0'} />;
}
