"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { fsdb } from "@/lib/firebase";

export async function setUserDisabled(uid: string, disabled: boolean) {
  await requireAdmin();
  await fsdb().doc(`users/${uid}`).set({ disabled, updated_at: new Date().toISOString() }, { merge: true });
  revalidatePath("/users");
}

async function wipeCollection(path: string) {
  const snap = await fsdb().collection(path).limit(500).get();
  if (snap.empty) return;
  const batch = fsdb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteUser(uid: string) {
  await requireAdmin();
  await wipeCollection(`users/${uid}/orders`);
  await wipeCollection(`users/${uid}/purchased`);
  const revs = await fsdb().collection("product_reviews").where("uid", "==", uid).limit(200).get();
  if (!revs.empty) {
    const batch = fsdb().batch();
    revs.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await fsdb().doc(`users/${uid}`).delete();
  revalidatePath("/users");
}
