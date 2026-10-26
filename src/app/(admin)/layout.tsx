import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAdmin, destroySession, readSessionCookie, clearSessionCookie } from "@/lib/auth";
import { isAdminRole } from "@/lib/admins";
import { getSettings } from "@/lib/repo";
import AdminNav from "./AdminNav";
import AdminShell from "./AdminShell";
async function logout() {
  "use server";
  await destroySession(await readSessionCookie());
  await clearSessionCookie();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const isAdmin = await isAdminRole(email);
  const grouped = (await getSettings().catch((): Record<string, string> => ({}))).nav_grouped !== "0";

  return (
    <AdminShell
      nav={<AdminNav isAdmin={isAdmin} grouped={grouped} />}
      logout={
        <form action={logout}>
          <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-300 hover:bg-white/10">
            <LogOut size={16} />
            Log out
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
