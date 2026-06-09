"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Loader2, MapPin } from "lucide-react";
import { haversineKm } from "@/lib/geo";

type LatLng = { lat: number; lng: number };

// Icones personnalisees (evitent le bug d'icones Leaflet + bundler)
const destIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-100%)">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#00A651" stroke="#fff" stroke-width="1.5">
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [0, 0],
});

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%)">
    <span style="display:block;width:18px;height:18px;border-radius:50%;background:#1D4ED8;border:3px solid #fff;box-shadow:0 0 0 4px rgba(29,78,216,.3)"></span>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [0, 0],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, points]);
  return null;
}

export default function DeliveryMap({ dest }: { dest: LatLng }) {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [info, setInfo] = useState<{ km: string; min: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const lastFetch = useRef<LatLng | null>(null);

  // Suit la position du livreur en temps reel
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGeoError(false);
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Recalcule l'itineraire quand le livreur s'est suffisamment deplace (>40 m)
  useEffect(() => {
    if (!pos) return;
    const moved =
      !lastFetch.current || haversineKm(lastFetch.current, pos) > 0.04;
    if (!moved) return;
    lastFetch.current = pos;

    const ctrl = new AbortController();
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const r = await fetch(url, { signal: ctrl.signal });
        const d = await r.json();
        const best = d?.routes?.[0];
        if (best) {
          setRoute(
            best.geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
            ),
          );
          setInfo({
            km: (best.distance / 1000).toFixed(1),
            min: Math.max(1, Math.round(best.duration / 60)),
          });
        }
      } catch {
        /* itineraire indisponible : on garde au moins les marqueurs */
      }
    })();
    return () => ctrl.abort();
  }, [pos, dest]);

  const fitPoints: [number, number][] = [
    [dest.lat, dest.lng],
    ...(pos ? ([[pos.lat, pos.lng]] as [number, number][]) : []),
  ];
  const externalUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${pos ? `${pos.lat},${pos.lng}` : ""};${dest.lat},${dest.lng}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border">
        <MapContainer
          center={[dest.lat, dest.lng]}
          zoom={14}
          style={{ height: 280, width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <Marker position={[dest.lat, dest.lng]} icon={destIcon} />
          {pos && <Marker position={[pos.lat, pos.lng]} icon={driverIcon} />}
          {route.length > 0 && (
            <Polyline positions={route} pathOptions={{ color: "#1D4ED8", weight: 5, opacity: 0.85 }} />
          )}
          <FitBounds points={route.length ? route : fitPoints} />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-2">
        {info ? (
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Navigation className="size-4 text-accent" />
            {info.km} km - environ {info.min} min
          </p>
        ) : pos ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Calcul de l&apos;itineraire...
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" /> Destination affichee
          </p>
        )}
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-accent hover:underline"
        >
          Plein ecran
        </a>
      </div>

      {geoError && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          Activez la localisation (ou ouvrez dans Chrome/Safari) pour voir votre
          position et l&apos;itineraire en direct.
        </p>
      )}
    </div>
  );
}
