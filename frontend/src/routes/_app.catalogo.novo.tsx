import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { CatalogItemForm, type CatalogFormValues } from "../components/catalog/CatalogItemForm";
import { useToast } from "../contexts/ToastContext";
import { apiCreateCatalogItem } from "../lib/api/catalog";

export const Route = createFileRoute("/_app/catalogo/novo")({
  component: NewCatalogItemPage,
});

function NewCatalogItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar ao catálogo
      </Link>
      <h1 className="font-display text-2xl text-fg">Novo item</h1>
      <CatalogItemForm mode="create" onSubmit={(values) => createMutation.mutate(values)} submitting={createMutation.isPending} />
    </PageContainer>
  );
}
