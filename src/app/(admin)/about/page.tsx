import { fsdb } from "@/lib/firebase";
import { AboutPanel, type AboutRow } from "../brand/BrandManager";
import { requireAdmin } from "@/lib/admins";
import { DEFAULT_ABOUT } from "@/lib/content-defaults";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  await requireAdmin();
  const aSnap = await fsdb().doc("content/about").get().catch(() => null);
  const a = aSnap?.data() ?? {};
  const about: AboutRow = {
    title_en: String(a.title_en ?? DEFAULT_ABOUT.title_en),
    title_bn: String(a.title_bn ?? DEFAULT_ABOUT.title_bn),
    body_en: String(a.body_en ?? DEFAULT_ABOUT.body_en),
    body_bn: String(a.body_bn ?? DEFAULT_ABOUT.body_bn),
  };
  return <AboutPanel about={about} />;
}
