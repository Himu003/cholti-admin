import { NextResponse } from "next/server";
import { fsdb } from "@/lib/firebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown) =>
  NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=300" } });

function clean<T>(docs: FirebaseFirestore.QueryDocumentSnapshot[]): T[] {
  return docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);
}

export async function GET() {
  const byOrder = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) =>
    docs
      .map((d) => ({ order: Number(d.data().sort_order ?? 0), d }))
      .sort((a, b) => a.order - b.order)
      .map((x) => x.d);
  const [products, categories, reviews] = await Promise.all([
    fsdb().collection("products").where("active", "==", 1).get().then((s) => byOrder(s.docs)),
    fsdb().collection("categories").where("active", "==", 1).get().then((s) => byOrder(s.docs)),
    fsdb().collection("reviews").where("active", "==", 1).get().then((s) => s.docs),
  ]);
  return json({
    products: clean(products),
    categories: clean(categories),
    reviews: clean(reviews),
  });
}
