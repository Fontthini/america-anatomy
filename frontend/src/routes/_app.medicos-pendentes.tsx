import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, Stethoscope } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListDoctors,
  apiApproveDoctor,
  apiRejectDoctor,
  type ApprovalStatus,
  type DoctorProfileResponse,
} from "../lib/api/doctors";

export const Route = createFileRoute("/_app/medicos-pendentes")({
  component: PendingDoctorsPage,
});

const tabs: { value: ApprovalStatus; label: string }[] = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
];

function PendingDoctorsPage() {
  const [status, setStatus] = useState<ApprovalStatus>("PENDING");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", status],
    queryFn: () => apiListDoctors(status),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["doctors"] });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => apiApproveDoctor(userId),
    onSuccess: () => {
      toast({ kind: "success", title: "Médico aprovado" });
      invalidate();
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao aprovar", description: (err as Error).message }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => apiRejectDoctor(userId, reason),
    onSuccess: () => {
      toast({ kind: "success", title: "Médico rejeitado" });
      setRejectingId(null);
      setReason("");
      invalidate();
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao rejeitar", description: (err as Error).message }),
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="CRM" title="Médicos Pendentes" description="Aprove ou rejeite cadastros de médicos." />

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              status === t.value
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
      ) : doctors.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum médico nesse status.</p>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor: DoctorProfileResponse) => (
            <Card key={doctor.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Stethoscope size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-fg">{doctor.name}</p>
                      <p className="text-xs text-fg-muted">{doctor.email}</p>
                      <p className="mt-1 text-xs text-fg-muted">
                        {[doctor.crm, doctor.specialty, doctor.clinicName, doctor.city && doctor.state ? `${doctor.city}/${doctor.state}` : null]
                          .filter(Boolean)
                          .join(" · ") || "Sem dados complementares"}
                      </p>
                    </div>
                  </div>
                  {status === "PENDING" && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<X size={14} />}
                        onClick={() => setRejectingId(rejectingId === doctor.userId ? null : doctor.userId)}
                      >
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Check size={14} />}
                        loading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(doctor.userId)}
                      >
                        Aprovar
                      </Button>
                    </div>
                  )}
                  {status === "REJECTED" && doctor.rejectionReason && (
                    <Badge tone="danger">{doctor.rejectionReason}</Badge>
                  )}
                </div>

                {rejectingId === doctor.userId && (
                  <div className="flex items-center gap-2 border-t border-line pt-3">
                    <Input
                      placeholder="Motivo (opcional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ userId: doctor.userId, reason: reason || undefined })}
                    >
                      Confirmar rejeição
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
