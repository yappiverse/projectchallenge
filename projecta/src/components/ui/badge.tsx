import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.3em] transition",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/10 text-white",
        outline: "border-white/25 text-slate-200",
        glow: "border-transparent bg-white/15 text-white shadow-[0_0_25px_rgba(255,255,255,0.35)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
