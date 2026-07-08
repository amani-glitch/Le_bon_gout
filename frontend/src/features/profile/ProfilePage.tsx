import * as Tabs from "@radix-ui/react-tabs";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import type { FulfillmentType, Preferences } from "@/types/api";

import {
  useAddAddress,
  useDeleteAddress,
  useProfile,
  useUpdateProfile,
} from "./profileApi";

const DIETARY: { key: string; label: keyof ReturnType<typeof useT>["profile"]["dietary"] }[] = [
  { key: "vegetarian", label: "vegetarian" },
  { key: "vegan", label: "vegan" },
  { key: "gluten-free", label: "glutenFree" },
  { key: "halal", label: "halal" },
];

const tabTrigger =
  "rounded-ctl px-4 py-2 text-sm font-medium text-text-muted transition-colors data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-sm";

export function ProfilePage() {
  const t = useT();
  const { data: profile } = useProfile();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl">{t.profile.title}</h1>
      <Tabs.Root defaultValue="account">
        <Tabs.List className="mb-6 inline-flex gap-1 rounded-ctl border border-border bg-surface-2 p-1">
          <Tabs.Trigger value="account" className={tabTrigger}>
            {t.profile.tabs.account}
          </Tabs.Trigger>
          <Tabs.Trigger value="addresses" className={tabTrigger}>
            {t.profile.tabs.addresses}
          </Tabs.Trigger>
          <Tabs.Trigger value="preferences" className={tabTrigger}>
            {t.profile.tabs.preferences}
          </Tabs.Trigger>
          <Tabs.Trigger value="appearance" className={tabTrigger}>
            {t.profile.tabs.appearance}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="account">
          <AccountTab profile={profile} />
        </Tabs.Content>
        <Tabs.Content value="addresses">
          <AddressesTab addresses={profile.addresses} />
        </Tabs.Content>
        <Tabs.Content value="preferences">
          <PreferencesTab preferences={profile.preferences} />
        </Tabs.Content>
        <Tabs.Content value="appearance">
          <div className="flex items-center justify-between rounded-card border border-border bg-surface p-5">
            <div>
              <p className="font-medium">{t.profile.theme}</p>
              <p className="text-sm text-text-muted">{t.profile.themeHint}</p>
            </div>
            <ThemeToggle />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-card border border-border bg-surface p-5">{children}</div>;
}

function AccountTab({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["data"]> }) {
  const t = useT();
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [phone, setPhone] = useState(profile.phone ?? "");

  return (
    <Card>
      <div className="mb-5 flex items-center gap-4">
        {profile.photo_url ? (
          <img src={profile.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/15" />
        )}
        <div>
          <p className="font-medium">{profile.email}</p>
          <p className="text-sm text-text-muted capitalize">{profile.role}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label>{t.profile.displayName}</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label>{t.profile.phone}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44…" />
        </div>
        <Button
          loading={update.isPending}
          onClick={() => update.mutate({ display_name: displayName, phone: phone || null })}
        >
          {t.profile.saveChanges}
        </Button>
      </div>
    </Card>
  );
}

function AddressesTab({
  addresses,
}: {
  addresses: NonNullable<ReturnType<typeof useProfile>["data"]>["addresses"];
}) {
  const t = useT();
  const add = useAddAddress();
  const del = useDeleteAddress();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", city: "", postcode: "" });

  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">
                {a.label}
                {a.is_default && (
                  <span className="ml-2 text-xs text-primary">{t.profile.default}</span>
                )}
              </p>
              <p className="text-sm text-text-muted">
                {a.line1}, {a.city} {a.postcode}
              </p>
            </div>
            <button
              onClick={() => del.mutate(a.id)}
              className="text-text-subtle hover:text-danger"
              aria-label={t.profile.deleteAddressAria}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </Card>
      ))}

      {show ? (
        <Card>
          <div className="space-y-3">
            <div>
              <Label>{t.profile.label}</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div>
              <Label>{t.profile.address}</Label>
              <Input
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.profile.city}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label>{t.profile.postcode}</Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                loading={add.isPending}
                onClick={() =>
                  add.mutate(
                    { ...form, line2: null, phone: null, is_default: addresses.length === 0 },
                    { onSuccess: () => setShow(false) },
                  )
                }
              >
                {t.profile.saveAddress}
              </Button>
              <Button variant="ghost" onClick={() => setShow(false)}>
                {t.profile.cancel}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" /> {t.profile.addAddress}
        </Button>
      )}
    </div>
  );
}

function PreferencesTab({ preferences }: { preferences: Preferences }) {
  const t = useT();
  const update = useUpdateProfile();
  const [prefs, setPrefs] = useState<Preferences>(preferences);

  useEffect(() => setPrefs(preferences), [preferences]);

  function toggleDietary(item: string) {
    setPrefs((p) => ({
      ...p,
      dietary: p.dietary.includes(item)
        ? p.dietary.filter((d) => d !== item)
        : [...p.dietary, item],
    }));
  }

  return (
    <Card>
      <div className="space-y-5">
        <div>
          <Label>{t.profile.defaultFulfillment}</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["delivery", "pickup"] as FulfillmentType[]).map((f) => (
              <button
                key={f}
                onClick={() => setPrefs({ ...prefs, default_fulfillment: f })}
                className={cn(
                  "rounded-ctl border px-3 py-2.5 text-sm transition-all",
                  prefs.default_fulfillment === f
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border text-text-muted",
                )}
              >
                {f === "delivery" ? t.profile.delivery : t.profile.pickup}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t.profile.dietaryPreferences}</Label>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleDietary(item.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-all",
                  prefs.dietary.includes(item.key)
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border text-text-muted",
                )}
              >
                {t.profile.dietary[item.label]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.marketing_opt_in}
            onChange={(e) => setPrefs({ ...prefs, marketing_opt_in: e.target.checked })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span className="text-sm text-text-muted">{t.profile.marketingOptIn}</span>
        </label>

        <Button loading={update.isPending} onClick={() => update.mutate({ preferences: prefs })}>
          {t.profile.savePreferences}
        </Button>
      </div>
    </Card>
  );
}
