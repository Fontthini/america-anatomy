import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { MobileDrawer } from "../components/layout/MobileDrawer";
import { Spinner } from "../components/ui/Spinner";
import { cn } from "../lib/cn";
import { useAuth } from "../contexts/AuthContext";

export const Route = createFileRoute("/_app")({
  // Guarda rápida (síncrona): verifica presença do token antes de renderizar.
  // A validação real (token ainda válido?) acontece no AuthContext via GET /api/auth/me.
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const hasToken = !!localStorage.getItem("bp.token");
    if (!hasToken) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({ to: "/login" });
    }
    // Bloqueia acesso ao app se e-mail não confirmado
    if (status === "authenticated" && user && !user.emailVerified) {
      void navigate({ to: "/verificar-email" });
    }
  }, [status, user, navigate]);

  // Tela de carregamento durante a hidratação de sessão
  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-bg"
        role="status"
        aria-label="Carregando sessão"
      >
        <Spinner size={24} />
      </div>
    );
  }

  // Evita flash do layout enquanto o redirect ainda não processou
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div
        className={cn(
          "hidden shrink-0 md:block",
          collapsed ? "w-[64px]" : "w-[232px]"
        )}
      />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
