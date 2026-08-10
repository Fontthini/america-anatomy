import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Checkbox } from "../components/ui/Checkbox";
import { PasswordStrength } from "../components/ui/PasswordStrength";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/register")({
  // Único fluxo de auto-cadastro do produto é o de médico — evita criar
  // usuários DOCTOR órfãos (sem DoctorProfile, nunca aprováveis).
  beforeLoad: () => {
    throw redirect({ to: "/register-medico" });
  },
  head: () => ({ meta: [{ title: "Criar conta — Base" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Guard client-side: redireciona após hidratação se já tiver token
  useEffect(() => {
    if (window.localStorage.getItem("bp.token")) {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome.";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail inválido.";
    if (password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (confirm !== password) e.confirm = "As senhas não coincidem.";
    if (!terms) e.terms = "Você precisa aceitar os termos.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register({ name, email, password });
      void navigate({ to: "/dashboard" });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
        // Erro inline no campo de e-mail
        setErrors({ email: err.message });
      } else {
        toast({
          kind: "error",
          title: "Falha no registro",
          description: (err as Error).message,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit quote="Begin with intent." caption="Crie sua conta em segundos.">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl text-fg">Criar conta</h1>
          <p className="mt-2 text-sm text-fg-muted">Preencha os dados abaixo para começar.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <PasswordStrength value={password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
          </div>

          <div>
            <Checkbox
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              label={
                <span>
                  Aceito os <span className="text-fg underline-offset-4 hover:underline">Termos</span> e a{" "}
                  <span className="text-fg underline-offset-4 hover:underline">Política de Privacidade</span>.
                </span>
              }
            />
            {errors.terms ? <p className="mt-1 text-xs text-danger">{errors.terms}</p> : null}
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Criar conta
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
