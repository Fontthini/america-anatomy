import {
  Bell,
  Menu,
  Search,
  LogOut,
  User,
  Sparkles,
  CheckCircle,
  Lock,
  Key,
  UserCheck,
  Camera,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Dropdown, DropdownItem, DropdownSeparator } from "../ui/Dropdown";
import { ThemeToggle } from "../ui/ThemeToggle";
import { DensityToggle } from "../ui/DensityToggle";
import { CommandPalette } from "../ui/CommandPalette";
import { useAuth } from "../../contexts/AuthContext";
import {
  apiGetNotifications,
  apiMarkRead,
  apiMarkAllRead,
  type ApiNotification,
  type NotificationType,
} from "../../lib/api/notifications";
import { getToken } from "../../lib/api/client";
import { useToast } from "../../contexts/ToastContext";

// ─── Mapeamento de ícone e cor por tipo ───────────────────────────────────────

type NotifMeta = { icon: React.ReactNode; color: string };

function getNotifMeta(type: NotificationType): NotifMeta {
  switch (type) {
    case "WELCOME":
      return { icon: <Sparkles size={14} />, color: "text-accent" };
    case "EMAIL_VERIFIED":
      return { icon: <CheckCircle size={14} />, color: "text-success" };
    case "PASSWORD_CHANGED":
      return { icon: <Lock size={14} />, color: "text-warning" };
    case "PASSWORD_RESET_REQUESTED":
      return { icon: <Key size={14} />, color: "text-warning" };
    case "PROFILE_UPDATED":
      return { icon: <UserCheck size={14} />, color: "text-accent" };
    case "AVATAR_UPDATED":
      return { icon: <Camera size={14} />, color: "text-accent" };
    default:
      return { icon: <Bell size={14} />, color: "text-fg-muted" };
  }
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 30) return `há ${days}d`;
  return `há ${Math.floor(days / 30)}m`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cmdOpen, setCmdOpen] = useState(false);

  const isLoggedIn = !!getToken();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: apiGetNotifications,
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const invalidateNotifs = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    [queryClient],
  );

  const markReadMutation = useMutation({
    mutationFn: apiMarkRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<ApiNotification[]>(["notifications"]);
      queryClient.setQueryData<ApiNotification[]>(["notifications"], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["notifications"], ctx?.prev);
    },
    onSettled: invalidateNotifs,
  });

  const markAllReadMutation = useMutation({
    mutationFn: apiMarkAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<ApiNotification[]>(["notifications"]);
      queryClient.setQueryData<ApiNotification[]>(["notifications"], (old = []) =>
        old.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["notifications"], ctx?.prev);
      toast({ kind: "error", title: "Erro", description: "Não foi possível marcar as notificações." });
    },
    onSettled: invalidateNotifs,
  });

  const unread = notifications.filter((n) => !n.readAt).length;
  const preview = notifications.slice(0, 5);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleNotifClick(n: ApiNotification) {
    if (!n.readAt) {
      markReadMutation.mutate(n.id);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur md:px-6">
      <button
        aria-label="Abrir menu"
        onClick={onOpenMobile}
        className="rounded-md p-1.5 text-fg-muted hover:bg-surface-1 hover:text-fg md:hidden"
      >
        <Menu size={18} />
      </button>

      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        aria-label="Abrir paleta de comandos"
        className="press group relative flex h-9 w-full max-w-md flex-1 items-center gap-2 rounded-lg border border-line bg-surface-1 pl-3 pr-2 text-left text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        <Search size={14} strokeWidth={1.5} />
        <span className="flex-1 truncate">Buscar páginas, ações…</span>
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
          ⌘K
        </kbd>
      </button>

      <DensityToggle />

      <ThemeToggle />

      {/* ── Sino de notificações ── */}
      <Dropdown
        trigger={
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-1 hover:text-fg">
            <Bell size={16} strokeWidth={1.5} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold leading-none text-white">
                {unread > 99 ? "+99" : unread}
              </span>
            )}
          </span>
        }
      >
        <div className="w-[320px] p-2">
          <div className="mb-2 flex items-center justify-between px-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Notificações
            </p>
            <div className="flex items-center gap-2">
              {unread > 0 && <Badge tone="muted">{unread} novas</Badge>}
              {unread > 0 && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllReadMutation.mutate();
                  }}
                  disabled={markAllReadMutation.isPending}
                  className="text-[11px] text-fg-muted hover:text-fg disabled:opacity-50"
                >
                  {markAllReadMutation.isPending ? "…" : "Marcar todas"}
                </button>
              )}
            </div>
          </div>

          {preview.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Bell size={20} className="text-fg-muted" strokeWidth={1.5} />
              <p className="text-xs text-fg-muted">Nenhuma notificação ainda</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {preview.map((n) => {
                const meta = getNotifMeta(n.type);
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    className="group relative flex items-start gap-2.5 rounded-md p-2 hover:bg-surface-1"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 ${meta.color}`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm ${isUnread ? "font-medium text-fg" : "text-fg-muted"}`}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-fg-muted">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-fg-muted line-clamp-1">{n.body}</p>
                    </div>
                    {/* Ponto azul → botão ✓ no hover */}
                    {isUnread && (
                      <button
                        title="Marcar como lida"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(n.id);
                        }}
                        className="mt-1.5 shrink-0 flex items-center justify-center"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full group-hover:bg-accent/20 group-hover:text-accent">
                          <span className="block h-2 w-2 rounded-full bg-accent group-hover:hidden" />
                          <CheckCircle size={12} className="hidden text-accent group-hover:block" />
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="mt-2 border-t border-line pt-2">
              <button
                onClick={() => void navigate({ to: "/notifications" })}
                className="w-full rounded-md py-1.5 text-center text-xs text-fg-muted hover:bg-surface-1 hover:text-fg"
              >
                Ver histórico completo
              </button>
            </div>
          )}
        </div>
      </Dropdown>

      {/* ── Menu do usuário ── */}
      <Dropdown
        trigger={
          <span className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-1">
            <Avatar name={user?.name ?? "?"} src={user?.avatarUrl} size={26} />
          </span>
        }
      >
        <div className="px-2.5 py-2">
          <p className="text-sm text-fg">{user?.name}</p>
          <p className="text-xs text-fg-muted">{user?.email}</p>
        </div>
        <DropdownSeparator />
        <DropdownItem onClick={() => navigate({ to: "/profile" })}>
          <User size={14} strokeWidth={1.5} /> Perfil
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          danger
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut size={14} strokeWidth={1.5} /> Sair
        </DropdownItem>
      </Dropdown>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </header>
  );
}
