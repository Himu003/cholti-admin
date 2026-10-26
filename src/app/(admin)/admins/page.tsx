import { adminEmails, adminRoleEmails, requireAdminRole } from "@/lib/admins";
import { toAdminRows } from "@/lib/allowlist";
import AdminsManager from "./AdminsManager";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireAdminRole();
  const rows = toAdminRows(await adminEmails(), await adminRoleEmails());
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admins</h1>
      <p className="text-sm text-neutral-500 mb-4">
        Admins can manage this page. Anyone you add here becomes a sub admin.
      </p>
      <AdminsManager rows={rows} />
    </div>
  );
}
