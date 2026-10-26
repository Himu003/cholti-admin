"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fsdb } from "@/lib/firebase";
import { requireAdmin } from "@/lib/admins";

const Status = z.enum(["new", "confirmed", "delivering", "delivered", "cancelled"]);

export async function setOrderStatus(id: string, status: z.input<typeof Status>) {
  await requireAdmin();
  const s = Status.parse(status);
  const ref = fsdb().doc(`orders/${id}`);
  const snap = await ref.get();
  await ref.set({ status: s }, { merge: true });
  const v = snap.data() ?? {};
  if (typeof v.uid === "string" && v.uid && typeof v.user_order_id === "string" && v.user_order_id) {
    await fsdb().doc(`users/${v.uid}/orders/${v.user_order_id}`).set({ status: s }, { merge: true }).catch(() => {});
  }
  revalidatePath("/orders");
}

export async function deleteOrder(id: string) {
  await requireAdmin();
  await fsdb().doc(`orders/${id}`).delete();
  revalidatePath("/orders");
}
