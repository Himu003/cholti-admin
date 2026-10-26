import { fsdb } from "./firebase";

export type AdminRole = "admin" | "sub admin";
export type AdminRow = { email: string; role: AdminRole };

const ADMINS_DOC = "config/admins";
const CACHE_TTL_MS = 15_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function toAdminRows(emails: string[], admins: string[] = []): AdminRow[] {
  const adminSet = new Set(admins.map(normalizeEmail));
  return emails.map((email) => ({
    email,
    role: adminSet.has(normalizeEmail(email)) ? "admin" : "sub admin",
  }));
}

type AdminConfig = { emails: string[]; admins: string[] };

let cache: { at: number; config: AdminConfig } | null = null;

function parseList(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string").map(normalizeEmail).filter(Boolean)
    : [];
  return [...new Set(list)];
}

async function readConfig(): Promise<AdminConfig> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.config;
  let emails: string[] = [];
  let admins: string[] = [];
  try {
    const snap = await fsdb().doc(ADMINS_DOC).get();
    const data = snap.data() ?? {};
    emails = parseList(data.emails);
    admins = parseList(data.admins);
    if (admins.length === 0 && emails[0]) admins = [emails[0]];
  } catch {
    return cache?.config ?? { emails: [], admins: [] };
  }
  const config = { emails, admins };
  cache = { at: Date.now(), config };
  return config;
}

export function clearAdminsCache() {
  cache = null;
}

export async function adminEmails(): Promise<string[]> {
  return (await readConfig()).emails;
}

export async function adminRoleEmails(): Promise<string[]> {
  return (await readConfig()).admins;
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return (await adminEmails()).includes(normalizeEmail(email));
}

export async function isAdminRoleEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return (await adminRoleEmails()).includes(normalizeEmail(email));
}

async function writeAdmins(emails: string[], admins: string[]) {
  await fsdb().doc(ADMINS_DOC).set({ emails, admins, updated_at: new Date().toISOString() });
  clearAdminsCache();
}

export async function addAdminEmail(email: string): Promise<string[]> {
  const e = normalizeEmail(email);
  if (!EMAIL_RE.test(e)) throw new Error("Enter a valid email address.");
  const { emails, admins } = await readConfig();
  if (emails.includes(e)) throw new Error("This email is already an admin.");
  const next = [...emails, e];
  await writeAdmins(next, admins);
  return next;
}

export async function removeAdminEmail(email: string): Promise<string[]> {
  const e = normalizeEmail(email);
  const { emails, admins } = await readConfig();
  if (admins.includes(e)) throw new Error("An admin cannot be removed.");
  const next = emails.filter((x) => x !== e);
  if (next.length === emails.length) throw new Error("This email is not an admin.");
  await writeAdmins(next, admins);
  return next;
}
