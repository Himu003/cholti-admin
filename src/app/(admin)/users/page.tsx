import { fsdb } from "@/lib/firebase";
import UsersManager, { type UserRow } from "./UsersManager";
import { requireAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin();
  const snap = await fsdb().collection("users").limit(200).get();
  const rows: UserRow[] = await Promise.all(
    snap.docs.map(async (d) => {
      const v = d.data() ?? {};
      const orders = await fsdb().collection(`users/${d.id}/orders`).count().get().catch(() => null);
      return {
        id: d.id,
        user_id: String(v.user_id ?? ""),
        name: String(v.name ?? ""),
        email: String(v.email ?? ""),
        photo: String(v.photo ?? ""),
        created_at: String(v.created_at ?? ""),
        disabled: v.disabled === true,
        orders: orders?.data().count ?? 0,
      };
    })
  );
  rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return <UsersManager rows={rows} />;
}
