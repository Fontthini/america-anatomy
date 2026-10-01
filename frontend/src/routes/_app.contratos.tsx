import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FileSignature, CheckCircle2, Clock, XCircle, Plus, Copy, Check } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../contexts/AuthContext";
import {
  apiListContracts,
  apiListCourseConfigs,
  apiSaveCourseConfig,
  type CourseConfigPayload,
  type CourseConfigResponse,
} from "../lib/api/contracts";

export const Route = createFileRoute("/_app/contratos")({
  head: () => ({ meta: [{ title: "Contratos — Portal AAI" }] }),
  component: ContractsPage,
});

const EMPTY_CONFIG: CourseConfigPayload = {
  label: "",
  coordenadorNome: "",
  coordenadorCpf: "",
  coordenadorEndereco: "",
  coordenadorNumero: "",
  coordenadorBairro: "",
  coordenadorCidade: "",
  coordenadorEstado: "",
  coordenadorCep: "",
  coordenadorEstadoCivil: "Solteiro(a)",
  coordenadorProfissao: "",
  coordenadorEmail: "",
  eventoCidade: "",
  eventoDatas: "",
};

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
          <p className="font-display text-xl text-fg">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/contrato/${slug}` : `/contrato/${slug}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
      {copied ? "Copiado!" : "Copiar link"}
    </Button>
  );
}

