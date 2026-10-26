"use server";

import { revalidatePath } from "next/cache";
import { fsdb } from "@/lib/firebase";
import { requireAdminRole, clearFormCache } from "@/lib/admins";

export async function saveFormControls(partial: { imageUrl?: boolean; upload?: boolean; smartUpload?: boolean; highQuality?: boolean }) {
  await requireAdminRole();
  const cur = await fsdb().doc("config/forms").get();
  const prev = cur.data() ?? {};
  const clean = {
    imageUrl: typeof partial.imageUrl === "boolean" ? partial.imageUrl : prev.imageUrl !== false,
    upload: typeof partial.upload === "boolean" ? partial.upload : prev.upload !== false,
    smartUpload: typeof partial.smartUpload === "boolean" ? partial.smartUpload : prev.smartUpload === true,
    highQuality: typeof partial.highQuality === "boolean" ? partial.highQuality : prev.highQuality === true,
  };
  await fsdb().doc("config/forms").set(clean);
  clearFormCache();
  revalidatePath("/settings");
}
