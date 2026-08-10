import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Sparkles,
  CheckCircle,
  Lock,
  Key,
  UserCheck,
  Camera,
  CheckCheck,
  Circle,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import {
  apiGetNotifications,
  apiMarkRead,
  apiMarkAllRead,
  type ApiNotification,
  type NotificationType,
} from "../lib/api/notifications";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type NotifMeta = { icon: React.ReactNode; color: string; bg: string };

function getNotifMeta(type: NotificationType): NotifMeta {
  switch (type) {
    case "WELCOME":
      return { icon: <Sparkles size={16} />, color: "text-accent", bg: "bg-accent/10" };
    case "EMAIL_VERIFIED":
      return { icon: <CheckCircle size={16} />, color: "text-success", bg: "bg-success/10" };
    case "PASSWORD_CHANGED":
      return { icon: <Lock size={16} />, color: "text-warning", bg: "bg-warning/10" };
    case "PASSWORD_RESET_REQUESTED":
      return { icon: <Key size={16} />, color: "text-warning", bg: "bg-warning/10" };
    case "PROFILE_UPDATED":
      return { icon: <UserCheck size={16} />, color: "text-accent", bg: "bg-accent/10" };
    case "AVATAR_UPDATED":
      return { icon: <Camera size={16} />, color: "text-accent", bg: "bg-accent/10" };
    default:
      return { icon: <Bell size={16} />, color: "text-fg-muted", bg: "bg-surface-2" };
  }
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} ${mins === 1 ? "minuto" : "minutos"}`;
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

// ─── Agrupamento por data ─────────────────────────────────────────────────────

function groupByDate(notifications: ApiNotification[]) {
  const groups: { label: string; items: ApiNotification[] }[] = [];
  const map = new Map<string, ApiNotification[]>();

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Hoje";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Ontem";
    } else {
      label = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
    }

    if (!map.has(label)) {
      map.set(label, []);
      groups.push({ label, items: map.get(label)! });
    }
    map.get(label)!.push(n);
  }

  return groups;
}

// ─── Página ───────────────────────────────────────────────────────────────────

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: apiGetNotifications,
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
    },
    onSettled: invalidateNotifs,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const groups = groupByDate(notifications);

  return (
    <PageContainer>
      <PageHeader
        title="Notificações"
        description="Histórico de atividades da sua conta"
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck size={14} strokeWidth={1.5} />}
              loading={markAllReadMutation.isPending}
              onClick={() => { markAllReadMutation.mutate(); }}
            >
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <Bell size={20} className="text-fg-muted" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-fg">Nenhuma notificação</p>
            <p className="mt-1 text-xs text-fg-muted">
              As atividades da sua conta aparecerão aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
                {group.label}
              </p>
              <div className="divide-y divide-line rounded-xl border border-line bg-surface-1">
                {group.items.map((n) => {
                  const meta = getNotifMeta(n.type);
                  return (
                    <div
                      key={n.id}
                      className="group flex w-full items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.color}`}
                      >
                        {meta.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm ${!n.readAt ? "font-semibold text-fg" : "font-medium text-fg-muted"}`}>
                            {n.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-fg-muted" title={formatDate(n.createdAt)}>
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-fg-muted">{n.body}</p>
                      </div>

                      {/* Botão de marcar como lida */}
                      <div className="flex shrink-0 items-center self-center">
                        {!n.readAt ? (
                          <button
                            title="Marcar como lida"
                            onClick={() => markReadMutation.mutate(n.id)}
                            disabled={markReadMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
                          >
                            <Circle size={10} className="fill-accent group-hover:hidden" />
                            <CheckCircle size={16} className="hidden group-hover:block" />
                          </button>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center text-fg-muted/40">
                            <CheckCircle size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
