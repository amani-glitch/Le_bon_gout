import { formatDistanceToNow } from "date-fns";

/** Money is stored as integer minor units of the Tunisian dinar (1 DT = 100). */
export function formatMoney(cents: number, symbol = "DT"): string {
  return `${(cents / 100).toFixed(2)} ${symbol}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function timeAgo(value?: string | null): string {
  if (!value) return "";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "";
  }
}
