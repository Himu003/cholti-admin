"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { maxSortOrder, putDoc, deleteDoc, setSetting } from "@/lib/repo";
import { fsdb } from "@/lib/firebase";
import { pokeShop } from "@/lib/shop";

const CategorySchema = z.object({
  id: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(80),
  bn: z.string().trim().max(80).default(""),
  img: z.string().trim().max(500).default(""),
  count_label: z.string().trim().max(40).default(""),
  badge: z.string().trim().max(30).nullish().transform((v) => v || null),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

export async function saveCategory(input: z.input<typeof CategorySchema>) {
  await requireAdmin();
  const c = CategorySchema.parse(input);
  const exists = (await fsdb().doc(`categories/${c.id}`).get()).exists;
  const data = { name: c.name, bn: c.bn, img: c.img, count_label: c.count_label, badge: c.badge, active: c.active };
  if (exists) {
    await putDoc("categories", c.id, data);
  } else {
    await putDoc("categories", c.id, { ...data, sort_order: (await maxSortOrder("categories")) + 1 });
  }
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", `/shop/${c.id}`]);
}

export async function toggleCategory(id: string, active: number) {
  await requireAdmin();
  await putDoc("categories", id, { active: active ? 1 : 0 });
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", `/shop/${id}`]);
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const subs = await fsdb().collection("subcategories").where("cat", "==", id).limit(1).get();
  if (!subs.empty) throw new Error("This category has subcategories. Delete them first.");
  const prods = await fsdb().collection("products").where("cat", "==", id).limit(1).get();
  if (!prods.empty) throw new Error("This category has products. Move or delete them first.");
  await deleteDoc("categories", id);
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", `/shop/${id}`]);
}

const ReviewSchema = z.object({
  text: z.string().trim().min(1).max(300),
  name: z.string().trim().min(1).max(60),
  area: z.string().trim().max(60).default(""),
});

export async function addReview(input: z.input<typeof ReviewSchema>) {
  await requireAdmin();
  const r = ReviewSchema.parse(input);
  const id = `r-${Date.now().toString(36)}`;
  await putDoc("reviews", id, { text: r.text, name: r.name, area: r.area, active: 1 });
  revalidatePath("/reviews");
  await pokeShop(["/"]);
}

export async function toggleReview(id: string, active: number) {
  await requireAdmin();
  await putDoc("reviews", id, { active: active ? 1 : 0 });
  revalidatePath("/reviews");
  await pokeShop(["/"]);
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await deleteDoc("reviews", id);
  revalidatePath("/reviews");
  await pokeShop(["/"]);
}

const SettingsSchema = z.object({
  wa_number: z.string().trim().regex(/^8801[3-9]\d{8}$/, "Format: 8801XXXXXXXXX"),
  hotline: z.string().trim().min(1).max(20),
  email: z.string().trim().email().max(80),
  address_en: z.string().trim().max(200).default(""),
  address_bn: z.string().trim().max(200).default(""),
  font_scale: z.enum(["90", "100", "112", "125"]).default("100"),
});

export async function saveSettings(input: z.input<typeof SettingsSchema>) {
  await requireAdmin();
  const s = SettingsSchema.parse(input);
  await setSetting("wa_number", s.wa_number);
  await setSetting("hotline", s.hotline);
  await setSetting("email", s.email);
  await setSetting("address_en", s.address_en);
  await setSetting("address_bn", s.address_bn);
  await setSetting("font_scale", s.font_scale);
  revalidatePath("/settings");
  await pokeShop(["/"]);
}

const ContactSchema = SettingsSchema.omit({ font_scale: true });

export async function saveContact(input: z.input<typeof ContactSchema>) {
  await requireAdmin();
  const s = ContactSchema.parse(input);
  await setSetting("wa_number", s.wa_number);
  await setSetting("hotline", s.hotline);
  await setSetting("email", s.email);
  await setSetting("address_en", s.address_en);
  await setSetting("address_bn", s.address_bn);
  revalidatePath("/settings");
  await pokeShop(["/"]);
}

export async function saveDisplay(font_scale: string) {
  await requireAdmin();
  const s = z.enum(["90", "100", "112", "125"]).parse(font_scale);
  await setSetting("font_scale", s);
  revalidatePath("/settings");
  await pokeShop(["/"]);
}

export async function saveNav(grouped: boolean) {
  await requireAdmin();
  await setSetting("nav_grouped", grouped ? "1" : "0");
  revalidatePath("/settings");
}

const BrandSchema = z.object({
  title_en: z.string().trim().min(1).max(120),
  title_bn: z.string().trim().min(1).max(120),
  text_en: z.string().trim().min(1).max(1000),
  text_bn: z.string().trim().min(1).max(1000),
  img: z.string().trim().max(500).default(""),
  points_en: z.array(z.string().trim().max(60)).max(6).default([]),
  points_bn: z.array(z.string().trim().max(60)).max(6).default([]),
});

export async function saveBrand(input: z.input<typeof BrandSchema>) {
  await requireAdmin();
  const b = BrandSchema.parse(input);
  await putDoc("content", "brand", {
    title_en: b.title_en, title_bn: b.title_bn,
    text_en: b.text_en, text_bn: b.text_bn, img: b.img,
    points_en: b.points_en.filter(Boolean), points_bn: b.points_bn.filter(Boolean),
  });
  revalidatePath("/brand");
  await pokeShop(["/", "/about"]);
}

const AboutSchema = z.object({
  title_en: z.string().trim().min(1).max(120),
  title_bn: z.string().trim().min(1).max(120),
  body_en: z.string().trim().min(1).max(3000),
  body_bn: z.string().trim().min(1).max(3000),
});

export async function saveAbout(input: z.input<typeof AboutSchema>) {
  await requireAdmin();
  const a = AboutSchema.parse(input);
  await putDoc("content", "about", {
    title_en: a.title_en, title_bn: a.title_bn,
    body_en: a.body_en, body_bn: a.body_bn,
  });
  revalidatePath("/brand");
  await pokeShop(["/", "/about"]);
}

const FaqSchema = z.object({
  id: z.string().max(40).default(""),
  q_en: z.string().trim().min(1).max(300),
  a_en: z.string().trim().min(1).max(600),
  q_bn: z.string().trim().max(300).default(""),
  a_bn: z.string().trim().max(600).default(""),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

export async function saveFaq(input: z.input<typeof FaqSchema>) {
  await requireAdmin();
  const f = FaqSchema.parse(input);
  const id = f.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || `f-${Date.now().toString(36)}`;
  const data = { q_en: f.q_en, a_en: f.a_en, q_bn: f.q_bn, a_bn: f.a_bn, active: f.active };
  const exists = (await fsdb().doc(`faqs/${id}`).get()).exists;
  if (exists) {
    await putDoc("faqs", id, data);
  } else {
    await putDoc("faqs", id, { ...data, sort_order: (await maxSortOrder("faqs")) + 1 });
  }
  revalidatePath("/faqs");
  await pokeShop(["/"]);
}

export async function toggleFaq(id: string, active: number) {
  await requireAdmin();
  await putDoc("faqs", id, { active: active ? 1 : 0 });
  revalidatePath("/faqs");
  await pokeShop(["/"]);
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  await deleteDoc("faqs", id);
  revalidatePath("/faqs");
  await pokeShop(["/"]);
}

const ZoneSchema = z.object({
  id: z.string().max(60).default(""),
  name_en: z.string().trim().min(1).max(60),
  name_bn: z.string().trim().max(60).default(""),
  charge: z.coerce.number().int().min(0).max(10000),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function activeZoneCount(except = ""): Promise<number> {
  const snap = await fsdb().collection("delivery_zones").where("active", "==", 1).get();
  return snap.docs.filter((d) => d.id !== except).length;
}

export async function saveZone(input: z.input<typeof ZoneSchema>) {
  await requireAdmin();
  const z = ZoneSchema.parse(input);
  const id = z.id || slugify(z.name_en);
  if (!id) throw new Error("Name required.");
  const exists = (await fsdb().doc(`delivery_zones/${id}`).get()).exists;
  const data = { name_en: z.name_en.trim(), name_bn: z.name_bn.trim(), charge: z.charge, active: z.active };
  if (exists) {
    if (!z.active && (await activeZoneCount(id)) < 1) throw new Error("At least one delivery area must stay on.");
    await putDoc("delivery_zones", id, data);
  } else {
    await putDoc("delivery_zones", id, { ...data, sort_order: (await maxSortOrder("delivery_zones")) + 1 });
  }
  revalidatePath("/settings");
}

export async function toggleZone(id: string, active: number) {
  await requireAdmin();
  if (!active && (await activeZoneCount(id)) < 1) throw new Error("At least one delivery area must stay on.");
  await putDoc("delivery_zones", id, { active: active ? 1 : 0 });
  revalidatePath("/settings");
}

export async function deleteZone(id: string) {
  await requireAdmin();
  if ((await activeZoneCount(id)) < 1) throw new Error("At least one delivery area must stay on.");
  await deleteDoc("delivery_zones", id);
  revalidatePath("/settings");
}


