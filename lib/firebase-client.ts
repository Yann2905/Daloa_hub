"use client";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushResult = "ok" | "denied" | "unsupported" | "unconfigured" | "error";

export function isPushConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && vapidKey);
}

/**
 * Active les notifications push. DOIT idealement etre appele depuis un geste
 * utilisateur (clic), surtout sur iOS/Safari. Retourne un statut.
 */
export async function registerPush(): Promise<PushResult> {
  if (!isPushConfigured()) return "unconfigured";
  if (typeof window === "undefined") return "error";
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const qs = new URLSearchParams({
      apiKey: firebaseConfig.apiKey!,
      authDomain: firebaseConfig.authDomain ?? "",
      projectId: firebaseConfig.projectId!,
      messagingSenderId: firebaseConfig.messagingSenderId ?? "",
      appId: firebaseConfig.appId ?? "",
    });
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${qs.toString()}`,
      { scope: "/firebase-push" },
    );

    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return "unsupported";

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return "error";

    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    onMessage(messaging, (payload) => {
      const n = payload.notification;
      if (n && Notification.permission === "granted") {
        const notif = new Notification(n.title ?? "DALOA HUB", {
          body: n.body ?? undefined,
          icon: "/icons/icon.svg",
        });
        notif.onclick = () => {
          const url = (payload.data && (payload.data as { url?: string }).url) || "/";
          window.focus();
          window.location.href = url;
        };
      }
    });

    return "ok";
  } catch {
    return "error";
  }
}
