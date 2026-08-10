import { mockDelay } from "./index";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DoctorProfile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  crm: string | null;
  specialty: string | null;
  phone: string | null;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  createdAt: string;
};

export const mockPendingDoctors: DoctorProfile[] = [
  {
    id: "doc_1",
    userId: "u_medico_pendente",
    name: "Dra. Beatriz Souza",
    email: "pendente@demo.com",
    crm: "CRM-RJ 654321",
    specialty: "Dermatologia",
    phone: null,
    clinicName: "Souza Estética",
    city: "Rio de Janeiro",
    state: "RJ",
    approvalStatus: "PENDING",
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
];

export async function mockListDoctors(status?: ApprovalStatus): Promise<DoctorProfile[]> {
  await mockDelay();
  return status ? mockPendingDoctors.filter((d) => d.approvalStatus === status) : mockPendingDoctors;
}
