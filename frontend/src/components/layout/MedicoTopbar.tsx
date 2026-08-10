import { Bell, Menu, LogOut, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "../ui/Avatar";
import { Dropdown, DropdownItem, DropdownSeparator } from "../ui/Dropdown";
import { useAuth } from "../../contexts/AuthContext";
import { apiGetNotifications, apiMarkAllRead, type ApiNotification } from "../../lib/api/notifications";

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
}

export function MedicoTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: apiGetNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: apiMarkAllRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.readAt).length;
  const preview: ApiNotification[] = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur md:px-6">
      <button
        aria-label="Abrir menu"
        onClick={onOpenMobile}
        className="rounded-md p-1.5 text-fg-muted hover:bg-surface-1 hover:text-fg md:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      <Dropdown
        trigger={
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-1 hover:text-fg">
            <Bell size={16} strokeWidth={1.5} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold leading-none text-accent-fg">
                {unread > 99 ? "+99" : unread}
              </span>
            )}
          </span>
        }
      >
        <div className="w-[320px] p-2">
          <div className="mb-2 flex items-center justify-between px-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Notificações</p>
            {unread > 0 && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  markAllReadMutation.mutate();
                }}
                className="text-[11px] text-fg-muted hover:text-fg"
              >
                Marcar todas
              </button>
            )}
          </div>
          {preview.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Bell size={20} className="text-fg-muted" strokeWidth={1.5} />
              <p className="text-xs text-fg-muted">Nenhuma notificação ainda</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {preview.map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 rounded-md p-2 hover:bg-surface-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm ${!n.readAt ? "font-medium text-fg" : "text-fg-muted"}`}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-fg-muted">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-fg-muted line-clamp-1">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dropdown>

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
    </header>
  );
}
