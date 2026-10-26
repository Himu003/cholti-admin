"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { setHeroStyle as storeStyle, listSlides, maxSortOrder, putDoc, deleteDoc, swapSortOrder } from "@/lib/repo";
import { fsdb } from "@/lib/firebase";
import { pokeShop } from "@/lib/shop";

export async function setHeroStyle(style: string) {
  await requireAdmin();
  const s = z.enum(["banner", "boxed"]).parse(style);
  await storeStyle(s);
  revalidatePath("/hero");
  await pokeShop(["/"]);
}

export async function switchStyleForm(formData: FormData) {
  await setHeroStyle(String(formData.get("style") ?? ""));
}

const SlideSchema = z.object({
  id: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  layout: z.enum(["full", "image"]).default("full"),
  bg: z.string().trim().max(20).default(""),
  title_bn: z.string().trim().max(120).default(""),
  title_en: z.string().trim().max(120).default(""),
  sub_bn: z.string().trim().max(300).default(""),
  sub_en: z.string().trim().max(300).default(""),
  eyebrow_bn: z.string().trim().max(60).default(""),
  eyebrow_en: z.string().trim().max(60).default(""),
  cta_bn: z.string().trim().max(40).default(""),
  cta_en: z.string().trim().max(40).default(""),
  link: z.string().trim().max(300).default(""),
  image: z.string().trim().max(500).default(""),
  theme: z.enum(["clay", "forest", "cocoa"]),
  badge_bn: z.string().trim().max(40).default(""),
  badge_en: z.string().trim().max(40).default(""),
  active: z.coerce.number().int().min(0).max(1).default(1),
  starts_at: z.string().trim().max(30).nullish().transform((v) => v || null),
  ends_at: z.string().trim().max(30).nullish().transform((v) => v || null),
});

function fixLink(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (t.startsWith("#") || t.startsWith("/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return `https://${t}`;
  return `/${t.replace(/^\/+/, "")}`;
}

function fixBg(v: string): string {
  const t = v.trim();
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : "";
}

export async function saveSlide(input: z.input<typeof SlideSchema>) {
  await requireAdmin();
  const s = SlideSchema.parse(input);
  if (s.layout !== "image" && (!s.title_bn || !s.title_en)) {
    throw new Error("Title (BN + EN) required for full slides.");
  }
  if (!s.image) throw new Error("Image required.");
  const ref = fsdb().doc(`hero_slides/${s.id}`);
  const exists = (await ref.get()).exists;
  const data = {
    layout: s.layout, bg: fixBg(s.bg),
    title_bn: s.title_bn, title_en: s.title_en,
    sub_bn: s.sub_bn, sub_en: s.sub_en,
    eyebrow_bn: s.eyebrow_bn, eyebrow_en: s.eyebrow_en,
    cta_bn: s.cta_bn, cta_en: s.cta_en,
    link: fixLink(s.link), image: s.image, theme: s.theme,
    badge_bn: s.badge_bn, badge_en: s.badge_en,
    active: s.active, starts_at: s.starts_at, ends_at: s.ends_at,
  };
  if (exists) {
    await putDoc("hero_slides", s.id, data);
  } else {
    await putDoc("hero_slides", s.id, { ...data, sort_order: (await maxSortOrder("hero_slides")) + 1, created_at: new Date().toISOString() });
  }
  revalidatePath("/hero");
  await pokeShop(["/"]);
}

export async function toggleSlide(id: string, active: number) {
  await requireAdmin();
  await putDoc("hero_slides", id, { active: active ? 1 : 0 });
  revalidatePath("/hero");
  await pokeShop(["/"]);
}

export async function deleteSlide(id: string) {
  await requireAdmin();
  await deleteDoc("hero_slides", id);
  revalidatePath("/hero");
  await pokeShop(["/"]);
}

export async function moveSlide(id: string, dir: -1 | 1) {
  await requireAdmin();
  const rows = await listSlides();
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  await swapSortOrder("hero_slides", rows[i].id, rows[i].sort_order, rows[j].id, rows[j].sort_order);
  revalidatePath("/hero");
  await pokeShop(["/"]);
}
