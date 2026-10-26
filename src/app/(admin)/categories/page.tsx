import { fsdb } from "@/lib/firebase";
import CategoriesManager, { type CategoryRow, type SubRow } from "./CategoriesManager";
import { requireAdmin, formControls } from "@/lib/admins";

export const dynamic = "force-dynamic";

function row(d: FirebaseFirestore.DocumentSnapshot): CategoryRow {
  const v = d.data() ?? {};
  return {
    id: d.id,
    name: String(v.name ?? ""),
    bn: String(v.bn ?? ""),
    img: String(v.img ?? ""),
    count_label: String(v.count_label ?? ""),
    badge: (v.badge as string | null) ?? null,
    active: Number(v.active ?? 1),
  };
}

function subRow(d: FirebaseFirestore.DocumentSnapshot): SubRow {
  const v = d.data() ?? {};
  return {
    id: d.id,
    name: String(v.name ?? ""),
    bn: String(v.bn ?? ""),
    cat: String(v.cat ?? ""),
    img: String(v.img ?? ""),
    count_label: String(v.count_label ?? ""),
    badge: (v.badge as string | null) ?? null,
    active: Number(v.active ?? 1),
  };
}

export default async function CategoriesPage() {
  await requireAdmin();
  const [cats, subs] = await Promise.all([
    fsdb().collection("categories").orderBy("sort_order").get(),
    fsdb().collection("subcategories").orderBy("sort_order").get(),
  ]);
  return <CategoriesManager rows={cats.docs.map(row)} subs={subs.docs.map(subRow)} forms={await formControls()} />;
}
