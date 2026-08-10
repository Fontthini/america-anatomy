import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

type Ctx = { value: string; setValue: (v: string) => void };
const TabsCtx = createContext<Ctx | null>(null);

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-6 border-b border-line", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "relative -mb-px py-3 text-sm transition-colors",
        active ? "text-fg" : "text-fg-muted hover:text-fg",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-x-0 -bottom-px h-px transition-colors",
          active ? "bg-accent" : "bg-transparent",
        )}
      />
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={cn("pt-6", className)}>{children}</div>;
}