import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { useT } from "@/i18n/useT";

import { ADDRESS, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL } from "../constants";

export function LandingFooter() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border py-10">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-text-muted">{t.footer.tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-text">{t.footer.contact}</p>
          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Phone className="h-4 w-4" /> {CONTACT_PHONE}
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
          </a>
          <p className="flex items-start gap-2 text-text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {ADDRESS}
          </p>
        </div>
      </div>
      <p className="mt-8 text-xs text-text-subtle">
        © {year} Le Bon Goût — Le Bardo. {t.footer.rights}
      </p>
    </footer>
  );
}
