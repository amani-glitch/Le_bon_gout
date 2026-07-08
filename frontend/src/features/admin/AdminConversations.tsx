import { MessageSquare, Phone, Receipt, Sparkles } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/brand/EmptyState";
import { Skeleton } from "@/components/brand/Skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { BotConversationSummary } from "@/types/api";

import { useBotConversation, useBotConversations, useBotStats } from "./adminApi";

function formatDuration(seconds?: number | null): string {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function who(c: BotConversationSummary, guestLabel: string): string {
  if (c.anonymous || !c.customer_email) return guestLabel;
  return c.customer_email;
}

export function AdminConversations() {
  const t = useT();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: stats } = useBotStats();
  const { data, isLoading } = useBotConversations(filter);

  const FILTERS: { label: string; value?: string }[] = [
    { label: t.admin.conversations.filterAll, value: undefined },
    { label: t.admin.conversations.filterChats, value: "chat" },
    { label: t.admin.conversations.filterCalls, value: "voice" },
  ];

  const cards = [
    { label: t.admin.conversations.conversations, value: stats?.total_conversations ?? 0, icon: Sparkles },
    { label: t.admin.conversations.chats, value: stats?.total_chats ?? 0, icon: MessageSquare },
    { label: t.admin.conversations.calls, value: stats?.total_calls ?? 0, icon: Phone },
    { label: t.admin.conversations.ordersViaBot, value: stats?.orders_via_bot ?? 0, icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.admin.conversations.title}</h1>
        <p className="text-text-muted">{t.admin.conversations.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-ctl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-display text-3xl tnum">{value}</p>
            <p className="text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {stats && (stats.total_messages > 0 || stats.top_tools.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="mb-4 font-display text-lg">{t.admin.conversations.today}</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-text-muted">{t.admin.conversations.conversationsToday}</span>
                <span className="font-medium tnum">{stats.conversations_today}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">{t.admin.conversations.callsToday}</span>
                <span className="font-medium tnum">{stats.calls_today}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">{t.admin.conversations.totalMessages}</span>
                <span className="font-medium tnum">{stats.total_messages}</span>
              </li>
            </ul>
          </div>
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="mb-4 font-display text-lg">{t.admin.conversations.mostUsedActions}</h2>
            {stats.top_tools.length === 0 ? (
              <p className="text-sm text-text-muted">{t.admin.conversations.noTools}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.top_tools.map((t) => (
                  <li key={t.tool} className="flex items-center justify-between">
                    <span className="text-text-muted">{t.tool.replace(/_/g, " ")}</span>
                    <span className="font-medium tnum">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colChannel}</th>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colWho}</th>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colMessages}</th>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colDuration}</th>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colOrders}</th>
                <th className="px-4 py-3 font-medium">{t.admin.conversations.colWhen}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {c.channel === "voice" ? (
                        <Phone className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                      {c.channel === "voice" ? t.admin.conversations.call : t.admin.conversations.chat}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3">
                    {who(c, t.admin.conversations.guest)}
                  </td>
                  <td className="px-4 py-3 tnum">{c.message_count}</td>
                  <td className="px-4 py-3 tnum">
                    {c.channel === "voice" ? formatDuration(c.duration_seconds) : "—"}
                  </td>
                  <td className="px-4 py-3 tnum">{c.order_ids.length || "—"}</td>
                  <td className="px-4 py-3 text-text-subtle">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={t.admin.conversations.emptyTitle}
          description={t.admin.conversations.emptyDescription}
        />
      )}

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-xl">
          <TranscriptView conversationId={openId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TranscriptView({ conversationId }: { conversationId: string | null }) {
  const t = useT();
  const { data, isLoading } = useBotConversation(conversationId ?? undefined);

  return (
    <div className="p-6">
      <DialogTitle className="mb-1 flex items-center gap-2 text-xl">
        {data?.channel === "voice" ? <Phone className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        {data?.channel === "voice"
          ? t.admin.conversations.callTranscript
          : t.admin.conversations.chatTranscript}
      </DialogTitle>
      {data && (
        <p className="mb-4 text-sm text-text-muted">
          {who(data, t.admin.conversations.guest)} · {formatDate(data.created_at)}
          {data.channel === "voice" && ` · ${formatDuration(data.duration_seconds)}`}
          {data.order_ids.length > 0 && ` · ${data.order_ids.length} ${t.admin.conversations.orderCount}`}
        </p>
      )}

      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.messages.length === 0 ? (
        <p className="text-sm text-text-muted">{t.admin.conversations.noTranscript}</p>
      ) : (
        <div className="space-y-3">
          {data.messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user" ? "bg-primary text-primary-fg" : "bg-surface-2 text-text",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
