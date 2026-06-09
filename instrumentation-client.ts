// Sentry cote client : charge UNIQUEMENT si un DSN est configure.
// L'import dynamique evite d'alourdir le bundle (et de ralentir l'hydratation)
// tant que Sentry n'est pas active.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      enabled: process.env.NODE_ENV === "production",
    });
  });
}
