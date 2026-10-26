import { notFound } from "next/navigation";
import { fsdb } from "@/lib/firebase";
import ProductForm from "../ProductForm";
import type { ProductRow } from "../ProductsManager";
import { requireAdmin, formControls } from "@/lib/admins";
import { getOptionVisibility } from "@/lib/repo";

export const dynamic = "force-dynamic";

function row(id: string, v: FirebaseFirestore.DocumentData): ProductRow {
  return {
    slug: id,
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

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const [snap, cats, subs, fabrics, sizes, colors, vis] = await Promise.all([
    fsdb().doc(`products/${slug}`).get(),
    fsdb().collection("categories").orderBy("sort_order").get(),
    fsdb().collection("subcategories").orderBy("sort_order").get(),
    fsdb().collection("fabrics").orderBy("sort_order").get().catch(() => null),
    fsdb().collection("sizes").orderBy("sort_order").get().catch(() => null),
    fsdb().collection("colors").orderBy("sort_order").get().catch(() => null),
    getOptionVisibility(),
  ]);
  if (!snap.exists) notFound();
  const data = snap.data() ?? {};
  const catOpts = cats.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id) }));
  const subOpts = subs.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id), cat: String(d.data()?.cat ?? "") }));
  const opt = (s: FirebaseFirestore.QuerySnapshot | null, extra?: (v: FirebaseFirestore.DocumentData) => Record<string, unknown>) =>
    (s?.docs ?? []).map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id), ...(extra?.(d.data()) ?? {}) }));
  const fabricOpts = vis.fabrics ? opt(fabrics) : [];
  const sizeOpts = vis.sizes ? opt(sizes, (v) => ({ cats: Array.isArray(v.cats) ? v.cats : [] })) : [];
  const colorOpts = vis.colors ? opt(colors, (v) => ({ hex: String(v.hex ?? "") })) : [];
  const initial = row(snap.id, data);
  if (!Array.isArray(data.fabricIds)) initial.fabricIds = fabricOpts.map((f) => f.id);
  if (!Array.isArray(data.sizeIds)) {
    initial.sizeIds = sizeOpts
      .filter((s) => !(s as { cats?: string[] }).cats?.length || (s as { cats?: string[] }).cats!.includes(initial.cat))
      .map((s) => s.id);
  }
  if (!Array.isArray(data.colorIds)) initial.colorIds = colorOpts.map((c) => c.id);
  return (
    <ProductForm
      initial={initial}
      cats={catOpts}
      subs={subOpts}
      fabrics={fabricOpts}
      sizes={sizeOpts}
      colors={colorOpts}
      forms={await formControls()}
      isNew={false}
      origSlug={snap.id}
      backHref="/products"
    />
  );
}
