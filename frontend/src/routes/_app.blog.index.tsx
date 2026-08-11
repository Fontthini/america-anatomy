import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { apiListArticles, apiUpdateArticle, apiDeleteArticle } from "../lib/api/blog";

export const Route = createFileRoute("/_app/blog/")({
  component: BlogManagementPage,
});

function BlogManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles", "staff-all"],
    queryFn: () => apiListArticles(),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["articles"] });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiUpdateArticle(id, { published: true }),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Artigo publicado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao publicar", description: (err as Error).message }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => apiUpdateArticle(id, { published: false }),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Artigo despublicado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro", description: (err as Error).message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteArticle(id),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Artigo removido" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao remover", description: (err as Error).message }),
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Conteúdo"
        title="Blog"
        description="Artigos científicos exclusivos para a área do médico."
        action={
          <Link to="/blog/novo">
            <Button leftIcon={<Plus size={14} />}>Novo artigo</Button>
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum artigo cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <Link to="/blog/$id" params={{ id: article.id }} className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={article.published ? "neutral" : "muted"}>
                      {article.published ? "Publicado" : "Rascunho"}
                    </Badge>
                    {article.category && <Badge tone="muted">{article.category}</Badge>}
                  </div>
                  <p className="truncate text-sm font-medium text-fg hover:text-accent">{article.title}</p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {article.published ? (
                    <Button size="sm" variant="secondary" loading={unpublishMutation.isPending} onClick={() => unpublishMutation.mutate(article.id)}>
                      Despublicar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Send size={12} />}
                      loading={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(article.id)}
                    >
                      Publicar
                    </Button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(article.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:text-danger"
                    aria-label="Remover artigo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
