import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListLeads,
  apiUpdateFunnelStage,
  apiClaimLead,
  apiRequestLeadReview,
  type FunnelStage,
  type LeadResponse,
} from "../lib/api/crm";

export const Route = createFileRoute("/_app/funil")({
  component: FunnelPage,
});

const STAGES: { value: FunnelStage; label: string }[] = [
  { value: "NEW", label: "Novo Lead" },
  { value: "FIRST_CONTACT", label: "Primeiro Contato" },
  { value: "AWAITING_RESPONSE", label: "Aguardando Resposta" },
  { value: "INTERESTED", label: "Interessado" },
  { value: "PAYMENT_LINK_SENT", label: "Link/Pix Enviado" },
  { value: "CUSTOMER", label: "Cliente" },
  { value: "LOST", label: "Perdido" },
];

const scopeTabs: { value: "mine" | "unassigned" | "all"; label: string }[] = [
  { value: "mine", label: "Meus" },
  { value: "unassigned", label: "Livres" },
  { value: "all", label: "Todos" },
];

function LeadCard({ lead }: { lead: LeadResponse }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingLoss, setPendingLoss] = useState(false);
  const [lossReason, setLossReason] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leads"] });

  const stageMutation = useMutation({
    mutationFn: ({ stage, reason }: { stage: FunnelStage; reason?: string }) =>
      apiUpdateFunnelStage(lead.id, stage, reason),
    onSuccess: () => {
      invalidate();
      setPendingLoss(false);
      setLossReason("");
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao mover lead", description: (err as Error).message }),
  });

  const claimMutation = useMutation({
    mutationFn: () => apiClaimLead(lead.id),
    onSuccess: invalidate,
    onError: (err) => toast({ kind: "error", title: "Erro ao assumir lead", description: (err as Error).message }),
  });

  const reviewMutation = useMutation({
    mutationFn: (action: "APPROVE" | "REJECT") => apiRequestLeadReview(lead.id, action),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Solicitação enviada", description: "O gerente vai decidir." });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao solicitar", description: (err as Error).message }),
  });

  function handleStageChange(value: FunnelStage) {
    if (value === "LOST") {
      setPendingLoss(true);
      return;
    }
    stageMutation.mutate({ stage: value });
  }

  return (
    <Card>
      <CardBody className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-fg">{lead.name}</p>
          {lead.approvalStatus === "IN_REVIEW" && <Badge tone="warn">Em análise</Badge>}
          {lead.approvalStatus === "PENDING" && <Badge tone="muted">Pendente</Badge>}
        </div>
        <p className="truncate text-xs text-fg-muted">{lead.email}</p>
        {(lead.specialty || lead.city) && (
          <p className="text-xs text-fg-muted">{[lead.specialty, lead.city].filter(Boolean).join(" · ")}</p>
        )}

        <select
          value={lead.funnelStage}
          onChange={(e) => handleStageChange(e.target.value as FunnelStage)}
          disabled={stageMutation.isPending}
          className="h-8 w-full rounded-md border border-line bg-surface-1 px-2 text-xs text-fg focus:border-accent/60 focus:outline-none"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {pendingLoss && (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              placeholder="Motivo da perda"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="h-8 flex-1 rounded-md border border-line bg-surface-1 px-2 text-xs text-fg placeholder:text-fg-muted/70 focus:border-accent/60 focus:outline-none"
            />
            <Button size="sm" variant="danger" onClick={() => stageMutation.mutate({ stage: "LOST", reason: lossReason })}>
              OK
            </Button>
          </div>
        )}

        {!lead.assignedSalesRepId && user?.role === "SALES_REP" && (
          <Button size="sm" variant="secondary" className="w-full" leftIcon={<UserPlus size={12} />} onClick={() => claimMutation.mutate()}>
            Assumir
          </Button>
        )}

        {lead.approvalStatus === "PENDING" && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => reviewMutation.mutate("APPROVE")}>
              Solicitar aprovação
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => reviewMutation.mutate("REJECT")}>
              Solicitar rejeição
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function FunnelPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"mine" | "unassigned" | "all">(user?.role === "SALES_REP" ? "mine" : "all");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", scope],
    queryFn: () => apiListLeads({ scope }),
  });

  return (
    <PageContainer className="max-w-none">
      <PageHeader eyebrow="CRM" title="Funil" description="Acompanhe os leads do cadastro até virarem clientes." />

      {user?.role === "SALES_REP" && (
        <div className="flex gap-2">
          {scopeTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setScope(t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                scope === t.value
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.funnelStage === stage.value);
            return (
              <div key={stage.value} className="w-[280px] shrink-0 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{stage.label}</p>
                  <Badge tone="muted">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2.5">
                  {stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
