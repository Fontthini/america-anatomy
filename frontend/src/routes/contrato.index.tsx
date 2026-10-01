import { createFileRoute } from "@tanstack/react-router";
import { AaiLogo } from "../components/ui/AaiLogo";

export const Route = createFileRoute("/contrato/")({
  head: () => ({ meta: [{ title: "Link incompleto — American Anatomy Institute" }] }),
  component: MissingSlugPage,
});

function MissingSlugPage() {
  return (
    <div className="brand-medico dark flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
      <AaiLogo size={40} />
      <h1 className="font-display text-xl text-fg">Link incompleto</h1>
      <p className="max-w-sm text-sm text-fg-muted">
        Esse link precisa indicar a turma (ex: /contrato/nome-da-turma). Peça o link
        completo para a equipe.
      </p>
    </div>
  );
}
