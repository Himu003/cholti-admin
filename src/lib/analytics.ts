import { fsdb } from "./firebase";
import { countDocs } from "./repo";

export type DayBucket = { label: string; views: number; visitors: number };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(isoDay(d));
  }
  return out;
}

export type AnalyticsSummary = {
  users: number;
  viewsToday: number;
  visitorsToday: number;
  views30d: number;
  daily: DayBucket[];
  weekly: DayBucket[];
  monthly: DayBucket[];
  topPages: { path: string; views: number }[];
};

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const [users, snaps] = await Promise.all([
    countDocs("users", false),
    fsdb().collection("page_views").where("ts", ">=", new Date(Date.now() - 90 * 86400000).toISOString()).orderBy("ts", "desc").limit(3000).get(),
  ]);

  const views = snaps.docs.map((d) => {
    const v = d.data() as { path?: unknown; sid?: unknown; ts?: unknown };
    return {
      path: typeof v.path === "string" ? v.path : "/",
      sid: typeof v.sid === "string" ? v.sid : "?",
      day: typeof v.ts === "string" ? v.ts.slice(0, 10) : "",
    };
  });

  const bucket = (days: string[]): DayBucket[] =>
    days.map((day) => {
      const inDay = views.filter((v) => v.day === day);
      return { label: day.slice(5), views: inDay.length, visitors: new Set(inDay.map((v) => v.sid)).size };
    });

  const days14 = lastDays(14);
  const daily = bucket(days14);

  const weekly: DayBucket[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const inWeek = views.filter((v) => v.day >= isoDay(start) && v.day <= isoDay(end));
    weekly.push({
      label: isoDay(start).slice(5),
      views: inWeek.length,
      visitors: new Set(inWeek.map((v) => v.sid)).size,
    });
  }

  const monthly: DayBucket[] = [];
  const now = new Date();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const prefix = d.toISOString().slice(0, 7);
    const inMonth = views.filter((v) => v.day.startsWith(prefix));
    monthly.push({
      label: prefix.slice(2),
      views: inMonth.length,
      visitors: new Set(inMonth.map((v) => v.sid)).size,
    });
  }

  const today = isoDay(new Date());
  const todayViews = views.filter((v) => v.day === today);
  const last30 = views.filter((v) => v.day >= isoDay(new Date(Date.now() - 29 * 86400000)));

  const pageCounts = new Map<string, number>();
  for (const v of views) pageCounts.set(v.path, (pageCounts.get(v.path) ?? 0) + 1);
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, viewCount]) => ({ path, views: viewCount }));

  return {
    users,
    viewsToday: todayViews.length,
    visitorsToday: new Set(todayViews.map((v) => v.sid)).size,
    views30d: last30.length,
    daily,
    weekly,
    monthly,
    topPages,
  };
}
