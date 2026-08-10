import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // No servidor (SSR), redireciona para /login para evitar tela preta.
    // No cliente, verifica o token salvo e vai para /dashboard se já autenticado.
    if (typeof window === "undefined") {
      throw redirect({ to: "/login" });
    }
    const hasToken = !!window.localStorage.getItem("bp.token");
    throw redirect({ to: hasToken ? "/dashboard" : "/login" });
  },
  component: () => null,
});
