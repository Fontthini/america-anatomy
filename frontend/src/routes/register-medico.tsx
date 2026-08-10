import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { PasswordStrength } from "../components/ui/PasswordStrength";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/register-medico")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const hasToken = !!window.localStorage.getItem("bp.token");
      if (hasToken) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Cadastro de médico — America Anatomy" }] }),
  component: RegisterMedicoPage,
});

function RegisterMedicoPage() {
  const { registerDoctor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.localStorage.getItem("bp.token")) {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome.";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail inválido.";
    if (password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (confirm !== password) e.confirm = "As senhas não coincidem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await registerDoctor({
        name,
        email,
        password,
        ...(crm ? { crm } : {}),
        ...(specialty ? { specialty } : {}),
        ...(clinicName ? { clinicName } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
      });
      void navigate({ to: "/medico" });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
        setErrors({ email: err.message });
      } else {
        toast({ kind: "error", title: "Falha no cadastro", description: (err as Error).message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit quote="Sua área exclusiva de médico começa aqui." caption="Cadastre-se para acessar produtos, cursos e seminários.">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl text-fg">Cadastro de médico</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Seu cadastro passa por uma análise da nossa equipe antes da liberação do acesso.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
              <PasswordStrength value={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="crm">CRM</Label>
              <Input id="crm" placeholder="CRM-SP 123456" value={crm} onChange={(e) => setCrm(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="clinicName">Clínica</Label>
              <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">UF</Label>
              <Input id="state" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Enviar cadastro
          </Button>

          <p className="text-center text-sm text-fg-muted">
            Já tem conta?{" "}
            <Link to="/login" className="text-fg underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </AuthSplit>
  );
}
