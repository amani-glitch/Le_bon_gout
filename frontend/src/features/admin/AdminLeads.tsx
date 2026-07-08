import { MessageSquare, Mic, Mail } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/brand/EmptyState";
import { Skeleton } from "@/components/brand/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Lead, LeadSource, LeadStatus } from "@/types/api";

import { useAdminLeads, useUpdateLeadStatus } from "./adminApi";

const STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

const STATUS_TONE: Record<LeadStatus, "gold" | "info" | "success" | "danger"> = {
  new: "gold",
  contacted: "info",
  won: "success",
  lost: "danger",
};

const SOURCE_KEY: Record<LeadSource, "form" | "botChat" | "botCall"> = {
  contact_form: "form",
  bot_chat: "botChat",
  bot_voice: "botCall",
};

function SourceIcon({ source }: { source: LeadSource }) {
  if (source === "bot_voice") return <Mic className="h-4 w-4 text-primary" />;
  if (source === "bot_chat") return <MessageSquare className="h-4 w-4 text-primary" />;
  return <Mail className="h-4 w-4 text-primary" />;
}

export function AdminLeads() {
  const t = useT();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const { data, isLoading } = useAdminLeads(filter);

  const FILTERS: { label: string; value?: string }[] = [
    { label: t.admin.leads.filters.all, value: undefined },
    { label: t.admin.leads.filters.new, value: "new" },
    { label: t.admin.leads.filters.contacted, value: "contacted" },
    { label: t.admin.leads.filters.won, value: "won" },
    { label: t.admin.leads.filters.lost, value: "lost" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.admin.leads.title}</h1>
        <p className="text-text-muted">{t.admin.leads.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-primary/40 bg-primary/10 text-text"
                : "border-border text-text-muted hover:text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colName}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colBusiness}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colEmail}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colInterest}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colSource}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colStatus}</th>
                <th className="px-4 py-3 font-medium">{t.admin.leads.colWhen}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setOpenLead(lead)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="max-w-[180px] truncate px-4 py-3">{lead.company || "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-text-muted">{lead.email}</td>
                  <td className="px-4 py-3 capitalize text-text-muted">{lead.interest}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <SourceIcon source={lead.source} /> {t.admin.leads.source[SOURCE_KEY[lead.source]]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[lead.status]}>
                      {t.admin.leads.statusLabels[lead.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-subtle">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={t.admin.leads.emptyTitle}
          description={t.admin.leads.emptyDescription}
        />
      )}

      <Dialog open={!!openLead} onOpenChange={(o) => !o && setOpenLead(null)}>
        <DialogContent className="max-w-lg">
          {openLead && <LeadDetail lead={openLead} onClose={() => setOpenLead(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const t = useT();
  const update = useUpdateLeadStatus();

  return (
    <div className="p-6">
      <DialogTitle className="mb-1 text-xl">{lead.name}</DialogTitle>
      <p className="mb-4 text-sm text-text-muted">
        {lead.company ? `${lead.company} · ` : ""}
        {t.admin.leads.source[SOURCE_KEY[lead.source]]} · {formatDate(lead.created_at)}
      </p>

      <dl className="space-y-2 text-sm">
        <Row label={t.admin.leads.email}>
          <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
            {lead.email}
          </a>
        </Row>
        {lead.phone && (
          <Row label={t.admin.leads.phone}>
            <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
              {lead.phone}
            </a>
          </Row>
        )}
        <Row label={t.admin.leads.interest}>
          <span className="capitalize">{lead.interest}</span>
        </Row>
        {lead.business_type && <Row label={t.admin.leads.businessType}>{lead.business_type}</Row>}
        {lead.message && (
          <div className="pt-2">
            <p className="mb-1 font-medium text-text-muted">{t.admin.leads.message}</p>
            <p className="whitespace-pre-wrap rounded-ctl border border-border bg-surface-2 p-3 text-text">
              {lead.message}
            </p>
          </div>
        )}
      </dl>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-text-muted">{t.admin.leads.status}</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === lead.status ? "primary" : "outline"}
              loading={update.isPending && update.variables?.status === s}
              onClick={() =>
                update.mutate(
                  { leadId: lead.id, status: s },
                  { onSuccess: onClose },
                )
              }
            >
              {t.admin.leads.statusLabels[s]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right text-text">{children}</dd>
    </div>
  );
}
