import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, XCircle } from "lucide-react";
import { apiGetMyDoctorProfile } from "../lib/api/doctors";

export const Route = createFileRoute("/_medico/medico/pendente")({
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const { data: profile } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: apiGetMyDoctorProfile,
  });

  const rejected = profile?.approvalStatus === "REJECTED";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <span
          className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
            rejected ? "bg-danger/10 text-danger" : "bg-accent-soft text-accent"
          }`}
        >
          {rejected ? <XCircle size={26} /> : <Clock size={26} />}
        </span>
        <h1 className="font-display text-3xl text-fg">
          {rejected ? "Cadastro não aprovado" : "Cadastro em análise"}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {rejected
            ? "Seu cadastro não foi aprovado pela nossa equipe."
            : "Recebemos seu cadastro e ele está sendo analisado pela nossa equipe. Você receberá um e-mail assim que for aprovado."}
        </p>
        {rejected && profile?.rejectionReason && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-fg">
            <strong>Motivo:</strong> {profile.rejectionReason}
          </p>
        )}
      </div>
    </div>
  );
}
