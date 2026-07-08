import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-fg hover:brightness-105 active:scale-[0.98] shadow-glow font-semibold",
  secondary: "bg-surface-2 text-text hover:bg-border border border-border",
  outline: "border border-border-strong text-text hover:bg-surface-2",
  ghost: "text-text-muted hover:text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-ctl gap-1.5",
  md: "h-11 px-5 text-sm rounded-ctl gap-2",
  lg: "h-13 px-7 text-base rounded-ctl gap-2 py-3.5",
  icon: "h-10 w-10 rounded-ctl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
