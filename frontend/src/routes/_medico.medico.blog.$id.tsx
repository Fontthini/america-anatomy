import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Newspaper } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { apiGetArticle } from "../lib/api/blog";

export const Route = createFileRoute("/_medico/medico/blog/$id")({
  component: ArticlePage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function youtubeEmbedId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return m ? m[1] : null;
}

function ArticlePage() {
  const { id } = Route.useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => apiGetArticle(id),
  });

  if (isLoading) {
    return (
      <PageContainer className="max-w-3xl">
        <p className="text-sm text-fg-muted">Carregando…</p>
      </PageContainer>
    );
  }

  if (!article) {
    return (
      <PageContainer className="max-w-3xl">
        <p className="text-sm text-fg-muted">Artigo não encontrado.</p>
      </PageContainer>
    );
  }

  const embedId = article.videoUrl ? youtubeEmbedId(article.videoUrl) : null;

  return (
    <PageContainer className="max-w-3xl">
      <Link to="/medico/blog" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar ao blog
      </Link>

      <Card>
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title} className="h-56 w-full rounded-t-xl object-cover sm:h-72" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-t-xl border-b border-line bg-surface-2">
            <Newspaper size={32} className="text-fg-muted" strokeWidth={1.5} />
          </div>
        )}
        <CardBody className="space-y-5">
          <div className="flex items-center gap-2">
            {article.category && <Badge tone="accent">{article.category}</Badge>}
            <span className="text-xs text-fg-muted">{formatDate(article.publishedAt)}</span>
          </div>

          <h1 className="font-display text-2xl text-fg sm:text-3xl">{article.title}</h1>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{article.content}</p>

          {embedId && (
            <div className="aspect-video overflow-hidden rounded-xl border border-line">
              <iframe
                src={`https://www.youtube.com/embed/${embedId}`}
                title={article.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {article.materials.length > 0 && (
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Materiais para download</p>
              <div className="space-y-1.5">
                {article.materials.map((m, idx) => (
                  <a
                    key={idx}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-fg hover:border-accent/40 hover:text-accent"
                  >
                    <Download size={14} /> {m.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}
