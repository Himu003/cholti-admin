"use client";

import { useState } from "react";
import { Trash2, Search, Loader2 } from "lucide-react";
import { setUserDisabled, deleteUser } from "./actions";

export type UserRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  photo: string;
  created_at: string;
  disabled: boolean;
  orders: number;
};

export default function UsersManager({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

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

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");
  const query = q.trim().toLowerCase();
  const shown = !query
    ? rows
    : rows.filter((r) =>
        [r.user_id, r.name, r.email, r.id].some((v) => v.toLowerCase().includes(query))
      );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between mb-3">
        <h1 className="text-2xl font-bold">Users ({rows.length})</h1>
        <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
          <Search size={14} className="text-neutral-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ID, name, email"
            maxLength={60}
            className="outline-none bg-transparent w-full md:w-52"
          />
        </label>
      </div>
      <p className="text-sm text-neutral-500 mb-3">Shop customers. Disabled users are signed out and cannot sign back in. Deleting removes the account, its orders and its reviews.</p>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <tbody>
            {shown.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    {u.photo ? (
                      <img src={u.photo} alt="" className="w-9 h-9 rounded-full object-cover bg-neutral-100" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center font-bold text-neutral-600">
                        {(u.name || u.email || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <b className="block truncate">{u.name || <span className="text-neutral-400">No name</span>}</b>
                      <span className="block text-neutral-500 truncate">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <code className="bg-neutral-100 rounded px-1.5 py-0.5 text-xs font-bold">{u.user_id || "—"}</code>
                </td>
                <td className="p-3 whitespace-nowrap text-neutral-500">
                  {u.orders} order{u.orders === 1 ? "" : "s"}
                  <span className="block text-xs">since {String(u.created_at).slice(0, 10) || "—"}</span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => runRow(u.id, () => setUserDisabled(u.id, !u.disabled))}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${u.disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} disabled:opacity-60`} disabled={pending === u.id}
                  >
                    {pending === u.id ? <Loader2 size={12} className="animate-spin" /> : u.disabled ? "Disabled" : "Active"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {armDel === u.id ? (
                    <button onClick={() => runRow(u.id, async () => { await deleteUser(u.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(u.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td className="p-4 text-neutral-500">{rows.length ? "No match." : "No users yet."}</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {shown.map((u) => (
            <div key={u.id} className="p-3 border-b border-neutral-100 last:border-0">
              <div className="flex items-center gap-2.5">
                {u.photo ? (
                  <img src={u.photo} alt="" className="w-9 h-9 rounded-full object-cover bg-neutral-100 shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center font-bold text-neutral-600 shrink-0">
                    {(u.name || u.email || "?")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{u.name || <span className="text-neutral-400">No name</span>}</b>
                  <span className="block text-xs text-neutral-500 truncate">{u.email}</span>
                  <span className="block text-xs text-neutral-500 mt-0.5">
                    <code className="bg-neutral-100 rounded px-1.5 py-0.5 text-[11px] font-bold">{u.user_id || "—"}</code>
                    {" "}• {u.orders} order{u.orders === 1 ? "" : "s"} • since {String(u.created_at).slice(0, 10) || "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => runRow(u.id, () => setUserDisabled(u.id, !u.disabled))}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${u.disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} disabled:opacity-60`} disabled={pending === u.id}
                >
                  {pending === u.id ? <Loader2 size={12} className="animate-spin" /> : u.disabled ? "Disabled" : "Active"}
                </button>
                {armDel === u.id ? (
                  <button onClick={() => runRow(u.id, async () => { await deleteUser(u.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(u.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!shown.length && <p className="p-4 text-sm text-neutral-500">{rows.length ? "No match." : "No users yet."}</p>}
        </div>
      </div>
    </div>
  );
}
