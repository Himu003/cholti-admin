import { fsdb } from "@/lib/firebase";
import ReviewsManager, { type ReviewRow } from "./ReviewsManager";
import { requireAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

function row(d: FirebaseFirestore.DocumentSnapshot): ReviewRow {
  const v = d.data() ?? {};
  return {
    id: d.id,
    text: String(v.text ?? ""),
    name: String(v.name ?? ""),
    area: String(v.area ?? ""),
    active: Number(v.active ?? 1),
  };
}

export default async function ReviewsPage() {
  await requireAdmin();
  const snap = await fsdb().collection("reviews").get();
  return <ReviewsManager rows={snap.docs.map(row)} />;
}
