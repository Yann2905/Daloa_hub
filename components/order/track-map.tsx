"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Loader2 } from "lucide-react";
import { haversineKm } from "@/lib/geo";

type LatLng = { lat: number; lng: number };

const destIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-100%)"><svg width="32" height="32" viewBox="0 0 24 24" fill="#00A651" stroke="#fff" stroke-width="1.5"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [0, 0],
});
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%)"><span style="display:block;width:18px;height:18px;border-radius:50%;background:#1D4ED8;border:3px solid #fff;box-shadow:0 0 0 4px rgba(29,78,216,.3)"></span></div>`,
  iconSize: [18, 18],
  iconAnchor: [0, 0],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
    else if (points.length === 1) map.setView(points[0], 15);
  }, [map, points]);
  return null;
}

export default function TrackMap({ orderId, dest }: { orderId: string; dest: LatLng }) {
  const [driver, setDriver] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [info, setInfo] = useState<{ km: string; min: number } | null>(null);
  const lastFetch = useRef<LatLng | null>(null);

  // Recupere la position du livreur en boucle (toutes les 10 s)
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/orders/${orderId}/tracking`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (active && d.driver) setDriver({ lat: d.driver.lat, lng: d.driver.lng });
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [orderId]);

  // Itineraire livreur -> client
  useEffect(() => {
    if (!driver) return;
    const moved = !lastFetch.current || haversineKm(lastFetch.current, driver) > 0.05;
    if (!moved) return;
    lastFetch.current = driver;
    const ctrl = new AbortController();
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driver.lng},${driver.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const r = await fetch(url, { signal: ctrl.signal });
        const d = await r.json();
        const best = d?.routes?.[0];
        if (best) {
          setRoute(best.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]));
          setInfo({ km: (best.distance / 1000).toFixed(1), min: Math.max(1, Math.round(best.duration / 60)) });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => ctrl.abort();
  }, [driver, dest]);

  const fit: [number, number][] = [
    [dest.lat, dest.lng],
    ...(driver ? ([[driver.lat, driver.lng]] as [number, number][]) : []),
  ];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border">
        <MapContainer center={[dest.lat, dest.lng]} zoom={14} style={{ height: 280, width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <Marker position={[dest.lat, dest.lng]} icon={destIcon} />
          {driver && <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />}
          {route.length > 0 && <Polyline positions={route} pathOptions={{ color: "#1D4ED8", weight: 5, opacity: 0.85 }} />}
          <FitBounds points={route.length ? route : fit} />
        </MapContainer>
      </div>
      {info ? (
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Navigation className="size-4 text-accent" /> Livreur a {info.km} km - environ {info.min} min
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Localisation du livreur en cours...
        </p>
      )}
    </div>
  );
}
