import { fsdb } from "@/lib/firebase";
import ProductForm from "../ProductForm";
import { EMPTY_PRODUCT } from "../ProductsManager";
import { requireAdmin, formControls } from "@/lib/admins";
import { getOptionVisibility } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const [cats, subs, fabrics, sizes, colors, vis] = await Promise.all([
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
  const fabricOpts = vis.fabrics ? opt(fabrics) : [];
  const sizeOpts = vis.sizes ? opt(sizes, (v) => ({ cats: Array.isArray(v.cats) ? v.cats : [] })) : [];
  const colorOpts = vis.colors ? opt(colors, (v) => ({ hex: String(v.hex ?? "") })) : [];
  const firstCat = catOpts[0]?.id ?? "";
  return (
    <ProductForm
      initial={{
        ...EMPTY_PRODUCT,
        cat: firstCat,
        fabricIds: fabricOpts.map((f) => f.id),
        sizeIds: sizeOpts.filter((s) => !(s as { cats?: string[] }).cats?.length || (s as { cats?: string[] }).cats!.includes(firstCat)).map((s) => s.id),
        colorIds: colorOpts.map((c) => c.id),
      }}
      cats={catOpts}
      subs={subOpts}
      fabrics={fabricOpts}
      sizes={sizeOpts}
      colors={colorOpts}
      forms={await formControls()}
      isNew
      origSlug=""
      backHref="/products"
    />
  );
}
