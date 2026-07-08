// ── Le Bon Goût (Le Bardo) — contact & location ────────────────────────────
export const CONTACT_PHONE = "20 435 635";
export const CONTACT_PHONE_TEL = "+21620435635"; // for tel: links
export const CONTACT_EMAIL = "bongout.bardo@gmail.com";
export const ADDRESS = "Rue de Marrakech, Le Bardo, Tunis 2000";
export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Le+Bon+Gout+Le+Bardo+Tunis";
export const DELIVERY_ZONES = "Le Bardo · Tunis";

export interface Branch {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  phoneTel: string;
  hours: string;
  highlight?: boolean;
}

/** Le Bon Goût — Le Bardo. */
export const BRANCHES: Branch[] = [
  {
    id: "bardo",
    name: "Le Bon Goût — Le Bardo",
    area: "Le Bardo, Tunis",
    address: "Rue de Marrakech, Le Bardo, Tunis 2000",
    phone: "20 435 635",
    phoneTel: "+21620435635",
    hours: "Tous les jours · 10h00 – 23h55",
    highlight: true,
  },
];

export function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
