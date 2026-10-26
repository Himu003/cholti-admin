"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { maxSortOrder, putDoc, deleteDoc } from "@/lib/repo";
import { fsdb } from "@/lib/firebase";
import { pokeShop } from "@/lib/shop";

const ProductSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  from: z.string().trim().max(80).default(""),
  name: z.string().trim().min(1).max(160),
  bn: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2000).default(""),
  cat: z.string().min(1).max(40),
  sub: z.string().trim().max(80).default(""),
  fabricIds: z.array(z.string().trim().max(60)).max(30).default([]),
  sizeIds: z.array(z.string().trim().max(60)).max(30).default([]),
  colorIds: z.array(z.string().trim().max(60)).max(30).default([]),
  best: z.coerce.number().int().min(0).max(1).default(0),
  hot: z.coerce.number().int().min(0).max(1).default(0),
  old: z.coerce.number().int().min(0),
  now: z.coerce.number().int().min(0),
  rating: z.string().trim().max(40).default(""),
  image: z.string().trim().max(500).default(""),
  imgs: z.array(z.string().trim().max(500)).max(10).default([]),
  badge: z.string().trim().max(30).nullish().transform((v) => v || null),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

export async function saveProduct(input: z.input<typeof ProductSchema>) {
  try {
    await requireAdmin();
    const p = ProductSchema.parse(input);
    const catSnap = await fsdb().doc(`categories/${p.cat}`).get();
    if (!catSnap.exists) throw new Error("Category not found. Save the category first.");
    if (p.sub) {
      const subSnap = await fsdb().doc(`subcategories/${p.sub}`).get();
      if (!subSnap.exists) throw new Error("Subcategory not found.");
      if (subSnap.data()?.cat !== p.cat) throw new Error("Subcategory does not belong to this category.");
    }
    if (p.now >= p.old) throw new Error("Sale price must be below old price.");
    const off = Math.round(((p.old - p.now) / p.old) * 100);
    const urls = [...new Set([...p.imgs, p.image].map((u) => u.trim()).filter(Boolean))].slice(0, 10);
    const data = {
      name: p.name, bn: p.bn, cat: p.cat, sub: p.sub,
      description: p.description,
      fabricIds: p.fabricIds, sizeIds: p.sizeIds, colorIds: p.colorIds,
      tags: [...(p.best ? ["best"] : []), ...(p.hot ? ["hot"] : [])],
      old: p.old, now: p.now, off,
      rating: p.rating, img: urls[0] ?? "", imgs: urls,
      badge: p.badge, active: p.active,
    };
    const exists = (await fsdb().doc(`products/${p.slug}`).get()).exists;
    const renamed = p.from && p.from !== p.slug;
    if (renamed && exists) throw new Error("That route is already used by another product.");
    let keepOrder: number | null = null;
    if (renamed) {
      const prev = await fsdb().doc(`products/${p.from}`).get();
      if (prev.exists) keepOrder = Number(prev.data()?.sort_order ?? -1);
    }
    if (exists) {
      await putDoc("products", p.slug, data);
    } else {
      await putDoc("products", p.slug, { ...data, sort_order: keepOrder !== null && keepOrder >= 0 ? keepOrder : (await maxSortOrder("products")) + 1 });
    }
    if (renamed) {
      await deleteDoc("products", p.from);
    }
    revalidatePath("/products");
    await pokeShop(["/", "/shop", "/shop/offers", `/product/${p.slug}`, `/shop/${p.cat}`, ...(p.sub ? [`/shop/${p.cat}/${p.sub}`] : [])]);
  } catch (e) {
    console.error("[saveProduct] failed:", e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : String(e).slice(0, 100));
    throw e;
  }
}

export async function toggleProduct(slug: string, active: number) {
  await requireAdmin();
  await putDoc("products", slug, { active: active ? 1 : 0 });
  revalidatePath("/products");
  await pokeShop(["/", "/shop", "/shop/offers", `/product/${slug}`, ...(await catsOf([slug]))]);
}

export async function deleteProduct(slug: string) {
  await requireAdmin();
  const cats = await catsOf([slug]);
  await deleteDoc("products", slug);
  revalidatePath("/products");
  await pokeShop(["/", "/shop", "/shop/offers", `/product/${slug}`, ...cats]);
}

async function catsOf(slugs: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const slug of slugs) {
    const snap = await fsdb().doc(`products/${slug}`).get();
    const cat = snap.data()?.cat;
    const sub = snap.data()?.sub;
    if (typeof cat === "string" && cat) {
      out.push(`/shop/${cat}`);
      if (typeof sub === "string" && sub) out.push(`/shop/${cat}/${sub}`);
    }
  }
  return out;
}
