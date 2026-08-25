import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Lock, PlayCircle, FileText, Link as LinkIcon, CheckCircle } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import {
  apiGetCatalogItem,
  apiListCourseMaterials,
  apiExpressCourseInterest,
  type CourseMaterialType,
} from "../lib/api/catalog";
import { ApiError } from "../lib/api/client";

const materialIcons: Record<CourseMaterialType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  LINK: LinkIcon,
};

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
  const { toast } = useToast();
  const [interestSent, setInterestSent] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["catalog", id],
    queryFn: () => apiGetCatalogItem(id),
  });

  const {
    data: materials,
    error: materialsError,
    isLoading: materialsLoading,
  } = useQuery({
    queryKey: ["courseMaterials", id],
    queryFn: () => apiListCourseMaterials(id),
    retry: false,
  });
  const enrollmentRequired = materialsError instanceof ApiError && materialsError.code === "ENROLLMENT_REQUIRED";
  const enrolled = !materialsLoading && !enrollmentRequired;

  const interestMutation = useMutation({
    mutationFn: () => apiExpressCourseInterest(id),
    onSuccess: () => setInterestSent(true),
    onError: (err) =>
      toast({ kind: "error", title: "Não foi possível registrar", description: (err as Error).message }),
  });

  if (isLoading || materialsLoading) {
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

  return (
    <PageContainer className="max-w-3xl">
      <Link to="/medico/cursos" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar aos cursos
      </Link>

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-2">
            <Badge tone="accent">{typeLabels[item.type]}</Badge>
            {enrolled && <Badge tone="accent">Você está inscrito</Badge>}
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

          {!enrolled && (
            <div className="flex items-center justify-between border-t border-line pt-5">
              <span className="font-display text-2xl text-fg">{formatPrice(item.price)}</span>
              {interestSent ? (
                <span className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle size={16} /> Interesse registrado
                </span>
              ) : (
                <Button onClick={() => interestMutation.mutate()} loading={interestMutation.isPending}>
                  Quero me inscrever
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {!enrolled ? (
        <Card>
          <CardBody className="space-y-2">
            {interestSent ? (
              <>
                <h2 className="font-display text-lg text-fg">Interesse registrado!</h2>
                <p className="text-sm text-fg-muted">
                  Nossa equipe comercial já foi avisada e vai entrar em contato pra fechar sua matrícula nesse curso.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-lg text-fg">Como funciona</h2>
                <p className="text-sm text-fg-muted">
                  Clique em "Quero me inscrever" pra avisar a equipe comercial do seu interesse — eles entram em
                  contato pra fechar sua matrícula. Assim que confirmada, esse curso é liberado aqui automaticamente
                  com todo o conteúdo de onboarding.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-display text-lg text-fg">Materiais do curso</h2>
            {materials && materials.length > 0 ? (
              <div className="space-y-1.5">
                {materials.map((m) => {
                  const Icon = materialIcons[m.type];
                  return (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-fg hover:border-accent/40 hover:text-accent"
                    >
                      <Icon size={14} /> {m.title}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                <Lock size={16} className="shrink-0" />
                Nenhum material disponível ainda — a equipe AAI está preparando o conteúdo de onboarding.
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
}
