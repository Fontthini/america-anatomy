import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ShoppingCart, GraduationCap, Package2, Newspaper, ArrowRight, Calendar, MapPin } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { apiListCatalogItems } from "../lib/api/catalog";
import { apiListMyOrders } from "../lib/api/orders";
import { apiListArticles } from "../lib/api/blog";
import { BannerCarousel } from "../components/medico/BannerCarousel";

export const Route = createFileRoute("/_medico/medico/")({
  component: MedicoHomePage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function HomeFallbackBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-navy-deep via-brand-navy to-black px-8 py-12 text-center sm:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
      <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-accent">America Anatomy Institute</p>
      <h1 className="relative mt-3 font-display text-3xl text-brand-white sm:text-4xl">Área exclusiva do médico</h1>
      <p className="relative mx-auto mt-3 max-w-lg text-sm text-fg-muted">
        Loja, cursos, artigos científicos e novidades da AAI, tudo num só lugar.
      </p>
    </div>
  );
}

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
  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: () => apiListArticles(),
  });

  const productCount = items.filter((i) => i.type === "PRODUCT").length;
  const courseCount = items.filter((i) => i.type === "COURSE" || i.type === "SEMINAR").length;

  const recentArticles = useMemo(() => articles.slice(0, 3), [articles]);

  const upcomingCourses = useMemo(
    () =>
      items
        .filter((i) => (i.type === "COURSE" || i.type === "SEMINAR") && i.startsAt)
        .sort((a, b) => new Date(a.startsAt as string).getTime() - new Date(b.startsAt as string).getTime())
        .slice(0, 3),
    [items],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Área do médico"
        title={`Olá, ${user?.name?.split(" ")[0] ?? "Doutor(a)"}`}
        description="Bem-vindo(a) à área exclusiva da America Anatomy Institute."
      />

      <BannerCarousel placement="LOJA" fallback={<HomeFallbackBanner />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <Link to="/medico/blog">
          <Card className="group h-full transition-colors hover:border-line-strong">
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Newspaper size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">Blog</p>
                  <p className="text-xs text-fg-muted">{articles.length} artigos científicos</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </CardBody>
          </Card>
        </Link>
      </div>

      {upcomingCourses.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-fg">Novidades — próximos cursos</h2>
            <Link to="/medico/cursos" className="text-xs font-medium text-fg-muted hover:text-fg">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {upcomingCourses.map((item) => (
              <Link key={item.id} to="/medico/cursos/$id" params={{ id: item.id }}>
                <Card className="group h-full transition-colors hover:border-line-strong">
                  <CardBody className="space-y-2">
                    <h3 className="font-display text-sm text-fg">{item.title}</h3>
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
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentArticles.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-fg">Artigos recentes</h2>
            <Link to="/medico/blog" className="text-xs font-medium text-fg-muted hover:text-fg">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recentArticles.map((article) => (
              <Link key={article.id} to="/medico/blog/$id" params={{ id: article.id }}>
                <Card className="group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong">
                  <div className="flex h-28 items-center justify-center border-b border-line bg-surface-2">
                    {article.coverImageUrl ? (
                      <img src={article.coverImageUrl} alt={article.title} className="h-full w-full object-cover" />
                    ) : (
                      <Newspaper size={24} className="text-fg-muted" strokeWidth={1.5} />
                    )}
                  </div>
                  <CardBody className="space-y-1">
                    {article.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-accent">{article.category}</span>
                    )}
                    <h3 className="font-display text-sm leading-snug text-fg">{article.title}</h3>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
