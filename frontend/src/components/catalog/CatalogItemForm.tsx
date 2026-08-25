import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Checkbox } from "../ui/Checkbox";
import { cn } from "../../lib/cn";
import type { CatalogItemResponse, CatalogItemType, CreateCatalogItemPayload } from "../../lib/api/catalog";
import { apiListDoctors } from "../../lib/api/doctors";

const typeOptions: { value: CatalogItemType; label: string }[] = [
  { value: "PRODUCT", label: "Produto" },
  { value: "COURSE", label: "Curso" },
  { value: "SEMINAR", label: "Seminário" },
];

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type CatalogFormValues = CreateCatalogItemPayload;

export function CatalogItemForm({
  mode,
  initial,
  onSubmit,
  submitting,
  allowedTypes = ["PRODUCT", "COURSE", "SEMINAR"],
}: {
  mode: "create" | "edit";
  initial?: CatalogItemResponse;
  onSubmit: (values: CatalogFormValues) => void;
  submitting: boolean;
  /** Restringe o seletor de tipo — ex.: Loja só cria PRODUCT, Cursos só COURSE/SEMINAR. */
  allowedTypes?: CatalogItemType[];
}) {
  const [type, setType] = useState<CatalogItemType>(initial?.type ?? allowedTypes[0] ?? "PRODUCT");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [stockQty, setStockQty] = useState(initial?.stockQty?.toString() ?? "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateTimeLocal(initial?.endsAt ?? null));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [isOnline, setIsOnline] = useState(initial?.isOnline ?? false);
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [instructorUserId, setInstructorUserId] = useState(initial?.instructorUserId ?? "");

  const isEvent = type === "COURSE" || type === "SEMINAR";

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", "APPROVED"],
    queryFn: () => apiListDoctors("APPROVED"),
    enabled: isEvent,
  });

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const base = {
      title,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      price: price ? Number(price) : undefined,
    };
    if (type === "PRODUCT") {
      onSubmit({
        type: "PRODUCT",
        ...base,
        category: category || undefined,
        sku: sku || undefined,
        stockQty: stockQty ? Number(stockQty) : undefined,
      });
    } else {
      onSubmit({
        type,
        ...base,
        category: category || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        location: location || undefined,
        isOnline,
        capacity: capacity ? Number(capacity) : undefined,
        instructorUserId: instructorUserId || undefined,
      });
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {allowedTypes.length > 1 && (
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {typeOptions.filter((opt) => allowedTypes.includes(opt.value)).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={mode === "edit"}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    type === opt.value
                      ? "border-accent/40 bg-accent-soft text-accent"
                      : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
                    mode === "edit" && "cursor-not-allowed opacity-50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">URL da imagem</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          {type === "PRODUCT" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" placeholder="Ex.: Anatomia Óssea" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stockQty">Estoque</Label>
                <Input id="stockQty" type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria (opcional)</Label>
                <Input id="category" placeholder="Ex.: Corporal, Facial" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startsAt">Início</Label>
                  <Input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endsAt">Fim (opcional)</Label>
                  <Input id="endsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location">Local</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Vagas (em branco = ilimitado)</Label>
                  <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
              </div>
              <Checkbox checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} label="Evento online" />
              <div className="space-y-1.5">
                <Label htmlFor="instructorUserId">Instrutor responsável (opcional)</Label>
                <select
                  id="instructorUserId"
                  value={instructorUserId}
                  onChange={(e) => setInstructorUserId(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
                >
                  <option value="">Nenhum</option>
                  {doctors.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button type="submit" loading={submitting}>
            {mode === "create" ? "Criar item" : "Salvar alterações"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
