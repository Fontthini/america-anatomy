import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { ArticleForm } from "../components/blog/ArticleForm";
import { useToast } from "../contexts/ToastContext";
import { apiGetArticle, apiUpdateArticle, type ArticlePayload } from "../lib/api/blog";

export const Route = createFileRoute("/_app/blog/$id")({
  component: EditArticlePage,
});

function EditArticlePage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => apiGetArticle(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ArticlePayload) => apiUpdateArticle(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["article", id] });
      toast({ kind: "success", title: "Alterações salvas" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao salvar", description: (err as Error).message }),
  });

  return (
    <PageContainer className="max-w-2xl">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar ao blog
      </Link>

      {isLoading || !article ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : (
        <>
          <h1 className="font-display text-2xl text-fg">{article.title}</h1>
          <ArticleForm
            mode="edit"
            initial={article}
            onSubmit={(values) => updateMutation.mutate(values)}
            submitting={updateMutation.isPending}
          />
        </>
      )}
    </PageContainer>
  );
}
