import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";
import { apiListCatalogItems, type CatalogItemType } from "../lib/api/catalog";

export const Route = createFileRoute("/_medico/medico/cursos/")({
  component: CoursesPage,
});

const filters: { value: CatalogItemType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "COURSE", label: "Cursos" },
  { value: "SEMINAR", label: "Seminários" },
];

const typeLabels: Record<string, string> = { COURSE: "Curso", SEMINAR: "Seminário" };

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function CoursesPage() {
  const [filter, setFilter] = useState<CatalogItemType | "ALL">("ALL");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiListCatalogItems(),
  });

  const events = items.filter((i) => i.type === "COURSE" || i.type === "SEMINAR");
  const filtered = filter === "ALL" ? events : events.filter((i) => i.type === filter);

  return (
    <PageContainer>
      <PageHeader eyebrow="Área do médico" title="Cursos" description="Cursos e seminários da America Anatomy Institute." />

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum curso ou seminário disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link key={item.id} to="/medico/cursos/$id" params={{ id: item.id }}>
              <Card className="group flex h-full flex-col transition-colors hover:border-line-strong">
                <CardBody className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="accent">{typeLabels[item.type]}</Badge>
                    {item.vagasRestantes !== null && (
                      <Badge tone={item.vagasRestantes > 0 ? "neutral" : "danger"}>
                        {item.vagasRestantes > 0 ? `${item.vagasRestantes} vagas` : "Esgotado"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg text-fg">{item.title}</h3>
                  {item.description && (
                    <p className="line-clamp-2 flex-1 text-sm text-fg-muted">{item.description}</p>
                  )}
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
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-fg">{formatPrice(item.price)}</span>
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
