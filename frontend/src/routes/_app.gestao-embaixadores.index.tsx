import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListAmbassadorApplications,
  apiUpdateAmbassadorApplicationStatus,
  type AmbassadorApplicationStatus,
} from "../lib/api/ambassadors";

export const Route = createFileRoute("/_app/gestao-embaixadores/")({
  component: AmbassadorsManagementPage,
});

const statusTabs: { value: AmbassadorApplicationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "CONTACTED", label: "Contatados" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
];

const statusOptions: { value: AmbassadorApplicationStatus; label: string }[] = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
];

function AmbassadorsManagementPage() {
  const [filter, setFilter] = useState<AmbassadorApplicationStatus | "ALL">("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["ambassadorApplications"],
    queryFn: apiListAmbassadorApplications,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AmbassadorApplicationStatus }) =>
      apiUpdateAmbassadorApplicationStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["ambassadorApplications"] }),
    onError: (err) => toast({ kind: "error", title: "Erro ao atualizar", description: (err as Error).message }),
  });

  const filtered = useMemo(
    () => (filter === "ALL" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Conteúdo"
        title="Embaixadores"
        description="Candidaturas ao Programa de Embaixadores AAI."
      />

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === t.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhuma candidatura nesse status.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <Card key={app.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="muted">{app.profileType}</Badge>
                    {app.hasNetwork && <Badge tone="neutral">Tem rede de contatos</Badge>}
                    {app.availableForLives && <Badge tone="neutral">Disponível p/ lives</Badge>}
                  </div>
                  <p className="text-sm text-fg">{app.name}</p>
                  <p className="text-xs text-fg-muted">
                    {app.email} · {app.whatsapp}
                  </p>
                  {app.notes && <p className="mt-1 text-xs text-fg-muted">"{app.notes}"</p>}
                </div>
                <select
                  value={app.status}
                  onChange={(e) =>
                    statusMutation.mutate({ id: app.id, status: e.target.value as AmbassadorApplicationStatus })
                  }
                  className="h-8 shrink-0 rounded-md border border-line bg-surface-1 px-2 text-xs text-fg focus:border-accent/60 focus:outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
