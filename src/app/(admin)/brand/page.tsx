import { fsdb } from "@/lib/firebase";
import BrandPanel, { type BrandRow } from "./BrandManager";
import { requireAdmin, formControls } from "@/lib/admins";
import { DEFAULT_BRAND } from "@/lib/content-defaults";

export const dynamic = "force-dynamic";

function strList(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : [];
}

export default async function BrandPage() {
  await requireAdmin();
  const bSnap = await fsdb().doc("content/brand").get().catch(() => null);
  const b = bSnap?.data() ?? {};
  const brand: BrandRow = {
    title_en: String(b.title_en ?? DEFAULT_BRAND.title_en),
    title_bn: String(b.title_bn ?? DEFAULT_BRAND.title_bn),
    text_en: String(b.text_en ?? DEFAULT_BRAND.text_en),
    text_bn: String(b.text_bn ?? DEFAULT_BRAND.text_bn),
    img: String(b.img ?? DEFAULT_BRAND.img),
    points_en: strList(b.points_en).length ? strList(b.points_en) : [...DEFAULT_BRAND.points_en],
    points_bn: strList(b.points_bn).length ? strList(b.points_bn) : [...DEFAULT_BRAND.points_bn],
  };
  return <BrandPanel brand={brand} forms={await formControls()} />;
}
