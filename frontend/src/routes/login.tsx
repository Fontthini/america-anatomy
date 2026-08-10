import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Checkbox } from "../components/ui/Checkbox";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const hasToken = !!window.localStorage.getItem("bp.token");
      if (hasToken) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Entrar — Base" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Guard client-side: redireciona após hidratação se já tiver token
  useEffect(() => {
    if (window.localStorage.getItem("bp.token")) {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail inválido.";
    if (password.length < 4) e.password = "Senha muito curta.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      void navigate({ to: "/dashboard" });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        const changedAt = (err.details as Record<string, string> | undefined)?.passwordChangedAt;
        if (changedAt) {
          const diff = Date.now() - new Date(changedAt).getTime();
          const mins = Math.floor(diff / 60_000);
          const hours = Math.floor(diff / 3_600_000);
          const days = Math.floor(diff / 86_400_000);
          const months = Math.floor(days / 30);
          const years = Math.floor(days / 365);

          const relative =
            mins < 1 ? "agora mesmo" :
            mins < 60 ? `há ${mins} ${mins === 1 ? "minuto" : "minutos"}` :
            hours < 24 ? `há ${hours} ${hours === 1 ? "hora" : "horas"}` :
            days < 30 ? `há ${days} ${days === 1 ? "dia" : "dias"}` :
            months < 12 ? `há ${months} ${months === 1 ? "mês" : "meses"}` :
            `há ${years} ${years === 1 ? "ano" : "anos"}`;

          setErrors({ password: `Sua senha foi alterada ${relative}. Use a senha mais recente.` });
        } else {
          setErrors({ password: "E-mail ou senha incorretos." });
        }
      } else {
        toast({
          kind: "error",
          title: "Não foi possível entrar",
          description: (err as Error).message,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit quote="Build with restraint." caption="Boilerplate construído para durar — sem ruído.">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl text-fg">Entrar</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Acesse sua conta para continuar.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/forgot-password" className="text-xs text-fg-muted hover:text-fg">
                Esqueci a senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
            />
          </div>

          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            label="Lembrar de mim neste dispositivo"
          />

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>

          <p className="text-center text-sm text-fg-muted">
            É médico e ainda não tem conta?{" "}
            <Link to="/register-medico" className="text-fg underline-offset-4 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </form>

        <div className="rounded-lg border border-line bg-surface-1 p-3 text-xs text-fg-muted">
          <p className="font-medium text-fg">Credenciais demo</p>
          <p className="mt-0.5 font-mono">admin@demo.com · demo1234 (admin)</p>
          <p className="mt-0.5 font-mono">medico@demo.com · demo1234 (médico aprovado)</p>
        </div>
      </div>
    </AuthSplit>
  );
}
