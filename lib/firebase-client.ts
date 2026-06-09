"use client";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function isPushConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && vapidKey);
}

/**
 * Demande la permission de notification, enregistre le SW FCM, recupere le
 * token et l'envoie au serveur. Tout est best-effort (no-op si non configure
 * ou non supporte). Firebase est charge en import dynamique pour ne pas
 * alourdir le bundle.
 */
export async function registerPush(): Promise<void> {
  if (!isPushConfigured()) return;
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

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
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (token) {
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    // Message au premier plan : notification systeme cliquable
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
  } catch {
    /* best-effort */
  }
}
