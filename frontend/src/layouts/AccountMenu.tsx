import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Heart, LayoutDashboard, LogOut, Receipt, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useLogout } from "@/features/auth/api";
import { useAuth } from "@/features/auth/useAuth";
import { useT } from "@/i18n/useT";

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-ctl px-3 py-2 text-sm text-text outline-none transition-colors data-[highlighted]:bg-surface-2";

export function AccountMenu() {
  const t = useT();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const logout = useLogout();

  if (!isAuthenticated) {
    return (
      <Button size="sm" onClick={() => navigate("/login")}>
        {t.app.account.signIn}
      </Button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border p-0.5 pr-2.5 transition-colors hover:bg-surface-2 focus-ring">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserIcon className="h-4 w-4" />
            </span>
          )}
          <span className="hidden max-w-[100px] truncate text-sm font-medium sm:block">
            {user?.display_name?.split(" ")[0]}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-card border border-border bg-surface p-1.5 shadow-card"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{user?.display_name}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item className={itemClass} onSelect={() => navigate("/orders")}>
            <Receipt className="h-4 w-4 text-text-muted" /> {t.app.account.myOrders}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => navigate("/favorites")}>
            <Heart className="h-4 w-4 text-text-muted" /> {t.app.account.favorites}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => navigate("/profile")}>
            <UserIcon className="h-4 w-4 text-text-muted" /> {t.app.account.profile}
          </DropdownMenu.Item>
          {isAdmin && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item className={itemClass} onSelect={() => navigate("/admin")}>
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span className="text-primary">{t.app.account.adminDashboard}</span>
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={itemClass}
            onSelect={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
          >
            <LogOut className="h-4 w-4 text-text-muted" /> {t.app.account.signOut}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
