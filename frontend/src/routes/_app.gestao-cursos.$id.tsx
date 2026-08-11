import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Copy, Check, Trash2, PlayCircle, FileText, Link as LinkIcon } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";
import {
  apiGetCatalogItem,
  apiListEnrolledDoctors,
  apiListCourseRegistrations,
  apiUpdateRegistrationStatus,
  apiListCourseMaterials,
  apiCreateCourseMaterial,
  apiDeleteCourseMaterial,
  type CourseRegistrationStatus,
  type CourseMaterialType,
} from "../lib/api/catalog";

const materialIcons: Record<CourseMaterialType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  LINK: LinkIcon,
};

const materialTypeOptions: { value: CourseMaterialType; label: string }[] = [
  { value: "VIDEO", label: "Vídeo (YouTube)" },
  { value: "PDF", label: "PDF" },
  { value: "LINK", label: "Link" },
];

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

  const { data: materials = [] } = useQuery({
    queryKey: ["courseMaterials", id],
    queryFn: () => apiListCourseMaterials(id),
  });

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<CourseMaterialType>("VIDEO");
  const [materialUrl, setMaterialUrl] = useState("");

  const createMaterialMutation = useMutation({
    mutationFn: () =>
      apiCreateCourseMaterial(id, { title: materialTitle, type: materialType, url: materialUrl, order: materials.length }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courseMaterials", id] });
      setMaterialTitle("");
      setMaterialUrl("");
      toast({ kind: "success", title: "Material adicionado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao adicionar material", description: (err as Error).message }),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => apiDeleteCourseMaterial(id, materialId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["courseMaterials", id] }),
    onError: (err) => toast({ kind: "error", title: "Erro ao remover material", description: (err as Error).message }),
  });

  function handleAddMaterial(ev: FormEvent) {
    ev.preventDefault();
    if (!materialTitle || !materialUrl) return;
    createMaterialMutation.mutate();
  }

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
        <h2 className="mb-3 text-sm font-medium text-fg">Materiais do curso ({materials.length})</h2>
        <Card>
          <CardBody className="space-y-3">
            <form onSubmit={handleAddMaterial} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[160px] flex-1 space-y-1">
                <label className="text-xs text-fg-muted">Título</label>
                <Input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Ex.: Aula 1 — Introdução" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-fg-muted">Tipo</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as CourseMaterialType)}
                  className="h-9 rounded-md border border-line bg-surface-1 px-2 text-sm text-fg focus:border-accent/60 focus:outline-none"
                >
                  {materialTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[200px] flex-1 space-y-1">
                <label className="text-xs text-fg-muted">URL</label>
                <Input value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="https://…" />
              </div>
              <Button type="submit" size="sm" loading={createMaterialMutation.isPending}>
                Adicionar
              </Button>
            </form>

            {materials.length > 0 && (
              <div className="space-y-1.5 border-t border-line pt-3">
                {materials.map((m) => {
                  const Icon = materialIcons[m.type];
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-fg hover:text-accent"
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{m.title}</span>
                      </a>
                      <button
                        onClick={() => deleteMaterialMutation.mutate(m.id)}
                        className="shrink-0 text-fg-muted hover:text-danger"
                        aria-label="Remover material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
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
