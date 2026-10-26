"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toggleProduct, deleteProduct } from "./actions";
import type { FormControls as FormFlags } from "@/lib/admins";

export type ProductRow = {
  slug: string; name: string; bn: string; cat: string; sub: string;
  tags: string[]; old: number; now: number; off: number;
  rating: string; img: string; imgs: string[]; badge: string | null; active: number;
  fabricIds: string[]; sizeIds: string[]; colorIds: string[];
  description: string;
};

export type CatOpt = { id: string; name: string };
export type SubOpt = { id: string; name: string; cat: string };

export type OptRow = { id: string; name: string; cats?: string[]; hex?: string };

export const EMPTY_PRODUCT: ProductRow = {
  slug: "", name: "", bn: "", cat: "", sub: "", tags: [],
  old: 0, now: 0, off: 0, rating: "", img: "", imgs: [], badge: null, active: 1,
  fabricIds: [], sizeIds: [], colorIds: [], description: "",
};

export default function ProductsManager({ rows, cats, subs }: { rows: ProductRow[]; cats: CatOpt[]; subs: SubOpt[]; forms: FormFlags; fabrics: OptRow[]; sizes: OptRow[]; colors: OptRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("all");
  const [fActive, setFActive] = useState("all");
  const subName = (id: string) => subs.find((s) => s.id === id)?.name ?? id;

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");

  const runRow = async (id: string, fn: () => Promise<unknown>) => {
    if (pending) return;
    setPending(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setPending(null);
    }
  };

  const shown = rows.filter((p) => {
    if (fCat !== "all" && p.cat !== fCat) return false;
    if (fActive !== "all" && String(p.active) !== fActive) return false;
    const query = q.trim().toLowerCase();
    if (query && ![p.name, p.slug, p.cat, p.sub, subName(p.sub)].join(" ").toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-2xl font-bold">Products ({rows.length})</h1>
        <Link href="/products/new" className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2">
          <Plus size={15} />Add product
        </Link>
      </div>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-3">
        <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]">
          <Search size={14} className="text-neutral-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, route, category"
            maxLength={60}
            className="outline-none bg-transparent w-full"
          />
        </label>
        <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm font-bold" aria-label="Filter by category">
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={fActive} onChange={(e) => setFActive(e.target.value)} className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm font-bold" aria-label="Filter by status">
          <option value="all">On + Off</option>
          <option value="1">On only</option>
          <option value="0">Off only</option>
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="p-3">Product</th>
              <th className="p-3 hidden md:table-cell">Price</th>
              <th className="p-3">Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.slug} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">{p.name}<br /><span className="font-normal text-neutral-500">{p.slug} • {p.cat}{p.sub ? ` / ${subName(p.sub)}` : ""}</span></td>
                <td className="p-3 hidden md:table-cell">৳{p.now.toLocaleString()} <span className="line-through text-neutral-400">৳{p.old.toLocaleString()}</span></td>
                <td className="p-3">
                  <button onClick={() => runRow(p.slug, () => toggleProduct(p.slug, p.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === p.slug}>
                    {pending === p.slug ? <Loader2 size={12} className="animate-spin" /> : p.active ? "On" : "Off"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link href={`/products/${p.slug}`} className="inline-flex items-center gap-1 px-2 font-bold underline"><Pencil size={13} />Edit</Link>
                  {armDel === p.slug ? (
                    <button onClick={() => runRow(p.slug, async () => { await deleteProduct(p.slug); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(p.slug)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={4} className="p-4 text-neutral-500">
                  {rows.length ? "No match." : "No products yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {shown.map((p) => (
            <div key={p.slug} className="p-3 border-b border-neutral-100 last:border-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <b className="block text-sm leading-snug">{p.name}</b>
                  <span className="block text-xs text-neutral-500 truncate">{p.slug} • {p.cat}{p.sub ? ` / ${subName(p.sub)}` : ""}</span>
                  <span className="block text-sm font-bold mt-1">৳{p.now.toLocaleString()} <s className="font-normal text-neutral-400">৳{p.old.toLocaleString()}</s></span>
                </div>
                <button onClick={() => runRow(p.slug, () => toggleProduct(p.slug, p.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${p.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === p.slug}>
                  {pending === p.slug ? <Loader2 size={12} className="animate-spin" /> : p.active ? "On" : "Off"}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                <Link href={`/products/${p.slug}`} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold underline"><Pencil size={13} />Edit</Link>
                {armDel === p.slug ? (
                  <button onClick={() => runRow(p.slug, async () => { await deleteProduct(p.slug); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(p.slug)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!shown.length && <p className="p-4 text-sm text-neutral-500">{rows.length ? "No match." : "No products yet."}</p>}
        </div>
      </div>
    </div>
  );
}
