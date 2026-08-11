import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Checkbox } from "../ui/Checkbox";
import type { ArticleResponse, ArticleMaterial, ArticlePayload } from "../../lib/api/blog";

export function ArticleForm({
  mode,
  initial,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  initial?: ArticleResponse;
  onSubmit: (values: ArticlePayload) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [materials, setMaterials] = useState<ArticleMaterial[]>(initial?.materials ?? []);

  function addMaterial() {
    setMaterials((prev) => [...prev, { name: "", url: "" }]);
  }

  function updateMaterial(idx: number, patch: Partial<ArticleMaterial>) {
    setMaterials((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  function removeMaterial(idx: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    onSubmit({
      title,
      content,
      category: category || undefined,
      coverImageUrl: coverImageUrl || undefined,
      videoUrl: videoUrl || undefined,
      published,
      materials: materials.filter((m) => m.name && m.url),
    });
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" placeholder="Ex.: Masterclass, Eventos" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverImageUrl">URL da imagem de capa</Label>
              <Input id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">URL do vídeo (YouTube, opcional)</Label>
            <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea id="content" rows={10} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiais para download</Label>
              <button
                type="button"
                onClick={addMaterial}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <Plus size={12} /> Adicionar material
              </button>
            </div>
            {materials.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Nome do material"
                  value={m.name}
                  onChange={(e) => updateMaterial(idx, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={m.url}
                  onChange={(e) => updateMaterial(idx, { url: e.target.value })}
                  className="flex-1"
                />
                <button type="button" onClick={() => removeMaterial(idx)} className="shrink-0 text-fg-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} label="Publicado (visível para médicos)" />

          <Button type="submit" loading={submitting}>
            {mode === "create" ? "Criar artigo" : "Salvar alterações"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
