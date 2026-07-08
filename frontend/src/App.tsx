import { useEffect } from "react";

import { AppRoutes } from "@/app/router/routes";
import { isRtl, useLangStore } from "@/i18n/langStore";

export default function App() {
  const lang = useLangStore((s) => s.lang);

  // Keep the document's language + direction in sync with the active locale
  // so Arabic renders right-to-left across every route (landing, demo, admin).
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = isRtl(lang) ? "rtl" : "ltr";
  }, [lang]);

  return <AppRoutes />;
}
