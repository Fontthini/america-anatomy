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

export const DEMO_CREDENTIALS = {
  email: "admin@demo.com",
  password: "demo1234",
};

export const demoUser: MockUser = {
  id: "u_admin",
  name: "Ana Diretora",
  email: DEMO_CREDENTIALS.email,
  role: "ADMIN",
  emailVerified: true,
  emailNotifications: true,
  productUpdates: false,
};