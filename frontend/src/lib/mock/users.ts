export type Role = "DOCTOR" | "SALES_REP" | "MANAGER" | "ADMIN";

export const roleLabels: Record<Role, string> = {
  DOCTOR: "Médico",
  SALES_REP: "Vendedor(a)",
  MANAGER: "Gerente",
  ADMIN: "Admin",
};

export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: Role;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
};