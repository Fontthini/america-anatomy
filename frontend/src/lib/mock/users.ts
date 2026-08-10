export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
};

export const DEMO_CREDENTIALS = {
  email: "demo@demo.com",
  password: "demo1234",
};

export const demoUser: MockUser = {
  id: "u_001",
  name: "Alex Moreira",
  email: DEMO_CREDENTIALS.email,
  bio: "Designer-engenheiro. Construindo produtos com restrição.",
  role: "Owner",
  emailVerified: true,
  emailNotifications: true,
  productUpdates: false,
};