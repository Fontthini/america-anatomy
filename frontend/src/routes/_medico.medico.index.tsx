import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, GraduationCap, Package2, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { apiListCatalogItems } from "../lib/api/catalog";
import { apiListMyOrders } from "../lib/api/orders";

export const Route = createFileRoute("/_medico/medico/")({
  component: MedicoHomePage,
});

function MedicoHomePage() {
  const { user } = useAuth();

  const { data: items = [] } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiListCatalogItems(),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["myOrders"],
    queryFn: apiListMyOrders,
  });

  const productCount = items.filter((i) => i.type === "PRODUCT").length;
  const courseCount = items.filter((i) => i.type === "COURSE" || i.type === "SEMINAR").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Área do médico"
        title={`Olá, ${user?.name?.split(" ")[0] ?? "Doutor(a)"}`}
        description="Bem-vindo(a) à área exclusiva da America Anatomy Institute."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/medico/loja">
          <Card className="group h-full transition-colors hover:border-line-strong">
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <ShoppingCart size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">Loja</p>
                  <p className="text-xs text-fg-muted">{productCount} produtos disponíveis</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </CardBody>
          </Card>
        </Link>

        <Link to="/medico/cursos">
          <Card className="group h-full transition-colors hover:border-line-strong">
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <GraduationCap size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">Cursos</p>
                  <p className="text-xs text-fg-muted">{courseCount} cursos e seminários</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </CardBody>
          </Card>
        </Link>

        <Link to="/medico/pedidos">
          <Card className="group h-full transition-colors hover:border-line-strong">
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Package2 size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">Meus Pedidos</p>
                  <p className="text-xs text-fg-muted">{orders.length} pedidos/inscrições</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </CardBody>
          </Card>
        </Link>
      </div>
    </PageContainer>
  );
}
