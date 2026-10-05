import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";

/**
 * Shared dashboard button. `default` is white/black — the house style for
 * ordinary actions in both the client and admin dashboards — so a plain
 * `<Button>` never needs a className override to get that look. Primary
 * CTAs (the ones that should still read as "the main action" on a screen,
 * e.g. "Get Free Sticker", "New Order") stay on the existing
 * `bg-[var(--fx-accent)]` treatment rather than this component, so a screen
 * still has exactly one obvious main action.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--fx-radius-control)] text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--fx-accent)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black border border-[var(--fx-border)] shadow-sm shadow-black/5 hover:bg-[var(--fx-canvas)]",
        destructive:
          "bg-[#DC2626] text-white shadow-sm shadow-black/5 hover:bg-[#B91C1C]",
        outline:
          "border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] shadow-sm shadow-black/5 hover:bg-[var(--fx-canvas)]",
        secondary:
          "bg-[var(--fx-canvas)] text-[var(--fx-ink)] hover:bg-[var(--fx-border)]",
        ghost: "text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)]",
        link: "text-[var(--fx-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[var(--fx-radius-control)] px-3 text-xs",
        lg: "h-10 rounded-[var(--fx-radius-control)] px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

export default Button;
