/* DALOA HUB - Service Worker Firebase Cloud Messaging
 * La config Firebase (publique) est passee en parametres d'URL lors de
 * l'enregistrement (les SW ne lisent pas les variables d'environnement).
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Message recu alors que l'app est en arriere-plan / fermee
  messaging.onBackgroundMessage((payload) => {
    const n = (payload && payload.notification) || {};
    const data = (payload && payload.data) || {};
    self.registration.showNotification(n.title || "DALOA HUB", {
      body: n.body || "",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url: data.url || "/" },
      vibrate: [80, 40, 80],
    });
  });
}

// Clic sur la notification -> ouvre/active la page correspondante.
// Si la page est protegee et que l'utilisateur n'est pas connecte, le
// middleware le redirige automatiquement vers /login.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
