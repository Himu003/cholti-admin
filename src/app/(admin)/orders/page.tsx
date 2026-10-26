import { fsdb } from "@/lib/firebase";
import { requireAdmin, shopHome } from "@/lib/admins";
import OrdersManager, { type OrderRow } from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireAdmin();
  const snap = await fsdb().collection("orders").orderBy("created_at", "desc").limit(100).get();
  const rows: OrderRow[] = snap.docs.map((d) => {
    const v = d.data() ?? {};
    return {
      id: d.id,
      items: Array.isArray(v.items) ? v.items : [],
      subtotal: Number(v.subtotal ?? 0),
      delivery: Number(v.delivery ?? 0),
      total: Number(v.total ?? 0),
      name: String(v.name ?? ""),
      phone: String(v.phone ?? ""),
      address: String(v.address ?? ""),
      email: String(v.email ?? ""),
      user_id: String(v.user_id ?? ""),
      photo: String(v.photo ?? ""),
      status: String(v.status ?? "new"),
      created_at: String(v.created_at ?? ""),
    };
  });
  return <OrdersManager rows={rows} shopBase={shopHome()} />;
}
