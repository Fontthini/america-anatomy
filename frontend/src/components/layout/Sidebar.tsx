import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Settings2,
  BarChart3,
  Layers,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Bell,
  UserCheck,
  KanbanSquare,
  Share2,
  Wallet,
  GraduationCap,
  Package,
  Newspaper,
  Image,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";
import { AaiLogo } from "../ui/AaiLogo";
import { cn } from "../../lib/cn";
import { roleLabels, type Role } from "../../lib/mock/users";

type Item = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  /** Se definido, o item só aparece para as roles listadas. */
  roles?: Role[];
};

const items: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/funil", label: "Funil", icon: KanbanSquare, roles: ["SALES_REP", "MANAGER", "ADMIN"] },
  { to: "/indicacoes", label: "Indicações", icon: Share2, roles: ["SALES_REP", "MANAGER", "ADMIN"] },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["MANAGER", "ADMIN"] },
  { to: "/catalogo", label: "Catálogo", icon: Package, roles: ["MANAGER", "ADMIN"] },
  { to: "/gestao-cursos", label: "Cursos", icon: GraduationCap, roles: ["MANAGER", "ADMIN"] },
  { to: "/blog", label: "Blog", icon: Newspaper, roles: ["MANAGER", "ADMIN"] },
  { to: "/banners", label: "Banners", icon: Image, roles: ["MANAGER", "ADMIN"] },
  { to: "/gestao-embaixadores", label: "Embaixadores", icon: Megaphone, roles: ["MANAGER", "ADMIN"] },
  { to: "/medicos-pendentes", label: "Médicos Pendentes", icon: UserCheck, roles: ["MANAGER", "ADMIN"] },
  { to: "/dashboard", label: "Analytics", icon: BarChart3, disabled: true },
  { to: "/dashboard", label: "Projetos", icon: Layers, disabled: true },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/notifications", label: "Notificações", icon: Bell },
  { to: "/profile", label: "Preferências", icon: Settings2, disabled: true },
];

export function Sidebar({
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
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
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
        {items
          .filter((item) => !item.roles || (user?.role && item.roles.includes(user.role)))
          .map((item, idx) => {
          const Icon = item.icon;
          const active = pathname === item.to && !item.disabled;

          if (item.disabled) {
            return (
              <div
                key={idx}
                className={cn(
                  "group flex h-9 cursor-not-allowed items-center gap-3 rounded-md px-2.5 text-sm text-fg-muted/50",
                  collapsed && "justify-center",
                )}
                title={`${item.label} — em breve`}
              >
                <Icon size={16} strokeWidth={1.5} className="shrink-0 opacity-40" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <Lock size={12} strokeWidth={1.5} className="shrink-0 opacity-50" />
                  </>
                )}
                {collapsed && <Lock size={12} strokeWidth={1.5} className="shrink-0 opacity-50" />}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.to}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                active
                  ? "bg-surface-2 text-fg"
                  : "text-fg-muted hover:bg-surface-1 hover:text-fg",
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
            <p className="truncate text-xs text-fg-muted">{user?.role ? roleLabels[user.role] : ""}</p>
          </div>
        )}
      </div>
    </aside>
  );
}