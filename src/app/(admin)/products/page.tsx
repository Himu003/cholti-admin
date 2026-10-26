import { fsdb } from "@/lib/firebase";
import ProductsManager, { type ProductRow } from "./ProductsManager";
import { requireAdmin, formControls } from "@/lib/admins";
import { getOptionVisibility } from "@/lib/repo";

export const dynamic = "force-dynamic";

function row(d: FirebaseFirestore.DocumentSnapshot): ProductRow {
  const v = d.data() ?? {};
  return {
    slug: d.id,
    name: String(v.name ?? ""),
    bn: String(v.bn ?? ""),
    cat: String(v.cat ?? ""),
    sub: String(v.sub ?? ""),
    tags: Array.isArray(v.tags) ? (v.tags as string[]) : [],
    old: Number(v.old ?? 0),
    now: Number(v.now ?? 0),
    off: Number(v.off ?? 0),
    rating: String(v.rating ?? ""),
    img: String(v.img ?? ""),
    imgs: Array.isArray(v.imgs) ? (v.imgs as string[]).filter((x) => typeof x === "string") : v.img ? [String(v.img)] : [],
    badge: (v.badge as string | null) ?? null,
    active: Number(v.active ?? 1),
    description: String(v.description ?? ""),
    fabricIds: Array.isArray(v.fabricIds) ? (v.fabricIds as string[]) : [],
    sizeIds: Array.isArray(v.sizeIds) ? (v.sizeIds as string[]) : [],
    colorIds: Array.isArray(v.colorIds) ? (v.colorIds as string[]) : [],
  };
}

export default async function ProductsPage() {
  await requireAdmin();
  const [prods, cats, subs, fabrics, sizes, colors, vis] = await Promise.all([
    fsdb().collection("products").orderBy("sort_order").get(),
    fsdb().collection("categories").orderBy("sort_order").get(),
    fsdb().collection("subcategories").orderBy("sort_order").get(),
    fsdb().collection("fabrics").orderBy("sort_order").get().catch(() => null),
    fsdb().collection("sizes").orderBy("sort_order").get().catch(() => null),
    fsdb().collection("colors").orderBy("sort_order").get().catch(() => null),
    getOptionVisibility(),
  ]);
  const catOpts = cats.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id) }));
  const subOpts = subs.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id), cat: String(d.data()?.cat ?? "") }));
  const opt = (snap: FirebaseFirestore.QuerySnapshot | null, extra?: (v: FirebaseFirestore.DocumentData) => Record<string, unknown>) =>
    (snap?.docs ?? []).map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id), ...(extra?.(d.data()) ?? {}) }));
  return (
    <ProductsManager
      rows={prods.docs.map(row)}
      cats={catOpts}
      subs={subOpts}
      forms={await formControls()}
      fabrics={vis.fabrics ? opt(fabrics) : []}
      sizes={vis.sizes ? opt(sizes, (v) => ({ cats: Array.isArray(v.cats) ? v.cats : [] })) : []}
      colors={vis.colors ? opt(colors, (v) => ({ hex: String(v.hex ?? "") })) : []}
    />
  );
}
