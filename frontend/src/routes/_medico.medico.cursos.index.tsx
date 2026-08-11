import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Calendar, ArrowRight, Search } from "lucide-react";
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
  const [location, setLocation] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiListCatalogItems(),
  });

  const events = useMemo(
    () => items.filter((i) => i.type === "COURSE" || i.type === "SEMINAR"),
    [items],
  );

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .filter((e) => !e.isOnline && e.location)
            .map((e) => e.location as string),
        ),
      ).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events
      .filter((i) => (filter === "ALL" ? true : i.type === filter))
      .filter((i) => (location ? i.location === location : true))
      .filter((i) => (term ? i.title.toLowerCase().includes(term) || (i.description ?? "").toLowerCase().includes(term) : true))
      .sort((a, b) => {
        if (!a.startsAt) return 1;
        if (!b.startsAt) return -1;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
  }, [events, filter, location, search]);

  return (
    <PageContainer>
      <PageHeader eyebrow="Área do médico" title="Cursos" description="Cursos e seminários da America Anatomy Institute." />

      <div className="relative max-w-md">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar curso ou seminário…"
          className="h-10 w-full rounded-lg border border-line bg-surface-1 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent/60 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
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
        {locations.length > 1 && (
          <>
            <span className="mx-1 self-center text-line">|</span>
            <button
              onClick={() => setLocation(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                !location
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              Todos os locais
            </button>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  location === loc
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {loc}
              </button>
            ))}
          </>
        )}
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
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="accent">{typeLabels[item.type]}</Badge>
                      {item.category && <Badge tone="muted">{item.category}</Badge>}
                    </div>
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
