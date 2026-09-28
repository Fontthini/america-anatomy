import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { AaiLogo } from "../components/ui/AaiLogo";
import { apiSubmitContract, type SubmitContractPayload } from "../lib/api/contracts";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/contrato")({
  head: () => ({ meta: [{ title: "Confirmar dados — America Anatomy Institute" }] }),
  component: ContractPage,
});

const INITIAL: SubmitContractPayload = {
  nomeCompleto: "",
  email: "",
  cpf: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  profissao: "",
  estadoCivil: "Solteiro(a)",
};

function ContractPage() {
  const [form, setForm] = useState<SubmitContractPayload>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [signUrl, setSignUrl] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => apiSubmitContract(form),
    onSuccess: (res) => setSignUrl(res.signUrl),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente."),
  });

  function update<K extends keyof SubmitContractPayload>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    submitMutation.mutate();
  }

  return (
    <div className="brand-medico dark flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-line-strong bg-surface-1 p-6 shadow-[var(--shadow-pop)] sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <AaiLogo size={36} />
          <span className="font-display text-sm font-semibold text-fg">American Anatomy Institute</span>
        </div>

        {submitMutation.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={32} className="text-success" />
            <p className="font-display text-lg text-fg">Tudo certo, {form.nomeCompleto.split(" ")[0]}!</p>
            <p className="text-sm text-fg-muted">
              Enviamos um e-mail para <strong className="text-fg">{form.email}</strong> com o contrato para
              assinatura digital.
            </p>
            {signUrl && (
              <a href={signUrl} target="_blank" rel="noreferrer">
                <Button className="mt-2">Abrir contrato para assinar</Button>
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="font-display text-lg text-fg">Confirme seus dados</p>
              <p className="text-xs text-fg-muted">
                Vamos gerar seu contrato e enviar para assinatura digital pelo Autentique.
              </p>
            </div>

            <Field label="Nome completo">
              <Input required value={form.nomeCompleto} onChange={(e) => update("nomeCompleto", e.target.value)} />
            </Field>

            <Field label="E-mail (é para onde vai o contrato)">
              <Input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>

            <Field label="CPF">
              <Input required placeholder="000.000.000-00" value={form.cpf} onChange={(e) => update("cpf", e.target.value)} />
            </Field>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Field label="Endereço (rua)">
                  <Input required value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
                </Field>
              </div>
              <Field label="Nº">
                <Input required value={form.numero} onChange={(e) => update("numero", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro">
                <Input required value={form.bairro} onChange={(e) => update("bairro", e.target.value)} />
              </Field>
              <Field label="CEP">
                <Input required value={form.cep} onChange={(e) => update("cep", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade">
                <Input required value={form.cidade} onChange={(e) => update("cidade", e.target.value)} />
              </Field>
              <Field label="Estado (UF)">
                <Input
                  required
                  maxLength={2}
                  className="uppercase"
                  value={form.estado}
                  onChange={(e) => update("estado", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Profissão">
                <Input required value={form.profissao} onChange={(e) => update("profissao", e.target.value)} />
              </Field>
              <Field label="Estado civil">
                <select
                  value={form.estadoCivil}
                  onChange={(e) => update("estadoCivil", e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
                >
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                  <option>União estável</option>
                </select>
              </Field>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <Button type="submit" className="w-full" loading={submitMutation.isPending}>
              Confirmar e gerar contrato
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
