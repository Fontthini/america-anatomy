import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  GraduationCap,
  Package2,
  Newspaper,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";
import { AaiLogo } from "../ui/AaiLogo";
import { cn } from "../../lib/cn";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };

const items: Item[] = [
  { to: "/medico", label: "Início", icon: LayoutDashboard },
  { to: "/medico/loja", label: "Loja", icon: ShoppingCart },
  { to: "/medico/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/medico/blog", label: "Blog", icon: Newspaper },
  { to: "/medico/pedidos", label: "Meus Pedidos", icon: Package2 },
];

export function MedicoSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-line bg-bg-elev md:flex",
        collapsed ? "w-[64px]" : "w-[232px]",
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-line px-3">
        {!collapsed && (
          <Link to="/medico" className="flex min-w-0 items-center gap-2.5">
            <AaiLogo size={42} />
            <span className="font-display text-sm font-semibold leading-tight text-fg">
              American Anatomy Institute
            </span>
          </Link>
        )}
        <button
          aria-label="Recolher sidebar"
          onClick={onToggle}
          className="ml-auto rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={idx}
              to={item.to}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-1 hover:text-fg",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-line p-3",
          collapsed ? "flex justify-center" : "flex items-center gap-2",
        )}
      >
        <Avatar name={user?.name ?? "?"} size={28} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-fg">{user?.name}</p>
            <p className="truncate text-xs text-fg-muted">Médico</p>
          </div>
        )}
      </div>
    </aside>
  );
}
