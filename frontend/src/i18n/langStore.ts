import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";
import { zh } from "./zh";

export type Lang = "en" | "fr" | "ar" | "zh";

export const dictionaries = { en, fr, ar, zh } as const;

/** Languages written right-to-left. */
export const RTL_LANGS: Lang[] = ["ar"];

export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

function detectDefault(): Lang {
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("ar")) return "ar";
    if (nav.startsWith("zh")) return "zh";
  }
  return "en";
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectDefault(),
      setLang: (lang) => set({ lang }),
    }),
    { name: "lebongout-lang" },
  ),
);
