import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { apiGetCatalogItem } from "../lib/api/catalog";
import { apiCreateOrder } from "../lib/api/orders";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/_medico/medico/cursos/$id")({
  component: CourseItemPage,
});

const typeLabels: Record<string, string> = { COURSE: "Curso", SEMINAR: "Seminário" };

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CourseItemPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: item, isLoading } = useQuery({
    queryKey: ["catalog", id],
    queryFn: () => apiGetCatalogItem(id),
  });

  const orderMutation = useMutation({
    mutationFn: () => apiCreateOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast({ kind: "success", title: "Inscrição confirmada", description: "Você já pode ver os detalhes em Meus Pedidos." });
      void navigate({ to: "/medico/pedidos" });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError && (err.code === "SEMINAR_FULL" || err.code === "COURSE_FULL")
          ? "Não há mais vagas disponíveis."
          : (err as Error).message;
      toast({ kind: "error", title: "Não foi possível concluir", description: message });
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-fg-muted">Carregando…</p>
      </PageContainer>
    );
  }

  if (!item) {
    return (
      <PageContainer>
        <p className="text-sm text-fg-muted">Curso não encontrado.</p>
      </PageContainer>
    );
  }

  const soldOut = item.vagasRestantes !== null && item.vagasRestantes <= 0;

  return (
    <PageContainer className="max-w-3xl">
      <Link to="/medico/cursos" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar aos cursos
      </Link>

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-start justify-between gap-2">
            <Badge tone="accent">{typeLabels[item.type]}</Badge>
            {item.vagasRestantes !== null && (
              <Badge tone={soldOut ? "danger" : "neutral"}>
                {soldOut ? "Esgotado" : `${item.vagasRestantes} vagas restantes`}
              </Badge>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl text-fg">{item.title}</h1>
            {item.description && <p className="mt-2 text-sm text-fg-muted">{item.description}</p>}
          </div>

          <div className="space-y-2 text-sm text-fg-muted">
            {item.startsAt && (
              <p className="flex items-center gap-2">
                <Calendar size={14} /> {formatDateTime(item.startsAt)}
              </p>
            )}
            {item.location && (
              <p className="flex items-center gap-2">
                <MapPin size={14} /> {item.isOnline ? "Online" : item.location}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line pt-5">
            <span className="font-display text-2xl text-fg">{formatPrice(item.price)}</span>
            <Button onClick={() => orderMutation.mutate()} loading={orderMutation.isPending} disabled={soldOut}>
              Inscrever-se
            </Button>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
