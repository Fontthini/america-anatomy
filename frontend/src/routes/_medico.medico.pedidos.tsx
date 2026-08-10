import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { apiListMyOrders, type OrderStatus } from "../lib/api/orders";

export const Route = createFileRoute("/_medico/medico/pedidos")({
  component: MyOrdersPage,
});

const statusTone: Record<OrderStatus, "accent" | "neutral" | "danger"> = {
  CONFIRMED: "accent",
  PENDING: "neutral",
  CANCELLED: "danger",
};

const statusLabel: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
};

function formatPrice(price: string | null): string {
  if (!price) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function MyOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["myOrders"],
    queryFn: apiListMyOrders,
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="Área do médico" title="Meus Pedidos" description="Compras e inscrições em cursos/seminários." />

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-fg-muted">Você ainda não tem pedidos.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-fg">{order.catalogItemTitle}</p>
                  <p className="text-xs text-fg-muted">
                    {order.quantity > 1 ? `${order.quantity}x · ` : ""}
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-fg">{formatPrice(order.unitPrice)}</span>
                  <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
