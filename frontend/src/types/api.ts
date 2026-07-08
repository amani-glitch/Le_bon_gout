// Mirrors the backend Pydantic schemas (snake_case over the wire).

export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "online" | "cash_on_delivery";
export type FulfillmentType = "delivery" | "pickup";

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  postcode: string;
  phone?: string | null;
  is_default: boolean;
}

export interface Preferences {
  default_fulfillment: FulfillmentType;
  marketing_opt_in: boolean;
  dietary: string[];
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string | null;
  role: UserRole;
  phone?: string | null;
  addresses: Address[];
  preferences: Preferences;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ToppingOption {
  id: string;
  name: string;
  price_cents: number;
}

export interface ToppingGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  multi_select: boolean;
  options: ToppingOption[];
}

export interface ProductSize {
  id: string;
  name: string;
  price_cents: number;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string | null;
  is_active: boolean;
  base_price_cents: number;
  sizes: ProductSize[];
  topping_groups: ToppingGroup[];
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SelectedTopping {
  id: string;
  name: string;
  price_cents: number;
}

export interface CartItem {
  line_id: string;
  product_id: string;
  name: string;
  image_url?: string | null;
  size_id: string;
  size_name: string;
  toppings: SelectedTopping[];
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  notes?: string | null;
}

export interface Cart {
  user_id: string;
  items: CartItem[];
  subtotal_cents: number;
  updated_at?: string | null;
}

export interface Fulfillment {
  type: FulfillmentType;
  address?: Address | null;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id?: string | null;
  amount_paid_cents: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at?: string | null;
  by: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  items: CartItem[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  fulfillment: Fulfillment;
  status: OrderStatus;
  payment: PaymentInfo;
  status_history: StatusEvent[];
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CheckoutResponse {
  order: Order;
  client_secret?: string | null;
}

export interface Favorite {
  id: string;
  product_id: string;
  name: string;
  image_url?: string | null;
  size_id: string;
  size_name: string;
  toppings: SelectedTopping[];
  created_at?: string | null;
}

export interface Page<T> {
  items: T[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface DashboardMetrics {
  orders_today: number;
  revenue_today_cents: number;
  active_orders: number;
  total_orders: number;
  total_customers: number;
  orders_by_status: { status: string; count: number }[];
  top_products: { product_id: string; name: string; quantity: number }[];
  revenue_total_cents: number;
}

// ── B2B leads ───────────────────────────────────────────────────
export type LeadInterest = "basic" | "custom" | "unsure";
export type LeadSource = "contact_form" | "bot_chat" | "bot_voice";
export type LeadStatus = "new" | "contacted" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  business_type?: string | null;
  interest: LeadInterest;
  message?: string | null;
  locale?: string | null;
  status: LeadStatus;
  source: LeadSource;
  channel?: string | null;
  conversation_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ── Botler concierge (chat + voice) ─────────────────────────────
export type BotChannel = "chat" | "voice";

export interface BotMessage {
  role: string;
  content: string;
  at?: string | null;
}

export interface BotConversationSummary {
  id: string;
  channel: BotChannel;
  user_id?: string | null;
  customer_email?: string | null;
  anonymous: boolean;
  message_count: number;
  tool_calls: string[];
  order_ids: string[];
  duration_seconds?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  ended_at?: string | null;
}

export interface BotConversation extends BotConversationSummary {
  messages: BotMessage[];
}

export interface BotStats {
  total_conversations: number;
  total_chats: number;
  total_calls: number;
  conversations_today: number;
  calls_today: number;
  total_messages: number;
  orders_via_bot: number;
  top_tools: { tool: string; count: number }[];
}
