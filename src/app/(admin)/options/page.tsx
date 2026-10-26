import { fsdb } from "@/lib/firebase";
import { requireAdmin } from "@/lib/admins";
import { getOptionVisibility } from "@/lib/repo";
import OptionsManager, { type OptionRow } from "./OptionsManager";

export const dynamic = "force-dynamic";

async function rowsOf(collection: string): Promise<OptionRow[]> {
  const snap = await fsdb().collection(collection).orderBy("sort_order").get();
  return snap.docs.map((d) => {
    const v = d.data() ?? {};
    return {
      id: d.id,
      name: String(v.name ?? ""),
      extra: collection === "colors" ? String(v.hex ?? "") : Array.isArray(v.cats) ? (v.cats as string[]).join(", ") : "",
      active: Number(v.active ?? 1),
    };
  });
}

export default async function OptionsPage() {
  await requireAdmin();
  const [fabrics, sizes, colors, vis, cats] = await Promise.all([rowsOf("fabrics"), rowsOf("sizes"), rowsOf("colors"), getOptionVisibility(), fsdb().collection("categories").orderBy("sort_order").get().catch(() => null)]);
  const catOpts = (cats?.docs ?? []).map((d) => ({ id: d.id, name: String(d.data()?.name ?? d.id) }));
  return <OptionsManager fabrics={fabrics} sizes={sizes} colors={colors} vis={vis} cats={catOpts} />;
}
