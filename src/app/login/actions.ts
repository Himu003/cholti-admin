"use server";

import { getAuth } from "firebase-admin/auth";
import { fsdb } from "@/lib/firebase";
import { createSession, setSessionCookie, readSessionCookie, validSession } from "@/lib/auth";
import { isAdminEmail, shopHome } from "@/lib/admins";

export type GoogleLoginResult = { ok: true; dest: string } | { ok: false; shop: string };

export async function loginWithGoogle(idToken: string): Promise<GoogleLoginResult> {
  const existing = await validSession(await readSessionCookie());
  if (existing.ok) return { ok: true, dest: "/orders" };
  fsdb();
  let email = "";
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    email = String(decoded.email ?? "");
  } catch {
    return { ok: false, shop: shopHome() };
  }
  if (!(await isAdminEmail(email))) return { ok: false, shop: shopHome() };
  await setSessionCookie(await createSession(email));
  return { ok: true, dest: "/orders" };
}
