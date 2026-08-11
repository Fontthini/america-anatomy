import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListBanners,
  apiCreateBanner,
  apiUpdateBanner,
  apiDeleteBanner,
  type BannerPlacement,
} from "../lib/api/banners";

export const Route = createFileRoute("/_app/banners/")({
  component: BannersManagementPage,
});

const placements: { value: BannerPlacement; label: string }[] = [
  { value: "LOJA", label: "Loja" },
  { value: "BLOG", label: "Blog" },
];

function BannersManagementPage() {
  const [placement, setPlacement] = useState<BannerPlacement>("LOJA");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners", "staff", placement],
    queryFn: () => apiListBanners(placement),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["banners"] });

  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      apiCreateBanner({ placement, imageUrl, title: title || undefined, subtitle: subtitle || undefined, order: banners.length }),
    onSuccess: () => {
      invalidate();
      setImageUrl("");
      setTitle("");
      setSubtitle("");
      toast({ kind: "success", title: "Banner adicionado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao adicionar banner", description: (err as Error).message }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => apiUpdateBanner(id, { active }),
    onSuccess: invalidate,
    onError: (err) => toast({ kind: "error", title: "Erro", description: (err as Error).message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteBanner(id),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Banner removido" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao remover", description: (err as Error).message }),
  });

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!imageUrl) return;
    createMutation.mutate();
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Conteúdo" title="Banners" description="Carrossel exibido no topo da Loja e do Blog do médico." />

      <div className="flex gap-2">
        {placements.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlacement(p.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              placement === p.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input placeholder="URL da imagem" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="sm:col-span-3" />
            <Input placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Subtítulo (opcional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="sm:col-span-2" />
            <Button type="submit" loading={createMutation.isPending} className="sm:col-span-3">
              Adicionar banner
            </Button>
          </form>
        </CardBody>
      </Card>

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : banners.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum banner cadastrado para {placement === "LOJA" ? "a Loja" : "o Blog"}.</p>
      ) : (
        <div className="space-y-2">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardBody className="flex items-center gap-4">
                <img src={banner.imageUrl} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={banner.active ? "neutral" : "muted"}>{banner.active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <p className="truncate text-sm text-fg">{banner.title || banner.imageUrl}</p>
                  {banner.subtitle && <p className="truncate text-xs text-fg-muted">{banner.subtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: banner.id, active: !banner.active })}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:text-fg"
                    aria-label={banner.active ? "Desativar" : "Ativar"}
                  >
                    {banner.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:text-danger"
                    aria-label="Remover"
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
