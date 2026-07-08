// Fixed, flattering sample data for the public read-only admin preview
// (`/demo/admin`). Nothing here touches the backend — it lets a visitor
// explore what the Le Bon Goût admin space looks like without an account.
// Money is in integer minor units of the Tunisian dinar (1 DT = 100).
import type {
  BotConversation,
  BotConversationSummary,
  BotStats,
  CartItem,
  DashboardMetrics,
  Lead,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  User,
} from "@/types/api";

// Deterministic timestamps (no Date.now()) so the preview is stable.
const T = (iso: string) => iso;

export const demoMetrics: DashboardMetrics = {
  orders_today: 31,
  revenue_today_cents: 74300,
  active_orders: 5,
  total_orders: 1042,
  total_customers: 638,
  revenue_total_cents: 2864500,
  orders_by_status: [
    { status: "pending", count: 2 },
    { status: "preparing", count: 2 },
    { status: "out_for_delivery", count: 1 },
    { status: "delivered", count: 4 },
    { status: "completed", count: 19 },
    { status: "cancelled", count: 3 },
  ],
  top_products: [
    { product_id: "prod_pizza_bongout", name: "Pizza Bon Goût", quantity: 184 },
    { product_id: "prod_escalope_panee", name: "Escalope Panée", quantity: 162 },
    { product_id: "prod_poisson_grille", name: "Poisson Grillé", quantity: 121 },
    { product_id: "prod_paella", name: "Paella Fruits de Mer", quantity: 98 },
    { product_id: "prod_grillade_mixte", name: "Grillade Mixte", quantity: 87 },
  ],
};

function item(name: string, qty: number, cents: number): CartItem {
  return {
    line_id: `line_${name.toLowerCase().replace(/\s+/g, "_")}`,
    product_id: `prod_${name.toLowerCase().replace(/\s+/g, "_")}`,
    name,
    size_id: "one",
    size_name: "Portion",
    toppings: [],
    quantity: qty,
    unit_price_cents: cents,
    line_total_cents: cents * qty,
  };
}

function order(
  id: string,
  name: string,
  email: string,
  status: OrderStatus,
  method: PaymentMethod,
  fulfillmentType: "delivery" | "pickup",
  paid: boolean,
  items: CartItem[],
  createdAt: string,
): Order {
  const subtotal = items.reduce((n, i) => n + i.line_total_cents, 0);
  const delivery = 0;
  return {
    id,
    user_id: `user_${id}`,
    customer_email: email,
    customer_name: name,
    items,
    subtotal_cents: subtotal,
    delivery_fee_cents: delivery,
    total_cents: subtotal + delivery,
    fulfillment: { type: fulfillmentType },
    status,
    payment: {
      method,
      status: paid ? "paid" : "pending",
      amount_paid_cents: paid ? subtotal + delivery : 0,
    },
    status_history: [{ status, at: createdAt, by: "system" }],
    created_at: createdAt,
  };
}

export const demoOrders: Order[] = [
  order("ord_a1b2c3d4", "Mohamed Ben Ali", "mohamed@example.com", "preparing", "cash_on_delivery", "delivery", false, [
    item("Pizza Bon Goût", 1, 1600),
    item("Penne Bolognaise", 1, 1200),
  ], T("2026-07-02T11:42:00Z")),
  order("ord_e5f6g7h8", "Sarra Trabelsi", "sarra@example.com", "pending", "cash_on_delivery", "delivery", false, [
    item("Escalope Panée", 2, 1300),
  ], T("2026-07-02T11:35:00Z")),
  order("ord_i9j0k1l2", "Youssef Gharbi", "youssef@example.com", "out_for_delivery", "cash_on_delivery", "delivery", false, [
    item("Poisson Grillé", 1, 1800),
    item("Salade Bon Goût", 1, 800),
  ], T("2026-07-02T11:12:00Z")),
  order("ord_m3n4o5p6", "Emna Bouazizi", "emna@example.com", "completed", "cash_on_delivery", "pickup", true, [
    item("Paella Fruits de Mer", 1, 2000),
  ], T("2026-07-02T10:04:00Z")),
  order("ord_q7r8s9t0", "Aymen Jelassi", "aymen@example.com", "delivered", "cash_on_delivery", "delivery", true, [
    item("1/4 Poulet Grillé", 2, 1200),
  ], T("2026-07-02T09:21:00Z")),
  order("ord_u1v2w3x4", "Nour Chebbi", "nour@example.com", "cancelled", "cash_on_delivery", "pickup", false, [
    item("Grillade Mixte", 1, 2000),
  ], T("2026-07-01T20:47:00Z")),
];

