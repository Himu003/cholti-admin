import { getHeroStyle, listSlides } from "@/lib/repo";
import HeroManager from "./HeroManager";
import { requireAdmin, formControls } from "@/lib/admins";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  await requireAdmin();
  const [style, slides] = await Promise.all([getHeroStyle(), listSlides()]);
  return <HeroManager style={style} slides={slides} forms={await formControls()} />;
}
