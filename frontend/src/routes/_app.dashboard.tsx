import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Inbox,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { Dropdown, DropdownItem } from "../components/ui/Dropdown";
import { Button } from "../components/ui/Button";
import { kpis } from "../lib/mock/kpis";
import { chartData } from "../lib/mock/chart";
import { tableRows, type Row, type Status } from "../lib/mock/table";
import { mockDelay } from "../lib/mock";
import { cn } from "../lib/cn";
import { useThemeColors } from "../lib/useThemeColors";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Base" }] }),
  component: DashboardPage,
});

const statusTone: Record<Status, "accent" | "warn" | "danger" | "muted"> = {
  ativo: "accent",
  pendente: "warn",
  cancelado: "danger",
  rascunho: "muted",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"client" | "status" | "amount" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const pageSize = 8;
  const c = useThemeColors();

  useEffect(() => {
    let alive = true;
    mockDelay(550).then(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const sorted = useMemo(() => {
    const arr = [...tableRows];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [sortKey, sortDir]);
  const pages = Math.ceil(sorted.length / pageSize);
  const slice: Row[] = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [page, sorted],
  );

  function toggleSort(k: typeof sortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  function SortTh({ k, label, align = "left" }: { k: typeof sortKey; label: string; align?: "left" | "right" }) {
    const active = sortKey === k;
    return (
      <th className={cn("px-5 py-3 font-medium", align === "right" && "text-right")}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn(
            "inline-flex items-center gap-1 transition-colors hover:text-fg",
            active && "text-fg",
          )}
        >
          {label}
          {active ? (
            sortDir === "asc" ? <ArrowUp size={11} strokeWidth={1.5} /> : <ArrowDown size={11} strokeWidth={1.5} />
          ) : null}
        </button>
      </th>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Métricas mockadas para você visualizar o boilerplate. Dados ficam em src/lib/mock."
      />

      {/* KPIs */}
      <section className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const positive = k.delta >= 0;
          return (
            <Card key={k.label}>
              <CardBody className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-fg-muted">{k.label}</p>
                {loading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="tnum font-display text-4xl text-fg">{k.value}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      positive ? "text-accent" : "text-fg-muted",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight size={12} strokeWidth={1.5} />
                    ) : (
                      <ArrowDownRight size={12} strokeWidth={1.5} />
                    )}
                    {positive ? "+" : ""}
                    {k.delta}%
                  </span>
                  <span className="text-fg-muted">{k.hint}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </section>

      {/* Chart */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-fg">Receita mensal</h2>
            <p className="text-xs text-fg-muted">Últimos 12 meses · mockado</p>
          </div>
          <Badge tone="muted">2025</Badge>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={c.line} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={c.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={c.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: c.line, strokeWidth: 1 }}
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.line}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: c.fg,
                    }}
                    labelStyle={{ color: c.muted }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={c.accent}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: c.accent, stroke: c.bg }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-fg">Faturas recentes</h2>
            <p className="text-xs text-fg-muted">25 registros · mockados</p>
          </div>
          <Button size="sm" variant="secondary">Exportar</Button>
        </CardHeader>

        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tableRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox size={28} strokeWidth={1.25} className="text-fg-muted" />
            <div>
              <p className="text-sm text-fg">Nenhuma fatura ainda</p>
              <p className="text-xs text-fg-muted">Quando houver dados, eles aparecem aqui.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-surface-1">
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-fg-muted">
                  <SortTh k="client" label="Cliente" />
                  <SortTh k="status" label="Status" />
                  <SortTh k="amount" label="Valor" />
                  <SortTh k="date" label="Data" />
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {slice.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line transition-colors duration-150 hover:bg-surface-2 focus-within:bg-surface-2"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-fg">{row.client}</p>
                      <p className="text-xs text-fg-muted">{row.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 tnum font-mono text-fg">{formatBRL(row.amount)}</td>
                    <td className="px-5 py-3.5 text-fg-muted">{formatDate(row.date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Dropdown
                        trigger={
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg">
                            <MoreHorizontal size={16} />
                          </span>
                        }
                      >
                        <DropdownItem>Ver detalhes</DropdownItem>
                        <DropdownItem>Duplicar</DropdownItem>
                        <DropdownItem danger>Excluir</DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-3 text-xs text-fg-muted">
              <span>
                Página <span className="text-fg">{page}</span> de {pages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}