/**
 * Constantes metier centralisees pour DALOA HUB.
 * Toute regle de gestion (tarifs, statuts, categories) vit ici.
 */

export const APP_NAME = "DALOA HUB";

// --- Roles utilisateurs (RBAC) ---
export const USER_ROLES = ["client", "vendor", "driver", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// --- Statut des livreurs ---
export const DRIVER_STATUSES = ["pending", "approved", "rejected"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  pending: "En attente",
  approved: "Valide",
  rejected: "Rejete",
};

// --- Statut des vendeurs ---
export const VENDOR_STATUSES = ["pending", "approved", "rejected"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

// --- Statut des comptes ---
export const ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// --- Categories produits ---
export const CATEGORIES = [
  { slug: "mode", label: "Mode" },
  { slug: "chaussures", label: "Chaussures" },
  { slug: "telephones", label: "Telephones" },
  { slug: "informatique", label: "Informatique" },
  { slug: "electronique", label: "Electronique" },
  { slug: "maison", label: "Maison" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// --- Statuts de commande (cycle de vie) ---
export const ORDER_STATUSES = [
  "pending", // En attente
  "confirmed", // Confirmee
  "preparing", // Preparation
  "delivering", // En livraison
  "delivered", // Livree
  "refused", // Refusee
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  preparing: "Preparation",
  delivering: "En livraison",
  delivered: "Livree",
  refused: "Refusee",
};

// --- Type de livraison ---
export const DELIVERY_TYPES = ["standard", "bulky"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  standard: "Standard",
  bulky: "Volumineux",
};

// --- Mode de reception (choisi par le client au paiement) ---
export const FULFILLMENT_TYPES = ["delivery", "pickup"] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  delivery: "Livraison a domicile",
  pickup: "Retrait en boutique",
};

/**
 * Grille tarifaire de livraison (FCFA).
 * Le systeme choisit automatiquement la ligne selon le type de produit
 * et la distance (proximite vs distance).
 */
export const DELIVERY_FEES: Record<
  DeliveryType,
  { proximity: number; distance: number }
> = {
  standard: { proximity: 500, distance: 1000 },
  bulky: { proximity: 1500, distance: 2000 },
};

// --- Abonnement vendeur ---
export const SUBSCRIPTION_AMOUNT_FCFA = Number(
  process.env.SUBSCRIPTION_AMOUNT_FCFA ?? 1000,
);
export const SUBSCRIPTION_PERIOD_DAYS = Number(
  process.env.SUBSCRIPTION_PERIOD_DAYS ?? 30,
);

export const SUBSCRIPTION_EXPIRED_MESSAGE =
  "Veuillez renouveler votre abonnement.";

// --- Message de refus produit (frais de deplacement obligatoires) ---
export const REFUSAL_NOTICE =
  "Meme en cas de refus du produit, les frais de deplacement du livreur doivent etre payes.";

// --- Types de signalement ---
export const REPORT_TYPES = [
  { value: "scam", label: "Arnaque" },
  { value: "non_conform", label: "Produit non conforme" },
  { value: "bad_behavior", label: "Mauvais comportement" },
  { value: "other", label: "Autre" },
] as const;
export type ReportType = (typeof REPORT_TYPES)[number]["value"];

// --- Geolocalisation (Daloa par defaut) ---
export const DEFAULT_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 6.8772),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? -6.4502),
};

export const PROXIMITY_RADIUS_KM = Number(
  process.env.NEXT_PUBLIC_PROXIMITY_RADIUS_KM ?? 3,
);

// --- Notifications (types d'evenements) ---
export const NOTIFICATION_TYPES = [
  "new_order",
  "order_accepted",
  "driver_assigned",
  "delivery_completed",
  "order_refused",
  "subscription_expired",
  "driver_approved",
  "driver_rejected",
  "vendor_approved",
  "report_received",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
