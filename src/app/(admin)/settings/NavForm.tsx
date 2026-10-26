"use client";

import { useState } from "react";
import { Check, FolderOpen, List } from "lucide-react";
import { saveNav } from "../actions";

export default function NavForm({ initial }: { initial: boolean }) {
  const [grouped, setGrouped] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await saveNav(grouped);
      setMsg("Saved. Sidebar updates on next page load.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const opts = [
    { v: true, label: "Grouped", desc: "Overview, Catalog, Sales, Content, System — click to unfold", Icon: FolderOpen },
    { v: false, label: "All flat", desc: "Every section shown at once, no groups", Icon: List },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <b>Sidebar</b>
      <p className="-mt-2 text-sm text-neutral-500">How the admin sidebar lists sections. Applies to everyone.</p>
      <span className="grid sm:grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 border border-neutral-200 p-1.5">
        {opts.map(({ v, label, desc, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setGrouped(v)}
            aria-pressed={grouped === v}
            className={`rounded-lg px-3 py-2.5 text-left ${grouped === v ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
              <Icon size={15} />{label}
            </span>
            <span className={`block text-xs font-normal mt-0.5 ${grouped === v ? "text-neutral-300" : "text-neutral-400"}`}>{desc}</span>
          </button>
        ))}
      </span>
      {msg && <p className="text-sm font-semibold">{msg}</p>}
      <button disabled={busy} onClick={save} className="self-start inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : "Save sidebar"}
      </button>
    </div>
  );
}
