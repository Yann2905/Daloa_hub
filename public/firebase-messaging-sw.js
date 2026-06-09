/* DALOA HUB - Service Worker Firebase Cloud Messaging
 * La config Firebase (publique) est passee en parametres d'URL a
 * l'enregistrement (les SW ne lisent pas les variables d'environnement).
 *
 * On laisse FCM afficher automatiquement les messages "notification" et gerer
 * le clic via webpush.fcmOptions.link (le plus fiable sur le web).
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
  // Initialise la messagerie : FCM affiche les notifications en arriere-plan
  // et gere le clic (ouverture du lien) automatiquement.
  firebase.messaging();
}
