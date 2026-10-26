import { fsdb } from "./firebase";
import type { SlideRow } from "./types";

const now = () => new Date().toISOString();

function doc<T>(snap: FirebaseFirestore.DocumentSnapshot): T {
  return { ...snap.data(), id: snap.id } as T;
}

export async function countDocs(collection: string, activeOnly = false): Promise<number> {
  let q: FirebaseFirestore.Query = fsdb().collection(collection);
  if (activeOnly) q = q.where("active", "==", 1);
  const snap = await q.count().get();
  return snap.data().count;
}

export async function getHeroStyle(): Promise<string> {
  const snap = await fsdb().doc("hero_config/main").get();
  return (snap.data()?.style as string) ?? "banner";
}

export async function setHeroStyle(style: string) {
  await fsdb().doc("hero_config/main").set({ style }, { merge: true });
}

export async function listSlides(): Promise<SlideRow[]> {
  const snap = await fsdb().collection("hero_slides").get();
  return snap.docs
    .map(doc<SlideRow>)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

export async function maxSortOrder(collection: string): Promise<number> {
  const snap = await fsdb().collection(collection).orderBy("sort_order", "desc").limit(1).get();
  if (snap.empty) return -1;
  return Number(snap.docs[0].data().sort_order ?? -1);
}

export async function putDoc(collection: string, id: string, data: Record<string, unknown>) {
  await fsdb().doc(`${collection}/${id}`).set({ ...data, updated_at: now() }, { merge: true });
}

export async function deleteDoc(collection: string, id: string) {
  await fsdb().doc(`${collection}/${id}`).delete();
}

export async function swapSortOrder(collection: string, aId: string, aOrder: number, bId: string, bOrder: number) {
  const batch = fsdb().batch();
  batch.update(fsdb().doc(`${collection}/${aId}`), { sort_order: bOrder, updated_at: now() });
  batch.update(fsdb().doc(`${collection}/${bId}`), { sort_order: aOrder, updated_at: now() });
  await batch.commit();
}

export async function getOptionVisibility(): Promise<{ fabrics: boolean; sizes: boolean; colors: boolean }> {
  try {
    const snap = await fsdb().doc("config/options").get();
    const v = snap.data() ?? {};
    return {
      fabrics: v.fabrics !== false,
      sizes: v.sizes !== false,
      colors: v.colors !== false,
    };
  } catch {
    return { fabrics: true, sizes: true, colors: true };
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  const snap = await fsdb().collection("settings").get();
  const out: Record<string, string> = {};
  snap.docs.forEach((d) => {
    out[d.id] = String(d.data().value ?? "");
  });
  return out;
}

export async function setSetting(key: string, value: string) {
  await fsdb().doc(`settings/${key}`).set({ value });
}

export async function createSession(tokenHash: string, expiresAt: number, email: string) {
  sessionCache.delete(tokenHash);
  await fsdb().doc(`sessions/${tokenHash}`).set({ expires_at: expiresAt, email });
}

const sessionCache = new Map<string, { at: number; ok: boolean; email: string }>();
const SESSION_OK_TTL = 60_000;
const SESSION_BAD_TTL = 15_000;

export async function validSessionToken(tokenHash: string): Promise<{ ok: boolean; email: string }> {
  const hit = sessionCache.get(tokenHash);
  if (hit && Date.now() - hit.at < (hit.ok ? SESSION_OK_TTL : SESSION_BAD_TTL)) return { ok: hit.ok, email: hit.email };
  const snap = await fsdb().doc(`sessions/${tokenHash}`).get();
  const exp = snap.data()?.expires_at as number | undefined;
  const email = String(snap.data()?.email ?? "");
  const ok = Boolean(exp) && Number(exp) >= Date.now();
  if (!ok && exp) await snap.ref.delete();
  if (sessionCache.size > 500) sessionCache.clear();
  sessionCache.set(tokenHash, { at: Date.now(), ok, email: ok ? email : "" });
  return { ok, email: ok ? email : "" };
}

export async function destroySessionToken(tokenHash: string) {
  sessionCache.delete(tokenHash);
  await fsdb().doc(`sessions/${tokenHash}`).delete();
}
