import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Globe } from "lucide-react";

import { type Lang, useLangStore } from "@/i18n/langStore";
import { cn } from "@/lib/cn";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
];

export function LangToggle() {
  const { lang, setLang } = useLangStore();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-ctl border border-border px-2.5 text-sm font-semibold uppercase text-text-muted transition-colors hover:text-text focus-ring"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          {lang}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-40 rounded-card border border-border bg-surface p-1.5 shadow-card"
        >
          {LANGS.map(({ code, label }) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setLang(code)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2.5 rounded-ctl px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-surface-2",
                lang === code ? "text-text" : "text-text-muted",
              )}
            >
              {label}
              {lang === code && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
