import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { PageContainer } from "../components/layout/PageContainer";
import { CatalogItemForm, type CatalogFormValues } from "../components/catalog/CatalogItemForm";
import { useToast } from "../contexts/ToastContext";
import { apiCreateCatalogItem, type CatalogItemType } from "../lib/api/catalog";

const searchSchema = z.object({
  type: z.enum(["PRODUCT", "COURSE", "SEMINAR"]).optional(),
});

export const Route = createFileRoute("/_app/catalogo/novo")({
  validateSearch: searchSchema,
  component: NewCatalogItemPage,
});

// Loja só cria produtos; Gestão de Cursos manda ?type=COURSE e só permite curso/seminário.
const ALLOWED_TYPES_BY_ENTRY: Record<string, CatalogItemType[]> = {
  PRODUCT: ["PRODUCT"],
  COURSE: ["COURSE", "SEMINAR"],
  SEMINAR: ["COURSE", "SEMINAR"],
};

function NewCatalogItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { type } = Route.useSearch();
  const allowedTypes = ALLOWED_TYPES_BY_ENTRY[type ?? "PRODUCT"] ?? ["PRODUCT"];
  const backTo = type ? "/gestao-cursos" : "/catalogo";

  const createMutation = useMutation({
    mutationFn: (values: CatalogFormValues) => apiCreateCatalogItem(values),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast({ kind: "success", title: "Item criado", description: "Já dá pra publicar quando quiser." });
      void navigate({ to: "/catalogo/$id", params: { id: item.id } });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao criar item", description: (err as Error).message }),
  });

  return (
    <PageContainer className="max-w-2xl">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> {type ? "Voltar aos cursos" : "Voltar à loja"}
      </Link>
      <h1 className="font-display text-2xl text-fg">{type ? "Novo curso" : "Novo produto"}</h1>
      <CatalogItemForm
        mode="create"
        allowedTypes={allowedTypes}
        onSubmit={(values) => createMutation.mutate(values)}
        submitting={createMutation.isPending}
      />
    </PageContainer>
  );
}
