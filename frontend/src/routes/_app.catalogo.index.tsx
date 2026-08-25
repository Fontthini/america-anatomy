import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Archive, Send } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListCatalogItems,
  apiUpdateCatalogItem,
  apiArchiveCatalogItem,
  type CatalogItemType,
} from "../lib/api/catalog";

export const Route = createFileRoute("/_app/catalogo/")({
  component: CatalogManagementPage,
});

const typeLabels: Record<CatalogItemType, string> = { PRODUCT: "Produto", COURSE: "Curso", SEMINAR: "Seminário" };
const statusLabels: Record<string, string> = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" };
const typeTabs: { value: CatalogItemType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PRODUCT", label: "Produtos" },
  { value: "COURSE", label: "Cursos" },
  { value: "SEMINAR", label: "Seminários" },
];

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function CatalogManagementPage() {
  const [filter, setFilter] = useState<CatalogItemType | "ALL">("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog", "staff-all"],
    queryFn: () => apiListCatalogItems(),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["catalog"] });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiUpdateCatalogItem(id, { status: "PUBLISHED" }),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Item publicado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao publicar", description: (err as Error).message }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiArchiveCatalogItem(id),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Item arquivado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao arquivar", description: (err as Error).message }),
  });

  const filtered = filter === "ALL" ? items : items.filter((i) => i.type === filter);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="CRM"
        title="Loja"
        description="Produtos, cursos e seminários — crie e publique itens pra Loja e Cursos do médico."
        action={
          <Link to="/catalogo/novo">
            <Button leftIcon={<Plus size={14} />}>Novo item</Button>
          </Link>
        }
      />

      <div className="flex gap-2">
        {typeTabs.map((t) => (
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
        <p className="text-sm text-fg-muted">Nenhum item cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <Link to="/catalogo/$id" params={{ id: item.id }} className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="accent">{typeLabels[item.type]}</Badge>
                    <Badge tone={item.status === "PUBLISHED" ? "neutral" : "muted"}>{statusLabels[item.status]}</Badge>
                    {item.category && <Badge tone="muted">{item.category}</Badge>}
                  </div>
                  <p className="truncate text-sm font-medium text-fg hover:text-accent">{item.title}</p>
                  <p className="text-xs text-fg-muted">{formatPrice(item.price)}</p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status !== "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Send size={12} />}
                      loading={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(item.id)}
                    >
                      Publicar
                    </Button>
                  )}
                  {item.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Archive size={12} />}
                      loading={archiveMutation.isPending}
                      onClick={() => archiveMutation.mutate(item.id)}
                    >
                      Arquivar
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
