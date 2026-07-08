import { Search } from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/brand/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useT } from "@/i18n/useT";
import { formatDate } from "@/lib/format";

import { useAdminCustomers } from "./adminApi";

export function AdminCustomers() {
  const t = useT();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminCustomers(search || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.admin.customers.title}</h1>
        <p className="text-text-muted">{t.admin.customers.subtitle}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <Input
          className="pl-9"
          placeholder={t.admin.customers.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.admin.customers.colCustomer}</th>
                <th className="px-4 py-3 font-medium">{t.admin.customers.colRole}</th>
                <th className="px-4 py-3 font-medium">{t.admin.customers.colJoined}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/15" />
                      )}
                      <div>
                        <p className="font-medium">{c.display_name}</p>
                        <p className="text-xs text-text-subtle">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={c.role === "admin" ? "gold" : "neutral"}>{c.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
