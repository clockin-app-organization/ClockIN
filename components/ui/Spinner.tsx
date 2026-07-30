// components/ui/Spinner.tsx
"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "sm", className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-[2px] border-current border-r-transparent",
        {
          "h-3.5 w-3.5": size === "sm",
          "h-4.5 w-4.5": size === "md",
          "h-6 w-6": size === "lg",
        },
        className,
      )}
    />
  );
}
