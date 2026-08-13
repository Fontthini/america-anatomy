import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, ShoppingCart, GraduationCap, Package2, Share2, Newspaper, Presentation, X } from "lucide-react";
import { AaiLogo } from "../ui/AaiLogo";
import { cn } from "../../lib/cn";

const items = [
  { to: "/medico", label: "Início", icon: LayoutDashboard },
  { to: "/medico/loja", label: "Loja", icon: ShoppingCart },
  { to: "/medico/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/medico/blog", label: "Blog", icon: Newspaper },
  { to: "/medico/pedidos", label: "Meus Pedidos", icon: Package2 },
  { to: "/medico/indicar", label: "Indicar", icon: Share2 },
  { to: "/medico/painel-instrutor", label: "Painel do Instrutor", icon: Presentation },
];

export function MedicoMobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside className="absolute left-0 top-0 h-full w-[260px] border-r border-line-strong bg-popover p-3 shadow-[var(--shadow-pop)]">
        <div className="flex h-16 items-center justify-between border-b border-line px-1 pb-2">
          <Link to="/medico" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <AaiLogo size={38} />
            <span className="font-display text-sm font-semibold leading-tight text-fg">
              American Anatomy Institute
            </span>
          </Link>
          <button aria-label="Fechar" onClick={onClose} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-1 hover:text-fg">
            <X size={16} />
          </button>
        </div>
        <nav className="mt-3 space-y-0.5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const active = pathname === item.to;
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
