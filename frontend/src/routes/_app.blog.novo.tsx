import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { ArticleForm } from "../components/blog/ArticleForm";
import { useToast } from "../contexts/ToastContext";
import { apiCreateArticle, type ArticlePayload } from "../lib/api/blog";

export const Route = createFileRoute("/_app/blog/novo")({
  component: NewArticlePage,
});

function NewArticlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (values: ArticlePayload) => apiCreateArticle(values),
    onSuccess: (article) => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ kind: "success", title: "Artigo criado" });
      void navigate({ to: "/blog/$id", params: { id: article.id } });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao criar artigo", description: (err as Error).message }),
  });

  return (
    <PageContainer className="max-w-2xl">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar ao blog
      </Link>
      <h1 className="font-display text-2xl text-fg">Novo artigo</h1>
      <ArticleForm mode="create" onSubmit={(values) => createMutation.mutate(values)} submitting={createMutation.isPending} />
    </PageContainer>
  );
}
