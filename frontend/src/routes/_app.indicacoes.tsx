import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DollarSign } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListReferrals,
  apiUpdateReferralStatus,
  apiLaunchCommission,
  type ReferralType,
  type ReferralResponse,
} from "../lib/api/referrals";

export const Route = createFileRoute("/_app/indicacoes")({
  component: ReferralsPage,
});

const typeTabs: { value: ReferralType; label: string }[] = [
  { value: "PATIENT", label: "Pacientes" },
  { value: "DOCTOR", label: "Médicos" },
];

const PATIENT_STATUSES = [
  { value: "IN_PROGRESS", label: "Em Atendimento" },
  { value: "NEGOTIATION", label: "Negociação" },
  { value: "PAID", label: "Pago" },
  { value: "CANCELLED", label: "Cancelado" },
];
const DOCTOR_STATUSES = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "REJECTED", label: "Reprovado" },
];

function ReferralCard({ referral }: { referral: ReferralResponse }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCommission, setShowCommission] = useState(false);
  const [amount, setAmount] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["referrals"] });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiUpdateReferralStatus(referral.id, status),
    onSuccess: invalidate,
    onError: (err) => toast({ kind: "error", title: "Erro ao atualizar", description: (err as Error).message }),
  });

  const commissionMutation = useMutation({
    mutationFn: (value: number) => apiLaunchCommission(referral.id, value),
    onSuccess: () => {
      invalidate();
      setShowCommission(false);
      toast({ kind: "success", title: "Comissão lançada", description: "Já apareceu no financeiro como saída." });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao lançar comissão", description: (err as Error).message }),
  });

  const statuses = referral.type === "PATIENT" ? PATIENT_STATUSES : DOCTOR_STATUSES;
  const currentStatus = referral.type === "PATIENT" ? referral.patientStatus : referral.doctorStatus;
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  return (
    <Card>
      <CardBody className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-fg">
              {referral.firstName} {referral.lastName}
            </p>
            <p className="text-xs text-fg-muted">{referral.whatsapp}</p>
          </div>
          <Badge tone="accent">{referral.type === "PATIENT" ? "Paciente" : "Médico"}</Badge>
        </div>
        <p className="text-xs text-fg-muted">Indicado(a) por Dr(a). {referral.referringDoctorName}</p>
        {referral.crm && <p className="text-xs text-fg-muted">CRM: {referral.crm}</p>}

        <select
          value={currentStatus ?? ""}
          onChange={(e) => statusMutation.mutate(e.target.value)}
          disabled={statusMutation.isPending}
          className="h-8 w-full rounded-md border border-line bg-surface-1 px-2 text-xs text-fg focus:border-accent/60 focus:outline-none"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {isManager && (
          <div className="border-t border-line pt-2.5">
            {referral.commissionPaid ? (
              <Badge tone="neutral">Comissão paga: R$ {referral.commissionAmount}</Badge>
            ) : showCommission ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-8"
                />
                <Button
                  size="sm"
                  loading={commissionMutation.isPending}
                  onClick={() => commissionMutation.mutate(Number(amount))}
                  disabled={!amount || Number(amount) <= 0}
                >
                  Lançar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" leftIcon={<DollarSign size={12} />} onClick={() => setShowCommission(true)}>
                Lançar comissão
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ReferralsPage() {
  const [type, setType] = useState<ReferralType>("PATIENT");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["referrals", type],
    queryFn: () => apiListReferrals(type),
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="CRM" title="Indicações" description="Pacientes e médicos indicados pela nossa base de médicos." />

      <div className="flex gap-2">
        {typeTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              type === t.value
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
      ) : referrals.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhuma indicação ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {referrals.map((r) => (
            <ReferralCard key={r.id} referral={r} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
