import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession as storeSession, validSessionToken, destroySessionToken } from "./repo";
import { isAdminEmail } from "./allowlist";

const SESSION_COOKIE = "cholti_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function createSession(email: string): Promise<string> {
  const token = newSessionToken();
  await storeSession(hashToken(token), Date.now() + SESSION_TTL_MS, email);
  return token;
}

export async function validSession(token: string | null): Promise<{ ok: boolean; email: string }> {
  if (!token) return { ok: false, email: "" };
  const s = await validSessionToken(hashToken(token));
  if (!s.ok) return s;
  if (!(await isAdminEmail(s.email))) {
    await destroySessionToken(hashToken(token));
    return { ok: false, email: "" };
  }
  return s;
}

export async function destroySession(token: string | null) {
  if (token) await destroySessionToken(hashToken(token));
}

export async function requireAdmin(): Promise<string> {
  const token = await readSessionCookie();
  const s = await validSession(token);
  if (!s.ok) redirect("/login");
  return s.email;
}

export { SESSION_TTL_MS };
