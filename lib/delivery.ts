import {
  DELIVERY_FEES,
  type DeliveryType,
  type CategorySlug,
} from "./constants";
import { isProximity, type LatLng, haversineKm } from "./geo";

/**
 * Determine le type de livraison a partir des categories de produits du panier.
 * Les categories "volumineuses" (meuble, machine, grand ecran) relevent du
 * tarif VOLUMINEUX. Pour la V1, "maison" et "electronique" peuvent contenir
 * des articles volumineux ; un drapeau explicite `is_bulky` au niveau produit
 * prime toujours (voir resolveDeliveryType ci-dessous).
 */
const BULKY_CATEGORIES: CategorySlug[] = ["maison"];

export function categoryIsBulky(slug: CategorySlug): boolean {
  return BULKY_CATEGORIES.includes(slug);
}

/**
 * Resout le type de livraison pour un panier.
 * - Si au moins un article est marque volumineux (is_bulky) => bulky.
 * - Sinon, selon les categories.
 */
export function resolveDeliveryType(
  items: { categorySlug: CategorySlug; isBulky?: boolean }[],
): DeliveryType {
  const hasBulky = items.some(
    (i) => i.isBulky || categoryIsBulky(i.categorySlug),
  );
  return hasBulky ? "bulky" : "standard";
}

/**
 * Calcule les frais de livraison selon le type et la distance.
 * Le systeme choisit automatiquement proximite vs distance.
 */
export function computeDeliveryFee(
  deliveryType: DeliveryType,
  distanceKm: number,
): number {
  const grid = DELIVERY_FEES[deliveryType];
  return isProximity(distanceKm) ? grid.proximity : grid.distance;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  distanceKm: number;
}

/**
 * Calcule l'ensemble des totaux d'un panier (sous-total, livraison, total).
 */
export function computeCartTotals(params: {
  items: {
    unitPrice: number;
    quantity: number;
    categorySlug: CategorySlug;
    isBulky?: boolean;
  }[];
  origin: LatLng; // position du vendeur / point de retrait
  destination: LatLng; // position du client
}): CartTotals {
  const { items, origin, destination } = params;
  const subtotal = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );
  const deliveryType = resolveDeliveryType(items);
  const distanceKm = haversineKm(origin, destination);
  const deliveryFee = computeDeliveryFee(deliveryType, distanceKm);

  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryType,
    distanceKm: Math.round(distanceKm * 100) / 100,
  };
}
