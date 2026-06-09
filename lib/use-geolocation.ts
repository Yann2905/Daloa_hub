"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus =
  | "idle" // pas encore demande
  | "locating" // en cours
  | "granted" // position obtenue
  | "denied" // permission refusee
  | "unavailable"; // GPS indisponible (navigateur in-app, etc.)

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Geolocalisation avec gestion fine de la permission.
 * - Verifie l'etat de la permission (API Permissions) au montage.
 * - Si deja accordee, capture la position AUTOMATIQUEMENT (l'utilisateur n'a
 *   rien a faire ni a saisir).
 * - Sinon, `request()` declenche la demande sur action de l'utilisateur.
 */
export function useGeolocation(autoIfGranted = true) {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const requestedRef = useRef(false);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    // API Permissions (pas supportee partout : on degrade proprement)
    const perms = navigator.permissions;
    if (!perms?.query) return;

    let cancelled = false;
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (cancelled) return;
        if (p.state === "granted") {
          if (autoIfGranted && !requestedRef.current) {
            requestedRef.current = true;
            request();
          }
        } else if (p.state === "denied") {
          setStatus("denied");
        }
        p.onchange = () => {
          if (p.state === "denied") setStatus("denied");
          else if (p.state === "granted" && !requestedRef.current) {
            requestedRef.current = true;
            request();
          }
        };
      })
      .catch(() => {
        /* API indisponible : on reste en idle */
      });

    return () => {
      cancelled = true;
    };
  }, [autoIfGranted, request]);

  return { coords, status, request };
}
