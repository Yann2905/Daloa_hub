"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus =
  | "idle" // pas encore demande
  | "locating" // en cours
  | "granted" // position obtenue
  | "denied" // permission refusee (apres tentative reelle)
  | "unavailable"; // GPS indisponible (apres tentative reelle)

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Geolocalisation robuste.
 * - Si la permission est DEJA accordee : capture automatique (rien a faire).
 * - Sinon on reste en "idle" et on NE bloque PAS : un appui sur le bouton
 *   declenche reellement la demande native (le statut "denied/unavailable"
 *   n'est affiche qu'apres un echec reel, jamais par anticipation).
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
    requestedRef.current = true;
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
        // On ne classe en "denied" qu'apres une vraie tentative refusee
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const perms = navigator.permissions;
    if (!perms?.query) return;

    let cancelled = false;
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (cancelled) return;
        // On capture AUTO uniquement si deja accorde. Sinon on reste "idle"
        // (on n'affiche PAS "bloque" tant que l'utilisateur n'a pas essaye).
        if (p.state === "granted" && autoIfGranted && !requestedRef.current) {
          request();
        }
        p.onchange = () => {
          if (p.state === "granted" && !requestedRef.current) request();
        };
      })
      .catch(() => {
        /* API Permissions absente : on laisse l'utilisateur appuyer */
      });

    return () => {
      cancelled = true;
    };
  }, [autoIfGranted, request]);

  return { coords, status, request };
}
