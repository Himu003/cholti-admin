import { countDocs } from "@/lib/repo";
import { getAnalytics } from "@/lib/analytics";
import { requireAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

function Bars({ data, valueKey }: { data: { label: string; views: number; visitors: number }[]; valueKey: "views" | "visitors" }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="flex items-end gap-1.5 h-36">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${d.label}: ${d[valueKey]}`}>
          <div className="w-full rounded bg-neutral-900" style={{ height: `${6 + (d[valueKey] / max) * 104}px` }} />
          <small className="text-neutral-500 text-[10px]">{d.label}</small>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  await requireAdmin();
  const [active, a] = await Promise.all([
    Promise.all([
      countDocs("hero_slides", true),
      countDocs("products", true),
      countDocs("categories", true),
      countDocs("reviews", true),
    ]),
    getAnalytics().catch(() => null),
  ]);
  const [slides, products, categories, reviews] = active;
  const stats = [
    { label: "Hero slides (active)", value: slides },
    { label: "Products (active)", value: products },
    { label: "Categories (active)", value: categories },
    { label: "Reviews (active)", value: reviews },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
            <b className="text-2xl md:text-3xl">{s.value}</b>
            <p className="text-[13px] md:text-sm text-neutral-500 mt-1 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-8 mb-3">
        <h2 className="font-bold">Traffic, last 14 days</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <b className="text-2xl md:text-3xl">{a?.visitorsToday ?? 0}</b>
          <p className="text-[13px] md:text-sm text-neutral-500 mt-1 leading-snug">Visitors today</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <b className="text-2xl md:text-3xl">{a?.viewsToday ?? 0}</b>
          <p className="text-[13px] md:text-sm text-neutral-500 mt-1 leading-snug">Views today</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <b className="text-2xl md:text-3xl">{a?.users ?? 0}</b>
          <p className="text-[13px] md:text-sm text-neutral-500 mt-1 leading-snug">Registered users</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <b className="text-2xl md:text-3xl">{a?.views30d ?? 0}</b>
          <p className="text-[13px] md:text-sm text-neutral-500 mt-1 leading-snug">Views, last 30 days</p>
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 mt-4">
        <b className="text-sm">Daily views</b>
        <div className="mt-3">{a && <Bars data={a.daily} valueKey="views" />}</div>
      </div>
    </div>
  );
}
