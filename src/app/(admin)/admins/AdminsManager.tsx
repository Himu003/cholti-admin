"use client";

import { useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { addAdmin, removeAdmin, type AdminRow } from "./actions";

function roleBadge(role: string) {
  if (role === "admin") return "bg-green-100 text-green-800 border border-green-200";
  return "bg-neutral-100 text-neutral-600 border border-neutral-200";
}

export default function AdminsManager({ rows }: { rows: AdminRow[] }) {
  const [list, setList] = useState<AdminRow[]>(rows);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);

  const canRemove = (role: string) => role === "sub admin";

  const run = async (key: string, fn: () => Promise<AdminRow[]>) => {
    if (busy) return false;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      setList(await fn());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = input.trim().toLowerCase();
    if (!email) return;
    if (await run("add", () => addAdmin(email))) {
      setInput("");
      setNotice(`Added ${email} as a sub admin.`);
    }
  };

  const remove = async (email: string) => {
    if (armDel !== email) {
      setArmDel(email);
      setError(null);
      setNotice(null);
      return;
    }
    setArmDel(null);
    if (await run(email, () => removeAdmin(email))) setNotice(`Removed ${email}. They can no longer log in.`);
  };

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="email"
          required
          placeholder="name@gmail.com"
          maxLength={120}
          className="flex-1 h-11 border border-neutral-300 rounded-lg px-3 text-sm bg-white"
        />
        <button
          disabled={busy === "add"}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 h-11 disabled:opacity-50"
        >
          {busy === "add" ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          {busy === "add" ? "Adding…" : "Add sub admin"}
        </button>
      </form>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      {notice && <p className="text-sm font-semibold text-green-700 mb-2">{notice}</p>}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {list.map(({ email, role }) => (
          <div key={email} className="flex items-center gap-2.5 p-3 border-b border-neutral-100 last:border-0">
            <span className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center font-bold text-neutral-600 shrink-0">
              {email[0]?.toUpperCase()}
            </span>
            <b className="min-w-0 flex-1 truncate text-sm">{email}</b>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${roleBadge(role)}`}>{role}</span>
            {canRemove(role) && (
              <button
                onClick={() => remove(email)}
                disabled={busy === email}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-bold text-red-700 disabled:opacity-50 shrink-0"
              >
                {busy === email ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {armDel === email ? "Sure?" : "Remove"}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-500 mt-2">Removing someone blocks new logins and ends their open sessions.</p>
    </div>
  );
}
