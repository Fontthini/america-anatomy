import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { apiListCatalogItems } from "../lib/api/catalog";

export const Route = createFileRoute("/_app/gestao-cursos/")({
  component: ManageCoursesPage,
});

const typeLabels: Record<string, string> = { COURSE: "Curso", SEMINAR: "Seminário" };
const statusLabels: Record<string, string> = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function ManageCoursesPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog", "staff-all"],
    queryFn: () => apiListCatalogItems(),
  });

  const events = items.filter((i) => i.type === "COURSE" || i.type === "SEMINAR");

  return (
    <PageContainer>
      <PageHeader eyebrow="CRM" title="Gestão de Cursos" description="Cursos e seminários — veja quem se inscreveu em cada turma." />

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum curso ou seminário cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {events.map((item) => (
            <Link key={item.id} to="/gestao-cursos/$id" params={{ id: item.id }}>
              <Card className="transition-colors hover:border-line-strong">
                <CardBody className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="accent">{typeLabels[item.type]}</Badge>
                      <Badge tone={item.status === "PUBLISHED" ? "neutral" : "muted"}>{statusLabels[item.status]}</Badge>
                    </div>
                    <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                      {item.startsAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(item.startsAt)}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {item.isOnline ? "Online" : item.location}
                        </span>
                      )}
                      {item.vagasRestantes !== null && item.capacity !== null && (
                        <span>
                          {item.capacity - item.vagasRestantes}/{item.capacity} vagas ocupadas
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-fg-muted" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
