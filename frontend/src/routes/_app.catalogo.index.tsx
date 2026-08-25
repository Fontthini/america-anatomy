import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Archive, Send } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { apiListCatalogItems, apiUpdateCatalogItem, apiArchiveCatalogItem } from "../lib/api/catalog";

export const Route = createFileRoute("/_app/catalogo/")({
  component: CatalogManagementPage,
});

const statusLabels: Record<string, string> = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" };

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function CatalogManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog", "staff-products"],
    queryFn: () => apiListCatalogItems({ type: "PRODUCT" }),
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

  return (
    <PageContainer>
      <PageHeader
        eyebrow="CRM"
        title="Loja"
        description="Produtos pra venda direta — crie e publique itens pra Loja do médico."
        action={
          <Link to="/catalogo/novo">
            <Button leftIcon={<Plus size={14} />}>Novo produto</Button>
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum produto cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <Link to="/catalogo/$id" params={{ id: item.id }} className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
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
