import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, ArrowRight, GraduationCap } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { apiListMyInstructedCourses } from "../lib/api/catalog";

export const Route = createFileRoute("/_medico/medico/painel-instrutor/")({
  component: InstructorPanelPage,
});

const typeLabels: Record<string, string> = { COURSE: "Curso", SEMINAR: "Seminário" };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function InstructorPanelPage() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["myInstructedCourses"],
    queryFn: apiListMyInstructedCourses,
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Área do médico"
        title="Painel do Instrutor"
        description="Cursos e seminários que você ministra — inscritos, interessados e materiais."
      />

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface-1 px-6 py-12 text-center">
          <GraduationCap size={32} className="text-fg-muted" strokeWidth={1.5} />
          <p className="text-sm text-fg-muted">
            Você ainda não é instrutor de nenhum curso. Se você ministra um curso AAI, peça pra equipe te
            vincular como instrutor no catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((item) => (
            <Link key={item.id} to="/medico/painel-instrutor/$id" params={{ id: item.id }}>
              <Card className="group flex h-full flex-col transition-colors hover:border-line-strong">
                <CardBody className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="accent">{typeLabels[item.type]}</Badge>
                    <Badge tone={item.status === "PUBLISHED" ? "neutral" : "muted"}>
                      {item.status === "PUBLISHED" ? "Publicado" : item.status === "DRAFT" ? "Rascunho" : "Arquivado"}
                    </Badge>
                  </div>
                  <h3 className="font-display text-lg text-fg">{item.title}</h3>
                  <div className="space-y-1 text-xs text-fg-muted">
                    {item.startsAt && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={12} /> {formatDate(item.startsAt)}
                      </p>
                    )}
                    {item.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} /> {item.isOnline ? "Online" : item.location}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-end pt-2">
                    <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
