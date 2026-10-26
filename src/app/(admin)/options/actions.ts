"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fsdb } from "@/lib/firebase";
import { maxSortOrder, putDoc, deleteDoc } from "@/lib/repo";
import { pokeShop } from "@/lib/shop";
import { requireAdmin } from "@/lib/admins";

const Kind = z.enum(["fabrics", "sizes", "colors"]);

const OptionSchema = z.object({
  kind: Kind,
  id: z.string().max(60).default(""),
  name: z.string().trim().min(1).max(60),
  extra: z.string().trim().max(200).default(""),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

async function pokeOptions() {
  const paths = ["/", "/shop"];
  try {
    const prods = await fsdb().collection("products").select().limit(100).get();
    for (const d of prods.docs) paths.push(`/product/${d.id}`);
  } catch {}
  for (let i = 0; i < paths.length; i += 20) {
    await pokeShop(paths.slice(i, i + 20));
  }
}

export async function saveOption(input: z.input<typeof OptionSchema>) {
  await requireAdmin();
  const o = OptionSchema.parse(input);
  const id = o.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || o.name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60);
  if (!id) throw new Error("Name required.");
  const data: Record<string, unknown> = { name: o.name.trim(), active: o.active };
  if (o.kind === "colors") {
    if (!/^#[0-9a-fA-F]{6}$/.test(o.extra)) throw new Error("Color needs a #rrggbb hex code.");
    data.hex = o.extra;
  }
  if (o.kind === "sizes") {
    data.cats = o.extra.split(",").map((c) => c.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")).filter(Boolean);
  }
  const exists = (await fsdb().doc(`${o.kind}/${id}`).get()).exists;
  if (exists) {
    await putDoc(o.kind, id, data);
  } else {
    await putDoc(o.kind, id, { ...data, sort_order: (await maxSortOrder(o.kind)) + 1 });
  }
  revalidatePath("/options");
  await pokeOptions();
}

export async function toggleOption(kind: string, id: string, active: number) {  await requireAdmin();
  const k = Kind.parse(kind);
  await putDoc(k, id, { active: active ? 1 : 0 });
  revalidatePath("/options");
  await pokeOptions();
}

export async function saveOptionVisibility(kind: string, on: boolean) {
  await requireAdmin();
  const k = Kind.parse(kind);
  await putDoc("config", "options", { [k]: on });
  revalidatePath("/options");
  await pokeOptions();
}

export async function deleteOption(kind: string, id: string) {
  await requireAdmin();
  const k = Kind.parse(kind);
  await deleteDoc(k, id);
  revalidatePath("/options");
  await pokeOptions();
}
