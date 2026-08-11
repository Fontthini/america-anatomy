import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { CatalogItemForm, type CatalogFormValues } from "../components/catalog/CatalogItemForm";
import { useToast } from "../contexts/ToastContext";
import { apiGetCatalogItem, apiUpdateCatalogItem } from "../lib/api/catalog";

export const Route = createFileRoute("/_app/catalogo/$id")({
  component: EditCatalogItemPage,
});

function EditCatalogItemPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: item, isLoading } = useQuery({
    queryKey: ["catalog", id],
    queryFn: () => apiGetCatalogItem(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CatalogFormValues) => apiUpdateCatalogItem(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast({ kind: "success", title: "Alterações salvas" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao salvar", description: (err as Error).message }),
  });

  return (
    <PageContainer className="max-w-2xl">
      <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar ao catálogo
      </Link>

      {isLoading || !item ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl text-fg">{item.title}</h1>
            {(item.type === "COURSE" || item.type === "SEMINAR") && (
              <Link
                to="/gestao-cursos/$id"
                params={{ id: item.id }}
                className="flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg"
              >
                <Users size={12} /> Ver inscritos
              </Link>
            )}
          </div>
          <CatalogItemForm
            mode="edit"
            initial={item}
            onSubmit={(values) => updateMutation.mutate(values)}
            submitting={updateMutation.isPending}
          />
        </>
      )}
    </PageContainer>
  );
}
