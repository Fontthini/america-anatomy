import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Lock, PlayCircle, FileText, Link as LinkIcon, CheckCircle, MessageCircle } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CourseLandingShell } from "../components/courses/CourseLandingShell";
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

function ExpressInterestCta({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const interestMutation = useMutation({
    mutationFn: () => apiExpressCourseInterest(courseId),
    onSuccess: () => setSent(true),
    onError: (err) =>
      toast({ kind: "error", title: "Não foi possível registrar", description: (err as Error).message }),
  });

  return (
    <div className="rounded-2xl border border-line-strong bg-surface-1 p-6 shadow-[var(--shadow-pop)]">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle size={32} className="text-success" />
          <p className="font-display text-lg text-fg">Interesse registrado!</p>
          <p className="text-sm text-fg-muted">
            Nossa equipe comercial já foi avisada e vai entrar em contato pra fechar sua matrícula em{" "}
            <strong className="text-fg">{courseTitle}</strong>.
          </p>
        </div>
      ) : (
        <>
          <p className="font-display text-lg text-fg">Garanta sua vaga</p>
          <p className="mt-1 text-xs text-fg-muted">
            Clique abaixo pra avisar a equipe comercial do seu interesse — eles entram em contato pra fechar sua
            matrícula. Assim que confirmada, o curso é liberado aqui automaticamente com todo o onboarding.
          </p>
          <Button
            className="mt-4 w-full"
            leftIcon={<MessageCircle size={16} />}
            onClick={() => interestMutation.mutate()}
            loading={interestMutation.isPending}
          >
            Quero me inscrever
          </Button>
        </>
      )}
    </div>
  );
}

function CourseItemPage() {
  const { id } = Route.useParams();

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

  if (!enrolled) {
    return (
      <div>
        <div className="px-4 pt-4">
          <Link to="/medico/cursos" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <ArrowLeft size={14} /> Voltar aos cursos
          </Link>
        </div>
        <CourseLandingShell
          item={item}
          showHeader={false}
          cta={<ExpressInterestCta courseId={item.id} courseTitle={item.title} />}
        />
      </div>
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
            <Badge tone="accent">Você está inscrito</Badge>
          </div>

          <div>
            <h1 className="font-display text-3xl text-fg">{item.title}</h1>
            {item.description && <p className="mt-2 text-sm text-fg-muted">{item.description}</p>}
          </div>
        </CardBody>
      </Card>

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
    </PageContainer>
  );
}
