import type { ReactNode } from "react";
import type React from "react";
import { cn } from "../../lib/cn";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "page-enter mx-auto w-full max-w-6xl space-y-8 px-4 pb-16 pt-10 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-2 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-fg-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-5xl text-fg md:text-6xl">{title}</h1>
        {description ? (
          <p className="max-w-xl text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-2">{action}</div> : null}
    </header>
  );
}