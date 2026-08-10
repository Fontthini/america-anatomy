import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { useToast } from "../contexts/ToastContext";
import {
  apiGetCatalogItem,
  apiListEnrolledDoctors,
  apiListCourseRegistrations,
  apiUpdateRegistrationStatus,
  type CourseRegistrationStatus,
} from "../lib/api/catalog";

export const Route = createFileRoute("/_app/gestao-cursos/$id")({
  component: CourseRosterPage,
});

const statusOptions: { value: CourseRegistrationStatus; label: string }[] = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "DECLINED", label: "Recusado" },
];

function CourseRosterPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: course } = useQuery({ queryKey: ["catalog", id], queryFn: () => apiGetCatalogItem(id) });
  const { data: enrolled = [], isLoading: loadingEnrolled } = useQuery({
    queryKey: ["courseEnrolled", id],
    queryFn: () => apiListEnrolledDoctors(id),
  });
  const { data: registrations = [], isLoading: loadingRegs } = useQuery({
    queryKey: ["courseRegistrations", id],
    queryFn: () => apiListCourseRegistrations(id),
  });

  const statusMutation = useMutation({
    mutationFn: ({ regId, status }: { regId: string; status: CourseRegistrationStatus }) =>
      apiUpdateRegistrationStatus(id, regId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["courseRegistrations", id] }),
    onError: (err) => toast({ kind: "error", title: "Erro ao atualizar", description: (err as Error).message }),
  });

  function copyPublicLink() {
    if (!course) return;
    const url = `${window.location.origin}/cursos/${course.slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ kind: "success", title: "Link copiado" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageContainer>
      <Link to="/gestao-cursos" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar aos cursos
      </Link>

      {course && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-fg">{course.title}</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {course.capacity !== null ? `${course.capacity - (course.vagasRestantes ?? 0)}/${course.capacity} vagas ocupadas` : "Sem limite de vagas"}
            </p>
          </div>
          <button
            onClick={copyPublicLink}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-fg-muted hover:border-line-strong hover:text-fg"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} Link público
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-fg">Inscritos com conta ({enrolled.length})</h2>
        {loadingEnrolled ? (
          <p className="text-sm text-fg-muted">Carregando…</p>
        ) : enrolled.length === 0 ? (
          <p className="text-sm text-fg-muted">Nenhum médico inscrito ainda.</p>
        ) : (
          <div className="space-y-2">
            {enrolled.map((doc) => (
              <Card key={doc.orderId}>
                <CardBody className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-fg">{doc.name}</p>
                    <p className="text-xs text-fg-muted">
                      {doc.email}
                      {doc.crm ? ` · ${doc.crm}` : ""}
                      {doc.phone ? ` · ${doc.phone}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-fg-muted">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-fg">Interessados via formulário público ({registrations.length})</h2>
        {loadingRegs ? (
          <p className="text-sm text-fg-muted">Carregando…</p>
        ) : registrations.length === 0 ? (
          <p className="text-sm text-fg-muted">Nenhum interesse registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {registrations.map((reg) => (
              <Card key={reg.id}>
                <CardBody className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">{reg.name}</p>
                    <p className="text-xs text-fg-muted">
                      {reg.email}
                      {reg.crm ? ` · ${reg.crm}` : ""} · {reg.whatsapp}
                    </p>
                    {reg.notes && <p className="mt-1 text-xs text-fg-muted">"{reg.notes}"</p>}
                  </div>
                  <select
                    value={reg.status}
                    onChange={(e) =>
                      statusMutation.mutate({ regId: reg.id, status: e.target.value as CourseRegistrationStatus })
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
      </div>
    </PageContainer>
  );
}
