"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, Arial, sans-serif",
          background: "#F8FAFC",
          color: "#0B3C26",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#64748b", marginBottom: 20 }}>
            Nous avons ete notifies et travaillons a la corriger. Reessayez dans
            un instant.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#00A651",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
