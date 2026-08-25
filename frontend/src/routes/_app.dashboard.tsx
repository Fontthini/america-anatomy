import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  KanbanSquare,
  Wallet,
  Package,
  GraduationCap,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  ArrowRight,
  Newspaper,
  Image,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../contexts/AuthContext";
import { apiListLeads } from "../lib/api/crm";
import { apiGetFinancialSummary } from "../lib/api/finance";
import { apiListCatalogItems } from "../lib/api/catalog";
import { apiListDoctors } from "../lib/api/doctors";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Portal — America Anatomy" }] }),
  component: DashboardPage,
});

function formatBRL(value: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
          <p className="font-display text-xl text-fg">{value}</p>
          {sublabel && <p className="truncate text-xs text-fg-muted">{sublabel}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

function QuickLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link to={to}>
      <Card className="group h-full transition-colors hover:border-line-strong">
        <CardBody className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              {icon}
            </span>
            <p className="text-sm font-medium text-fg">{label}</p>
          </div>
          <ArrowRight size={14} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
        </CardBody>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  const isSalesRep = user?.role === "SALES_REP";
  const canSeeCrm = isManager || isSalesRep;

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", isSalesRep ? "mine" : "all"],
    queryFn: () => apiListLeads({ scope: isSalesRep ? "mine" : "all" }),
    enabled: canSeeCrm,
  });

  const { data: finance } = useQuery({
    queryKey: ["financeSummary"],
    queryFn: apiGetFinancialSummary,
    enabled: isManager,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["catalog", "dashboard"],
    queryFn: () => apiListCatalogItems(),
  });

  const { data: pendingDoctors = [] } = useQuery({
    queryKey: ["doctors", "PENDING"],
    queryFn: () => apiListDoctors("PENDING"),
    enabled: isManager,
  });
  const { data: inReviewDoctors = [] } = useQuery({
    queryKey: ["doctors", "IN_REVIEW"],
    queryFn: () => apiListDoctors("IN_REVIEW"),
    enabled: isManager,
  });
  const { data: approvedDoctors = [] } = useQuery({
    queryKey: ["doctors", "APPROVED"],
    queryFn: () => apiListDoctors("APPROVED"),
    enabled: isManager,
  });

  const customerLeads = leads.filter((l) => l.funnelStage === "CUSTOMER").length;
  const publishedProducts = catalog.filter((c) => c.status === "PUBLISHED" && c.type === "PRODUCT").length;
  const publishedCourses = catalog.filter(
    (c) => c.status === "PUBLISHED" && (c.type === "COURSE" || c.type === "SEMINAR"),
  ).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Portal"
        title={`Olá, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Resumo do negócio America Anatomy Institute."
      />

      {!canSeeCrm ? (
        <p className="text-sm text-fg-muted">Sem dados de CRM pra exibir aqui ainda.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isManager && (
              <StatCard
                label="Aguardando decisão"
                value={pendingDoctors.length + inReviewDoctors.length}
                sublabel={inReviewDoctors.length > 0 ? `${inReviewDoctors.length} em análise` : "Novos cadastros"}
                icon={<UserCheck size={18} />}
              />
            )}
            {isManager && (
              <StatCard label="Médicos aprovados" value={approvedDoctors.length} icon={<Stethoscope size={18} />} />
            )}
            <StatCard
              label={isSalesRep ? "Meus contatos" : "Contatos no funil"}
              value={leads.length}
              sublabel={`${customerLeads} viraram cliente`}
              icon={<KanbanSquare size={18} />}
            />
            {isManager && finance && (
              <StatCard
                label="Saldo financeiro"
                value={formatBRL(finance.balance)}
                sublabel={`${formatBRL(finance.totalIncome)} entradas`}
                icon={
                  Number(finance.balance) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />
                }
              />
            )}
            <StatCard
              label="Catálogo publicado"
              value={publishedProducts + publishedCourses}
              sublabel={`${publishedProducts} produtos · ${publishedCourses} cursos`}
              icon={<Package size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink to="/contatos" label="Contatos" icon={<KanbanSquare size={16} />} />
            {isManager && <QuickLink to="/financeiro" label="Financeiro" icon={<Wallet size={16} />} />}
            {isManager && <QuickLink to="/catalogo" label="Catálogo" icon={<Package size={16} />} />}
            {isManager && <QuickLink to="/gestao-cursos" label="Gestão de Cursos" icon={<GraduationCap size={16} />} />}
            {isManager && <QuickLink to="/blog" label="Blog" icon={<Newspaper size={16} />} />}
            {isManager && <QuickLink to="/banners" label="Banners" icon={<Image size={16} />} />}
            {isManager && (
              <QuickLink to="/medicos-pendentes" label="Médicos Pendentes" icon={<UserCheck size={16} />} />
            )}
          </div>

          {isManager && (pendingDoctors.length > 0 || inReviewDoctors.length > 0) && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-fg">Precisa da sua decisão</h2>
              <div className="space-y-2">
                {[...inReviewDoctors, ...pendingDoctors].slice(0, 5).map((doctor) => (
                  <Link key={doctor.id} to="/medicos-pendentes">
                    <Card className="transition-colors hover:border-line-strong">
                      <CardBody className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-fg">{doctor.name}</p>
                          <p className="text-xs text-fg-muted">{doctor.email}</p>
                        </div>
                        <Badge tone={doctor.approvalStatus === "IN_REVIEW" ? "warn" : "muted"}>
                          {doctor.approvalStatus === "IN_REVIEW" ? "Revisão solicitada" : "Pendente"}
                        </Badge>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
