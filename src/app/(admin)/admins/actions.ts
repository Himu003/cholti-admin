"use server";

import { revalidatePath } from "next/cache";
import { adminRoleEmails, requireAdminRole } from "@/lib/admins";
import { addAdminEmail, removeAdminEmail, toAdminRows, type AdminRow } from "@/lib/allowlist";

export type { AdminRow };

export async function addAdmin(email: string): Promise<AdminRow[]> {
  await requireAdminRole();
  const next = await addAdminEmail(email);
  revalidatePath("/admins");
  return toAdminRows(next, await adminRoleEmails());
}

export async function removeAdmin(email: string): Promise<AdminRow[]> {
  await requireAdminRole();
  const next = await removeAdminEmail(email);
  revalidatePath("/admins");
  return toAdminRows(next, await adminRoleEmails());
}
