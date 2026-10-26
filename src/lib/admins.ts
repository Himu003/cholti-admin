import { redirect } from "next/navigation";
import { fsdb } from "./firebase";
import { requireAdmin } from "./auth";
import { adminEmails, adminRoleEmails, isAdminEmail, isAdminRoleEmail } from "./allowlist";

export { requireAdmin, adminEmails, adminRoleEmails, isAdminEmail, isAdminRoleEmail };

export async function isAdminRole(email: string): Promise<boolean> {
  return isAdminRoleEmail(email);
}

export function shopHome(): string {
  const first = (process.env.SHOP_URL ?? "").split(",")[0]?.trim().replace(/\/+$/, "");
  return first || "https://choltihomedecor.vercel.app";
}

export type FormControls = { imageUrl: boolean; upload: boolean; smartUpload: boolean; highQuality: boolean };

let formCache: { at: number; controls: FormControls } | null = null;

export function clearFormCache() {
  formCache = null;
}

export async function formControls(): Promise<FormControls> {
  if (formCache && Date.now() - formCache.at < 60_000) return formCache.controls;
  try {
    const snap = await fsdb().doc("config/forms").get();
    const v = snap.data() ?? {};
    const controls: FormControls = {
      imageUrl: v.imageUrl !== false,
      upload: v.upload !== false,
      smartUpload: v.smartUpload === true,
      highQuality: v.highQuality === true,
    };
    formCache = { at: Date.now(), controls };
    return controls;
  } catch {
    return formCache?.controls ?? { imageUrl: true, upload: true, smartUpload: false, highQuality: false };
  }
}

export async function requireAdminRole(): Promise<string> {
  const email = await requireAdmin();
  if (await isAdminRole(email)) return email;
  redirect("/orders");
}
