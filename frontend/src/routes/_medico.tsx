import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MedicoSidebar } from "../components/layout/MedicoSidebar";
import { MedicoTopbar } from "../components/layout/MedicoTopbar";
import { MedicoMobileDrawer } from "../components/layout/MedicoMobileDrawer";
import { Spinner } from "../components/ui/Spinner";
import { cn } from "../lib/cn";
import { useAuth } from "../contexts/AuthContext";
import { apiGetMyDoctorProfile } from "../lib/api/doctors";

export const Route = createFileRoute("/_medico")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("bp.token")) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: MedicoLayout,
});

function MedicoLayout() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({ to: "/login" });
    }
    // Staff/admin não têm o que fazer na área do médico — manda de volta pro CRM.
    if (status === "authenticated" && user && user.role !== "DOCTOR") {
      void navigate({ to: "/dashboard" });
    }
  }, [status, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: apiGetMyDoctorProfile,
    enabled: status === "authenticated" && user?.role === "DOCTOR",
    retry: false,
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!profile) return;
    const isApproved = profile.approvalStatus === "APPROVED";
    if (!isApproved && pathname !== "/medico/pendente") {
      void navigate({ to: "/medico/pendente" });
    }
    if (isApproved && pathname === "/medico/pendente") {
      void navigate({ to: "/medico" });
    }
  }, [profile, pathname, navigate]);

  if (status === "loading" || (status === "authenticated" && user?.role === "DOCTOR" && profileLoading)) {
    return (
      <div className="brand-medico dark flex min-h-screen items-center justify-center bg-bg" role="status" aria-label="Carregando sessão">
        <Spinner size={24} />
      </div>
    );
  }

  if (status === "unauthenticated" || (user && user.role !== "DOCTOR")) {
    return null;
  }

  if (profile && profile.approvalStatus !== "APPROVED") {
    return (
      <div className="brand-medico dark min-h-screen bg-bg">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="brand-medico dark flex min-h-screen bg-bg">
      <div className={cn("hidden shrink-0 md:block", collapsed ? "w-[64px]" : "w-[232px]")} />
      <MedicoSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MedicoMobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MedicoTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
