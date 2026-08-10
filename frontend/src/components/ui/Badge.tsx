import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "accent" | "warn" | "danger" | "muted";

const toneMap: Record<Tone, string> = {
  neutral: "border-line text-fg bg-surface-2",
  accent: "border-accent/30 text-accent bg-accent-soft",
  warn: "border-amber-500/30 text-amber-600 dark:text-amber-300 bg-amber-500/10",
  danger: "border-danger/30 text-danger bg-danger/10",
  muted: "border-line text-fg-muted bg-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        toneMap[tone],
        className,
      )}
      {...props}
    />
  );
}