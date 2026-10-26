import { fsdb } from "@/lib/firebase";
import FaqsManager, { type FaqRow } from "./FaqsManager";
import { requireAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

function row(d: FirebaseFirestore.DocumentSnapshot): FaqRow {
  const v = d.data() ?? {};
  return {
    id: d.id,
    q_en: String(v.q_en ?? ""),
    a_en: String(v.a_en ?? ""),
    q_bn: String(v.q_bn ?? ""),
    a_bn: String(v.a_bn ?? ""),
    active: Number(v.active ?? 1),
  };
}

export default async function FaqsPage() {
  await requireAdmin();
  const snap = await fsdb().collection("faqs").orderBy("sort_order").get();
  return <FaqsManager rows={snap.docs.map(row)} />;
}