function product(
  id: string,
  name: string,
  description: string,
  category: string,
  fromCents: number,
  active: boolean,
): Product {
  return {
    id,
    name,
    description,
    category,
    image_url: null,
    is_active: active,
    base_price_cents: fromCents,
    sizes: [{ id: `${id}_one`, name: "Portion", price_cents: fromCents }],
    topping_groups: [],
    sort_order: 0,
  };
}

export const demoProducts: Product[] = [
  product("prod_pizza_bongout", "Pizza Bon Goût", "La spéciale maison au feu de bois : viande, poulet, olives, œuf et fromage.", "pizza", 1600, true),
  product("prod_escalope_panee", "Escalope Panée", "Escalope panée croustillante, frites, pâtes et salade.", "plats", 1300, true),
  product("prod_poisson_grille", "Poisson Grillé", "Poisson frais grillé, frites, pâtes et salade.", "plats", 1800, true),
  product("prod_paella", "Paella Fruits de Mer", "Paella généreuse aux fruits de mer.", "plats", 2000, true),
  product("prod_salade_bongout", "Salade Bon Goût", "Salade composée de la maison, généreuse.", "entrees", 800, true),
  product("prod_tiramisu", "Tiramisu", "Mascarpone, café et cacao.", "desserts", 600, false),
];

function customer(id: string, name: string, email: string, joined: string): User {
  return {
    id,
    email,
    display_name: name,
    photo_url: null,
    role: "customer",
    addresses: [],
    preferences: { default_fulfillment: "delivery", marketing_opt_in: true, dietary: [] },
    created_at: joined,
  };
}

export const demoCustomers: User[] = [
  customer("user_1", "Mohamed Ben Ali", "mohamed@example.com", T("2026-05-18T09:00:00Z")),
  customer("user_2", "Sarra Trabelsi", "sarra@example.com", T("2026-05-22T14:30:00Z")),
  customer("user_3", "Youssef Gharbi", "youssef@example.com", T("2026-06-01T18:12:00Z")),
  customer("user_4", "Emna Bouazizi", "emna@example.com", T("2026-06-11T12:45:00Z")),
  customer("user_5", "Aymen Jelassi", "aymen@example.com", T("2026-06-20T20:05:00Z")),
  customer("user_6", "Nour Chebbi", "nour@example.com", T("2026-06-28T08:33:00Z")),
];

export const demoBotStats: BotStats = {
  total_conversations: 284,
  total_chats: 205,
  total_calls: 79,
  conversations_today: 14,
  calls_today: 4,
  total_messages: 2317,
  orders_via_bot: 51,
  top_tools: [
    { tool: "add_to_cart", count: 104 },
    { tool: "search_menu", count: 88 },
    { tool: "create_order", count: 51 },
    { tool: "track_order", count: 33 },
  ],
};

