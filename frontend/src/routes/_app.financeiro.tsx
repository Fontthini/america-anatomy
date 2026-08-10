import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListFinancialEntries,
  apiGetFinancialSummary,
  apiCreateFinancialEntry,
  apiDeleteFinancialEntry,
  type FinancialEntryType,
} from "../lib/api/finance";

export const Route = createFileRoute("/_app/financeiro")({
  component: FinancePage,
});

function formatBRL(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tone)}>{icon}</span>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
          <p className="font-display text-xl text-fg">{formatBRL(value)}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function CategoryBars({ items, tone }: { items: { category: string; total: string }[]; tone: string }) {
  if (items.length === 0) return <p className="text-xs text-fg-muted">Sem lançamentos.</p>;
  const max = Math.max(...items.map((i) => Number(i.total)));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.category} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-muted">{item.category}</span>
            <span className="tnum text-fg">{formatBRL(item.total)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2">
            <div
              className={cn("h-1.5 rounded-full", tone)}
              style={{ width: `${(Number(item.total) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewEntryForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState<FinancialEntryType>("INCOME");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));

  const createMutation = useMutation({
    mutationFn: () =>
      apiCreateFinancialEntry({
        type,
        category,
        description,
        amount: Number(amount),
        entryDate: new Date(entryDate).toISOString(),
      }),
    onSuccess: () => {
      onCreated();
      setCategory("");
      setDescription("");
      setAmount("");
      toast({ kind: "success", title: "Lançamento criado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao lançar", description: (err as Error).message }),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    createMutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as FinancialEntryType)}
        className="h-10 rounded-lg border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none sm:col-span-1"
      >
        <option value="INCOME">Entrada</option>
        <option value="EXPENSE">Saída</option>
      </select>
      <Input placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="sm:col-span-1" required />
      <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" required />
      <Input type="number" placeholder="Valor" value={amount} onChange={(e) => setAmount(e.target.value)} className="sm:col-span-1" required />
      <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="sm:col-span-1" />
      <Button type="submit" loading={createMutation.isPending} leftIcon={<Plus size={14} />} className="sm:col-span-6">
        Lançar
      </Button>
    </form>
  );
}

function FinancePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary } = useQuery({ queryKey: ["financeSummary"], queryFn: apiGetFinancialSummary });
  const { data: entries = [], isLoading } = useQuery({ queryKey: ["financeEntries"], queryFn: () => apiListFinancialEntries() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
    void queryClient.invalidateQueries({ queryKey: ["financeEntries"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteFinancialEntry(id),
    onSuccess: invalidate,
    onError: (err) => toast({ kind: "error", title: "Erro ao excluir", description: (err as Error).message }),
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="CRM" title="Financeiro" description="Entradas, saídas e saldo — inclui lançamentos automáticos de pedidos e comissões." />

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Entradas" value={summary.totalIncome} icon={<TrendingUp size={18} />} tone="bg-success/10 text-success" />
          <StatCard label="Saídas" value={summary.totalExpense} icon={<TrendingDown size={18} />} tone="bg-danger/10 text-danger" />
          <StatCard label="Saldo" value={summary.balance} icon={<Wallet size={18} />} tone="bg-accent-soft text-accent" />
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardBody className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Entradas por categoria</p>
              <CategoryBars items={summary.byCategoryIncome} tone="bg-success" />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Saídas por categoria</p>
              <CategoryBars items={summary.byCategoryExpense} tone="bg-danger" />
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardBody>
          <NewEntryForm onCreated={invalidate} />
        </CardBody>
      </Card>

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge tone={entry.type === "INCOME" ? "accent" : "danger"}>{entry.category}</Badge>
                  <div>
                    <p className="text-sm text-fg">{entry.description}</p>
                    <p className="text-xs text-fg-muted">{new Date(entry.entryDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("tnum text-sm font-medium", entry.type === "INCOME" ? "text-success" : "text-danger")}>
                    {entry.type === "INCOME" ? "+" : "-"} {formatBRL(entry.amount)}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className="text-fg-muted hover:text-danger"
                    aria-label="Excluir lançamento"
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
