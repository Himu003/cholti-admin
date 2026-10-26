import { shopHome } from "./admins";

export async function pokeShop(paths: string[]) {
  const secret = process.env.REVALIDATE_SECRET;
  const configured = (process.env.SHOP_URL ?? "")
    .split(",")
    .map((b) => b.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const bases = configured.length ? configured : [shopHome()];
  if (!secret || !paths.length || !bases.length) return;
  await Promise.all(
    bases.map(async (base) => {
      try {
        const res = await fetch(`${base}/api/revalidate`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-revalidate-secret": secret },
          body: JSON.stringify({ paths: paths.slice(0, 20) }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) console.warn(`[pokeShop] ${base} -> ${res.status}`);
      } catch (e) {
        console.warn(`[pokeShop] ${base} unreachable: ${e instanceof Error ? e.message : e}`);
      }
    })
  );
}
