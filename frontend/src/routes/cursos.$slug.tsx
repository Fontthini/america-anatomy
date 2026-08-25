import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../components/ui/Spinner";
import { RogerioWagnerLanding } from "../components/courses/RogerioWagnerLanding";
import { CourseRegisterForm } from "../components/courses/RegisterForm";
import { CourseLandingShell } from "../components/courses/CourseLandingShell";
import { apiGetPublicCourse } from "../lib/api/catalog";

// Teste de landing "cópia fiel" — isolado só neste curso, não afeta os outros 34
// (ver [[project-scope]] / memória da Fase 5). Quando validado, decide se replica.
const FAITHFUL_CLONE_SLUGS: Record<string, typeof RogerioWagnerLanding> = {
  "anatomy-of-movement-course-orlando-fl": RogerioWagnerLanding,
};

export const Route = createFileRoute("/cursos/$slug")({
  head: () => ({ meta: [{ title: "Curso — America Anatomy Institute" }] }),
  component: PublicCoursePage,
});

function PublicCoursePage() {
  const { slug } = Route.useParams();

  const FaithfulClone = FAITHFUL_CLONE_SLUGS[slug];
  if (FaithfulClone) {
    return <FaithfulClone />;
  }

  return <GenericCoursePage slug={slug} />;
}

function GenericCoursePage({ slug }: { slug: string }) {
  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["publicCourse", slug],
    queryFn: () => apiGetPublicCourse(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="brand-medico dark flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={24} />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="brand-medico dark flex min-h-screen flex-col items-center justify-center gap-2 bg-bg text-center">
        <h1 className="font-display text-2xl text-fg">Curso não encontrado</h1>
        <p className="text-sm text-fg-muted">Este link não é válido ou o curso não está mais disponível.</p>
      </div>
    );
  }

  return <CourseLandingShell item={course} cta={<CourseRegisterForm courseId={course.id} courseTitle={course.title} />} />;
}