function TurmasCard({ configs, canEdit, onNew }: { configs: CourseConfigResponse[]; canEdit: boolean; onNew: () => void }) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-display text-base text-fg">Turmas</p>
            <p className="text-xs text-fg-muted">Cada turma tem seu próprio link — copie e envie pro grupo de clientes certo.</p>
          </div>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={onNew}>
              <Plus size={14} className="mr-1.5" /> Nova turma
            </Button>
          )}
        </div>

        <div className="divide-y divide-line">
          {configs.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{c.label}</p>
                <p className="truncate text-xs text-fg-muted">
                  {c.eventoCidade} · {c.eventoDatas} · Coordenador: {c.coordenadorNome}
                </p>
                <p className="truncate font-mono text-xs text-fg-muted">/contrato/{c.slug}</p>
              </div>
              <CopyLinkButton slug={c.slug} />
            </div>
          ))}
          {configs.length === 0 && (
            <p className="py-6 text-center text-sm text-fg-muted">Nenhuma turma cadastrada ainda.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function ContractsPage() {
  const { user } = useAuth();
  const canEditConfig = user?.role === "MANAGER" || user?.role === "ADMIN";
  const [newConfigOpen, setNewConfigOpen] = useState(false);
  const [turmaFilter, setTurmaFilter] = useState<string>("");

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: apiListContracts,
    refetchInterval: 30_000,
  });

  const { data: configs = [] } = useQuery({ queryKey: ["contractsConfig"], queryFn: apiListCourseConfigs });

  const contracts = turmaFilter ? allContracts.filter((c) => c.turmaId === turmaFilter) : allContracts;

  const total = contracts.length;
  const signed = contracts.filter((c) => c.status === "SIGNED").length;
  const pending = contracts.filter((c) => c.status === "PENDING").length;
  const refused = contracts.filter((c) => c.status === "REFUSED").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="CRM"
        title="Contratos"
        description="Acompanhe os contratos gerados pelos formulários públicos e o status de assinatura no Autentique."
      />

      <TurmasCard configs={configs} canEdit={canEditConfig} onNew={() => setNewConfigOpen((v) => !v)} />

      {newConfigOpen && <CourseConfigCard onSaved={() => setNewConfigOpen(false)} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total enviados" value={total} icon={<FileSignature size={18} />} tone="bg-accent-soft text-accent" />
        <StatCard label="Assinados" value={signed} icon={<CheckCircle2 size={18} />} tone="bg-success/15 text-success" />
        <StatCard label="Pendentes" value={pending} icon={<Clock size={18} />} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" />
        <StatCard label="Recusados" value={refused} icon={<XCircle size={18} />} tone="bg-danger/15 text-danger" />
      </div>

      <div className="flex items-center gap-2">
        <Label className="shrink-0">Filtrar por turma</Label>
        <select
          value={turmaFilter}
          onChange={(e) => setTurmaFilter(e.target.value)}
          className="h-9 max-w-xs rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
        >
          <option value="">Todas as turmas</option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-fg-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium">Coordenador</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Enviado em</th>
                <th className="px-4 py-3 font-medium">Assinado em</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-fg">{c.nomeCompleto}</td>
                  <td className="px-4 py-3 text-fg-muted">{c.email}</td>
                  <td className="px-4 py-3 text-fg-muted">{c.turmaLabel}</td>
                  <td className="px-4 py-3 text-fg-muted">{c.coordenadorNome}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.status === "SIGNED" ? "accent" : c.status === "REFUSED" ? "danger" : "warn"}>
                      {c.status === "SIGNED" ? "Assinado" : c.status === "REFUSED" ? "Recusado" : "Pendente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{new Date(c.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {c.signedAt ? new Date(c.signedAt).toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
              {!isLoading && contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                    Nenhum contrato enviado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

function CourseConfigCard({ onSaved }: { onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CourseConfigPayload>(EMPTY_CONFIG);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CourseConfigPayload>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const saveMutation = useMutation({
    mutationFn: () => apiSaveCourseConfig(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractsConfig"] });
      setForm(EMPTY_CONFIG);
      onSaved();
    },
    onError: () => setError("Não foi possível salvar. Confira os campos."),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    saveMutation.mutate();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <p className="font-display text-base text-fg">Nova turma</p>
            <p className="text-xs text-fg-muted">
              Esses dados (coordenador e evento) entram automaticamente em todo contrato gerado a partir do link
              desta turma — o paciente não vê nem edita isso. O nome vira o link público, então escolha algo
              identificável.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Nome da turma</Label>
            <Input required value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Ex: Orlando - Maio 2027" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cidade do evento</Label>
              <Input required value={form.eventoCidade} onChange={(e) => update("eventoCidade", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Datas do curso</Label>
              <Input
                required
                value={form.eventoDatas}
                onChange={(e) => update("eventoDatas", e.target.value)}
                placeholder="18, 19 e 20 de outubro de 2026"
              />
            </div>
          </div>

          <p className="pt-1 text-xs uppercase tracking-wide text-fg-muted">Coordenador pedagógico</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input required value={form.coordenadorNome} onChange={(e) => update("coordenadorNome", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input required type="email" value={form.coordenadorEmail} onChange={(e) => update("coordenadorEmail", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input required value={form.coordenadorCpf} onChange={(e) => update("coordenadorCpf", e.target.value)} />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label>Endereço (rua)</Label>
              <Input required value={form.coordenadorEndereco} onChange={(e) => update("coordenadorEndereco", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nº</Label>
              <Input required value={form.coordenadorNumero} onChange={(e) => update("coordenadorNumero", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input required value={form.coordenadorBairro} onChange={(e) => update("coordenadorBairro", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input required value={form.coordenadorCep} onChange={(e) => update("coordenadorCep", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input required value={form.coordenadorCidade} onChange={(e) => update("coordenadorCidade", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado (UF)</Label>
              <Input required maxLength={2} className="uppercase" value={form.coordenadorEstado} onChange={(e) => update("coordenadorEstado", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Profissão</Label>
              <Input required value={form.coordenadorProfissao} onChange={(e) => update("coordenadorProfissao", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado civil</Label>
              <select
                value={form.coordenadorEstadoCivil}
                onChange={(e) => update("coordenadorEstadoCivil", e.target.value)}
                className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
              >
                <option>Solteiro(a)</option>
                <option>Casado(a)</option>
                <option>Divorciado(a)</option>
                <option>Viúvo(a)</option>
                <option>União estável</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button type="submit" loading={saveMutation.isPending}>
            Criar turma
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
