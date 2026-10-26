"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { maxSortOrder, putDoc, deleteDoc } from "@/lib/repo";
import { fsdb } from "@/lib/firebase";
import { pokeShop } from "@/lib/shop";

const SubcategorySchema = z.object({
  id: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(80),
  bn: z.string().trim().max(80).default(""),
  cat: z.string().min(1).max(40),
  img: z.string().trim().max(500).default(""),
  count_label: z.string().trim().max(40).default(""),
  badge: z.string().trim().max(30).nullish().transform((v) => v || null),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

async function assertParentCat(cat: string) {
  const snap = await fsdb().doc(`categories/${cat}`).get();
  if (!snap.exists) throw new Error("Parent category not found. Save the category first.");
}

export async function saveSubcategory(input: z.input<typeof SubcategorySchema>) {
  await requireAdmin();
  const s = SubcategorySchema.parse(input);
  await assertParentCat(s.cat);
  const data = { name: s.name, bn: s.bn, cat: s.cat, img: s.img, count_label: s.count_label, badge: s.badge, active: s.active };
  const exists = (await fsdb().doc(`subcategories/${s.id}`).get()).exists;
  if (exists) {
    await putDoc("subcategories", s.id, data);
  } else {
    await putDoc("subcategories", s.id, { ...data, sort_order: (await maxSortOrder("subcategories")) + 1 });
  }
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", `/shop/${s.cat}`, `/shop/${s.cat}/${s.id}`]);
}

export async function toggleSubcategory(id: string, active: number) {
  await requireAdmin();
  const snap = await fsdb().doc(`subcategories/${id}`).get();
  const cat = snap.data()?.cat;
  await putDoc("subcategories", id, { active: active ? 1 : 0 });
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", ...(typeof cat === "string" && cat ? [`/shop/${cat}`, `/shop/${cat}/${id}`] : [])]);
}

export async function deleteSubcategory(id: string) {
  await requireAdmin();
  const snap = await fsdb().doc(`subcategories/${id}`).get();
  const cat = snap.data()?.cat;
  const used = await fsdb().collection("products").where("sub", "==", id).limit(1).get();
  if (!used.empty) throw new Error("This subcategory has products. Move or delete them first.");
  await deleteDoc("subcategories", id);
  revalidatePath("/categories");
  await pokeShop(["/", "/shop", ...(typeof cat === "string" && cat ? [`/shop/${cat}`, `/shop/${cat}/${id}`] : [])]);
}
