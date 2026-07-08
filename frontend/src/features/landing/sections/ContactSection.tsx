import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { useLangStore } from "@/i18n/langStore";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "../constants";
import { type LeadInterest, useSubmitLead } from "../leadsApi";

const INTERESTS: LeadInterest[] = ["basic", "custom", "unsure"];

export function ContactSection() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const submit = useSubmitLead();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<LeadInterest>("unsure");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate(
      {
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
        interest,
        message: message || undefined,
        locale: lang,
        company_website: honeypot || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t.contact.success);
          setName("");
          setCompany("");
          setEmail("");
          setPhone("");
          setInterest("unsure");
          setMessage("");
        },
        onError: () => toast.error(t.contact.error),
      },
    );
  }

  return (
    <section id="contact" className="scroll-mt-20 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl rounded-card border border-border bg-surface p-8 md:p-10"
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t.contact.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{t.contact.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">{t.contact.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-name">{t.contact.name}</Label>
              <Input
                id="lead-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-company">{t.contact.company}</Label>
              <Input
                id="lead-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-email">{t.contact.email}</Label>
              <Input
                id="lead-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">{t.contact.phone}</Label>
              <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>{t.contact.interestLabel}</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {INTERESTS.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setInterest(key)}
                  className={cn(
                    "rounded-ctl border px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                    interest === key
                      ? "border-primary bg-primary/10 text-text"
                      : "border-border bg-surface-2 text-text-muted hover:text-text",
                  )}
                >
                  {t.contact.interests[key]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="lead-message">{t.contact.message}</Label>
            <Textarea
              id="lead-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Honeypot — hidden from humans, off the tab order. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
          />

          <Button type="submit" size="lg" className="w-full" loading={submit.isPending}>
            {submit.isPending ? t.contact.sending : t.contact.submit}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-text-muted">
          <Phone className="h-4 w-4" /> {t.contact.orEmail}{" "}
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="font-medium text-primary hover:underline">
            {CONTACT_PHONE}
          </a>
        </p>
      </motion.div>
    </section>
  );
}
