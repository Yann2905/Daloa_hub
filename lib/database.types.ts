/**
 * Types de la base PostgreSQL DALOA HUB.
 * Equivalent a la sortie de `supabase gen types typescript`, maintenu
 * manuellement en phase avec les migrations supabase/migrations/*.sql.
 */

export type UserRole = "client" | "vendor" | "driver" | "admin";
export type AccountStatus = "active" | "suspended";
export type DriverStatus = "pending" | "approved" | "rejected";
export type VendorStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "refused";
export type DeliveryType = "standard" | "bulky";
export type FulfillmentType = "delivery" | "pickup";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentPurpose = "order" | "subscription" | "delivery_fee";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type ReportType = "scam" | "non_conform" | "bad_behavior" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type RatingTarget = "vendor" | "driver";
export type NotificationType =
  | "new_order"
  | "order_accepted"
  | "driver_assigned"
  | "delivery_completed"
  | "order_refused"
  | "subscription_expired"
  | "driver_approved"
  | "driver_rejected"
  | "vendor_approved"
  | "report_received";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  account_status: AccountStatus;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  description: string | null;
  logo_url: string | null;
  status: VendorStatus;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  status: DriverStatus;
  cni_url: string | null;
  vehicle_doc_url: string | null;
  vehicle_type: string | null;
  is_available: boolean;
  lat: number | null;
  lng: number | null;
  last_seen_at: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_bulky: boolean;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface Order {
  id: string;
  code: string;
  client_id: string;
  vendor_id: string;
  driver_id: string | null;
  status: OrderStatus;
  delivery_type: DeliveryType;
  fulfillment_type: FulfillmentType;
  subtotal: number;
  delivery_fee: number;
  total: number;
  distance_km: number;
  dest_lat: number | null;
  dest_lng: number | null;
  dest_address: string | null;
  refused: boolean;
  refusal_reason: string | null;
  delivery_fee_paid: boolean;
  vendor_settled: boolean;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  vendor_id: string;
  amount: number;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  purpose: PaymentPurpose;
  amount: number;
  status: PaymentStatus;
  user_id: string | null;
  order_id: string | null;
  subscription_id: string | null;
  method: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  rater_id: string;
  target_type: RatingTarget;
  target_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  order_id: string | null;
  client_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  order_id: string | null;
  reporter_id: string;
  type: ReportType;
  message: string | null;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// --- Vues composees frequemment utilisees cote UI ---
export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  categories?: Pick<Category, "slug" | "name"> | null;
  vendors?: Pick<Vendor, "id" | "shop_name" | "rating_avg"> | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  vendors?: Pick<Vendor, "id" | "shop_name"> | null;
}
