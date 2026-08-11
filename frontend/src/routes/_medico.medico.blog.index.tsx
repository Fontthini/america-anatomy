import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Newspaper, PlayCircle, Paperclip, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { cn } from "../lib/cn";
import { apiListArticles } from "../lib/api/blog";
import { BannerCarousel } from "../components/medico/BannerCarousel";

export const Route = createFileRoute("/_medico/medico/blog/")({
  component: BlogPage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function BlogFallbackBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-navy-deep via-brand-navy to-black px-8 py-12 text-center sm:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
      <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-accent">America Anatomy Institute</p>
      <h1 className="relative mt-3 font-display text-3xl text-brand-white sm:text-4xl">Blog e Artigos Científicos</h1>
      <p className="relative mx-auto mt-3 max-w-lg text-sm text-fg-muted">
        Conteúdo científico exclusivo para médicos parceiros AAI.
      </p>
    </div>
  );
}

function BlogPage() {
  const [category, setCategory] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: () => apiListArticles(),
  });

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter((c): c is string => !!c))),
    [articles],
  );

  const filtered = category ? articles.filter((a) => a.category === category) : articles;

  return (
    <PageContainer className="max-w-none">
      <PageHeader eyebrow="Área do médico" title="Blog" description="Artigos científicos e conteúdo exclusivo AAI." />

      <BannerCarousel placement="BLOG" fallback={<BlogFallbackBanner />} />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              !category ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">Nenhum artigo publicado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link key={article.id} to="/medico/blog/$id" params={{ id: article.id }}>
              <Card className="group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong">
                <div className="flex h-36 items-center justify-center border-b border-line bg-surface-2">
                  {article.coverImageUrl ? (
                    <img src={article.coverImageUrl} alt={article.title} className="h-full w-full object-cover" />
                  ) : (
                    <Newspaper size={28} className="text-fg-muted" strokeWidth={1.5} />
                  )}
                </div>
                <CardBody className="flex flex-1 flex-col gap-2">
                  {article.category && (
                    <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                      {article.category}
                    </span>
                  )}
                  <h3 className="font-display text-base leading-snug text-fg">{article.title}</h3>
                  <p className="line-clamp-2 flex-1 text-xs text-fg-muted">
                    {article.content.replace(/\n+/g, " ").slice(0, 140)}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-2 text-xs text-fg-muted">
                    <span>{formatDate(article.publishedAt)}</span>
                    <div className="flex items-center gap-2">
                      {article.videoUrl && <PlayCircle size={14} />}
                      {article.materials.length > 0 && <Paperclip size={14} />}
                      <ArrowRight size={14} className="text-fg-muted transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