export const demoConversations: BotConversationSummary[] = [
  {
    id: "conv_1",
    channel: "chat",
    customer_email: "mohamed@example.com",
    anonymous: false,
    message_count: 8,
    tool_calls: ["search_menu", "add_to_cart", "create_order"],
    order_ids: ["ord_a1b2c3d4"],
    created_at: T("2026-07-02T11:38:00Z"),
  },
  {
    id: "conv_2",
    channel: "voice",
    anonymous: true,
    message_count: 12,
    tool_calls: ["search_menu", "add_to_cart"],
    order_ids: [],
    duration_seconds: 172,
    created_at: T("2026-07-02T11:05:00Z"),
  },
  {
    id: "conv_3",
    channel: "chat",
    anonymous: true,
    message_count: 5,
    tool_calls: ["track_order"],
    order_ids: [],
    created_at: T("2026-07-02T10:22:00Z"),
  },
  {
    id: "conv_4",
    channel: "voice",
    customer_email: "aymen@example.com",
    anonymous: false,
    message_count: 15,
    tool_calls: ["search_menu", "add_to_cart", "create_order"],
    order_ids: ["ord_q7r8s9t0"],
    duration_seconds: 228,
    created_at: T("2026-07-02T09:14:00Z"),
  },
];

const demoTranscripts: Record<string, BotConversation["messages"]> = {
  conv_1: [
    { role: "user", content: "Bonjour ! C'est quoi la Pizza Bon Goût ?" },
    { role: "assistant", content: "C'est notre spéciale maison au feu de bois : viande, poulet, olives, œuf et fromage — à 16 DT." },
    { role: "user", content: "J'en prends une, et des penne bolognaise." },
    { role: "assistant", content: "J'ai ajouté 1× Pizza Bon Goût et 1× Penne Bolognaise. Livraison ou sur place ?" },
    { role: "user", content: "Livraison au Bardo." },
    { role: "assistant", content: "Parfait — total 28.00 DT. Je valide la commande ?" },
    { role: "user", content: "Oui." },
    { role: "assistant", content: "Commande #a1b2c3d4 enregistrée — la cuisine s'en occupe. Vous aurez le suivi en direct !" },
  ],
  conv_4: [
    { role: "assistant", content: "Le Bon Goût à votre service — que puis-je pour vous aujourd'hui ?" },
    { role: "user", content: "Deux quarts de poulet grillé à emporter." },
    { role: "assistant", content: "Deux 1/4 Poulet Grillé, à emporter. Une boisson avec ?" },
    { role: "user", content: "Non merci." },
    { role: "assistant", content: "C'est noté — 24.00 DT, prêt dans 20 minutes environ. Je valide." },
  ],
};

export function demoConversation(id: string): BotConversation {
  const summary =
    demoConversations.find((c) => c.id === id) ?? demoConversations[0];
  return { ...summary, messages: demoTranscripts[id] ?? [] };
}

export const demoLeads: Lead[] = [
  {
    id: "lead_1",
    name: "Skander Mansour",
    email: "skander@example.com",
    phone: "+216 22 345 678",
    company: "Anniversaire (20 pers.)",
    business_type: "Événement",
    interest: "custom",
    message: "Je souhaite réserver pour un anniversaire de 20 personnes samedi soir.",
    status: "new",
    source: "contact_form",
    created_at: T("2026-07-02T10:58:00Z"),
  },
  {
    id: "lead_2",
    name: "Ines Khelifi",
    email: "ines@example.com",
    business_type: "Traiteur",
    interest: "custom",
    message: "Besoin d'un devis traiteur pour un déjeuner d'entreprise (pizzas et grillades).",
    status: "contacted",
    source: "bot_chat",
    created_at: T("2026-07-01T16:20:00Z"),
  },
  {
    id: "lead_3",
    name: "Rania Sassi",
    email: "rania@example.com",
    phone: "+216 55 112 233",
    business_type: "Réservation",
    interest: "basic",
    message: "Une table pour 4 vendredi 20h au Bardo, c'est possible ?",
    status: "won",
    source: "bot_voice",
    created_at: T("2026-06-29T13:05:00Z"),
  },
  {
    id: "lead_4",
    name: "Bilel Amri",
    email: "bilel@example.com",
    business_type: "Commande de groupe",
    interest: "unsure",
    status: "new",
    source: "contact_form",
    created_at: T("2026-06-28T09:41:00Z"),
  },
];
