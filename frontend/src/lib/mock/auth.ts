// TODO: replace with real API calls (Supabase / REST / GraphQL).
import { DEMO_CREDENTIALS, demoUser, type MockUser } from "./users";
import { mockDelay } from "./index";

export async function mockLogin(email: string, password: string): Promise<MockUser> {
  await mockDelay(800);
  if (
    email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    throw new Error("E-mail ou senha incorretos.");
  }
  return { ...demoUser, email: email.trim().toLowerCase() };
}

export async function mockRegister(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<MockUser> {
  await mockDelay(900);
  if (!payload.email.includes("@")) throw new Error("E-mail inválido.");
  return {
    ...demoUser,
    id: "u_" + Math.random().toString(36).slice(2, 8),
    name: payload.name,
    email: payload.email.trim().toLowerCase(),
  };
}

export async function mockRequestPasswordReset(email: string): Promise<void> {
  await mockDelay(700);
  if (!email.includes("@")) throw new Error("E-mail inválido.");
}

export async function mockResetPassword(_token: string, newPassword: string): Promise<void> {
  await mockDelay(700);
  if (newPassword.length < 8) throw new Error("A senha precisa de pelo menos 8 caracteres.");
}