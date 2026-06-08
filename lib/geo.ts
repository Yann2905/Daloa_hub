import { PROXIMITY_RADIUS_KM } from "./constants";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Distance en kilometres entre deux points (formule de Haversine).
 * Suffisant et performant pour des distances urbaines (Daloa).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // rayon terrestre km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Vrai si la distance est consideree "proximite" selon le rayon configure. */
export function isProximity(distanceKm: number): boolean {
  return distanceKm <= PROXIMITY_RADIUS_KM;
}

/**
 * Selectionne le livreur disponible le plus proche d'une position.
 * Retourne null si aucun livreur disponible.
 */
export function nearestDriver<T extends { lat: number | null; lng: number | null }>(
  origin: LatLng,
  drivers: T[],
): { driver: T; distanceKm: number } | null {
  let best: { driver: T; distanceKm: number } | null = null;
  for (const d of drivers) {
    if (d.lat == null || d.lng == null) continue;
    const distanceKm = haversineKm(origin, { lat: d.lat, lng: d.lng });
    if (!best || distanceKm < best.distanceKm) {
      best = { driver: d, distanceKm };
    }
  }
  return best;
}
