"use client";

import { useState } from "react";
import { Trash2, ExternalLink, ChevronDown, Search } from "lucide-react";
import { setOrderStatus, deleteOrder } from "./actions";

export type OrderItem = { slug: string; name: string; fabric: string; qty: number; now: number; img: string };
export type OrderRow = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  user_id: string;
  photo: string;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "confirmed", "delivering", "delivered", "cancelled"];

const badge: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  confirmed: "bg-violet-100 text-violet-800",
  delivering: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersManager({ rows, shopBase }: { rows: OrderRow[]; shopBase: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");
  const counts = STATUSES.map((s) => ({ s, n: rows.filter((o) => o.status === s).length }));
  const query = q.trim().toLowerCase();
  const searched = !query
    ? null
    : rows.filter((o) =>
        [o.id, o.user_id, o.email, o.phone, o.name].some((v) => v.toLowerCase().includes(query))
      );
  const shown = searched ?? (filter ? rows.filter((o) => o.status === filter) : rows.slice(0, 8));
  const heading = searched ? `Results (${shown.length})` : filter ? `${filter} orders (${shown.length})` : "Recent orders";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h1 className="text-2xl font-bold">Orders ({rows.length})</h1>
        <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
          <Search size={14} className="text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order ID, user ID, email, phone"
            maxLength={60}
            className="outline-none bg-transparent w-56"
          />
        </label>
      </div>
      <p className="text-sm text-neutral-500 mb-3">Site “Order Now” checkouts. Tap a box to filter.</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
        {counts.map(({ s, n }) => (
          <button
            key={s}
            onClick={() => { setFilter(filter === s ? null : s); setOpen(null); }}
            className={`bg-white border rounded-2xl p-3.5 text-left ${filter === s ? "border-neutral-900 ring-2 ring-neutral-900/20" : "border-neutral-200"}`}
          >
            <b className="text-2xl block">{n}</b>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold mt-1 ${badge[s] ?? "bg-neutral-200 text-neutral-600"}`}>{s}</span>
          </button>
        ))}
      </div>
      <h2 className="text-lg font-bold mb-2">{heading}</h2>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="flex flex-col gap-3">
        {shown.map((o) => (
          <div key={o.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full flex items-center gap-3 p-4 text-left">
              {o.photo ? (
                <img src={o.photo} alt="" className="w-9 h-9 rounded-full object-cover bg-neutral-100 shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center font-bold text-neutral-600 shrink-0">
                  {(o.name || o.email || "?")[0]?.toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="font-bold truncate block">{o.name}</span>
                <span className="block text-xs text-neutral-500 truncate">
                  {[o.user_id, o.email].filter(Boolean).join(" · ") || o.phone}
                </span>
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${badge[o.status] ?? "bg-neutral-200 text-neutral-600"}`}>
                {o.status}
              </span>
              <span className="ml-auto text-sm font-bold whitespace-nowrap">৳{o.total.toLocaleString()}</span>
              <ChevronDown size={16} className={`shrink-0 transition ${open === o.id ? "rotate-180" : ""}`} />
            </button>
            {open === o.id && (
              <div className="border-t border-neutral-100 p-4">
                <div className="flex flex-col gap-2.5 mb-3">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {it.img ? (
                        <img src={it.img} alt="" className="w-12 h-12 rounded-lg object-cover bg-neutral-100" />
                      ) : (
                        <span className="w-12 h-12 rounded-lg bg-neutral-100 grid place-items-center text-neutral-400 text-xs font-bold">no img</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <b className="block text-sm truncate">{it.name}</b>
                        <span className="text-xs text-neutral-500">{it.fabric} × {it.qty} — ৳{Number(it.now * it.qty).toLocaleString()}</span>
                      </div>
                      <a href={`${shopBase}/product/${it.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 underline shrink-0">
                        <ExternalLink size={12} />View
                      </a>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3 mb-3">
                  <p><b>Address:</b> {o.address}</p>
                  <p><b>Email:</b> {o.email || "—"}</p>
                  <p><b>Placed:</b> {String(o.created_at).slice(0, 16).replace("T", " ")} · Sub ৳{o.subtotal.toLocaleString()} + Delivery ৳{o.delivery.toLocaleString()}</p>
                  <p className="text-xs text-neutral-400 mt-1">ID: {o.id}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    defaultValue={STATUSES.includes(o.status) ? o.status : "new"}
                    onChange={(e) => setOrderStatus(o.id, e.target.value as never).catch(fail)}
                    className="h-9 border border-neutral-300 rounded-lg px-2 text-sm font-bold"
                    aria-label="Order status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {armDel === o.id ? (
                    <button onClick={() => { setArmDel(null); deleteOrder(o.id).catch(fail); }} className="inline-flex items-center gap-1 px-2 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(o.id)} className="inline-flex items-center gap-1 px-2 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {!shown.length && <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-2xl p-4">{rows.length ? "No match." : "No site orders yet. They appear here when customers tap “Order Now”."}</p>}
      </div>
    </div>
  );
}
