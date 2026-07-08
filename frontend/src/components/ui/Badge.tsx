import { cn } from "@/lib/cn";

type Tone = "neutral" | "gold" | "success" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text-muted border-border",
  gold: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
