import { NextResponse } from "next/server";
import { getHeroStyle, listSlides } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown) =>
  NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=300" } });

function inWindow(starts: unknown, ends: unknown, t: string) {
  if (typeof starts === "string" && starts && t < starts) return false;
  if (typeof ends === "string" && ends && t > ends) return false;
  return true;
}

export async function GET() {
  const [style, all] = await Promise.all([getHeroStyle(), listSlides()]);
  const now = new Date().toISOString();
  const slides = all
    .filter((s) => s.active && inWindow(s.starts_at, s.ends_at, now))
    .map((s) => ({
      id: s.id,
      title_bn: s.title_bn, title_en: s.title_en,
      sub_bn: s.sub_bn, sub_en: s.sub_en,
      eyebrow_bn: s.eyebrow_bn, eyebrow_en: s.eyebrow_en,
      cta_bn: s.cta_bn, cta_en: s.cta_en,
      link: s.link, image: s.image, theme: s.theme,
      badge_bn: s.badge_bn, badge_en: s.badge_en,
    }));
  return json({ style, slides });
}
