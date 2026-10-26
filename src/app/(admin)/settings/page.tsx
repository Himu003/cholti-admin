import { getSettings } from "@/lib/repo";
import { fsdb } from "@/lib/firebase";
import SettingsTabs from "./SettingsTabs";
import { requireAdmin, isAdminRole, formControls } from "@/lib/admins";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const email = await requireAdmin();
  const owner = await isAdminRole(email);
  const zSnap = await fsdb().collection("delivery_zones").orderBy("sort_order").get().catch(() => null);
  const zones = (zSnap?.docs ?? []).map((d) => {
    const v = d.data() ?? {};
    return {
      id: d.id,
      name_en: String(v.name_en ?? ""),
      name_bn: String(v.name_bn ?? ""),
      charge: Number(v.charge ?? 0),
      active: Number(v.active ?? 1),
    };
  });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Settings</h1>
      <SettingsTabs settings={await getSettings()} forms={await formControls()} showUpload={owner} zones={zones} />
    </div>
  );
}
