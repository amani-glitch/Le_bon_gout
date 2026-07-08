import type { Dict } from "./en";
import { dictionaries, useLangStore } from "./langStore";

/** Returns the copy dictionary for the active language (e.g. `t.hero.title`). */
export function useT(): Dict {
  const lang = useLangStore((s) => s.lang);
  return dictionaries[lang];
}

/**
 * Returns a translator for order-status labels in the active language.
 * Falls back to the raw status string for any unknown status.
 */
export function useStatusLabel(): (status: string) => string {
  const t = useT();
  return (status: string) => (t.status as Record<string, string>)[status] ?? status;
}
