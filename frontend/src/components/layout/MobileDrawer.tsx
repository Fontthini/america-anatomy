import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, User, Settings2, X, Lock } from "lucide-react";
import { cn } from "../../lib/cn";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/profile", label: "Preferências", icon: Settings2, disabled: true },
];

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute left-0 top-0 h-full w-[260px] border-r border-line-strong bg-popover p-3 shadow-[var(--shadow-pop)]">
        <div className="flex h-12 items-center justify-between border-b border-line px-1 pb-2">
          <Link to="/dashboard" className="font-display text-lg text-fg" onClick={onClose}>
            base<span className="text-accent">.</span>
          </Link>
          <button aria-label="Fechar" onClick={onClose} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-1 hover:text-fg">
            <X size={16} />
          </button>
        </div>
        <nav className="mt-3 space-y-0.5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const active = pathname === item.to && !item.disabled;

            if (item.disabled) {
              return (
                <div
                  key={idx}
                  className="flex h-9 cursor-not-allowed items-center gap-3 rounded-md px-2.5 text-sm text-fg-muted/50"
                >
                  <Icon size={16} strokeWidth={1.5} className="opacity-40" />
                  <span className="flex-1">{item.label}</span>
                  <Lock size={12} strokeWidth={1.5} className="opacity-50" />
                </div>
              );
            }

            return (
              <Link
                key={idx}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                  active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-1 hover:text-fg",
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}