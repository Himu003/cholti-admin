"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { saveDisplay } from "../actions";

const SCALES = [
  { v: "90", label: "Small" },
  { v: "100", label: "Normal" },
  { v: "112", label: "Large" },
  { v: "125", label: "XL" },
];

export default function DisplayForm({ initial }: { initial: string }) {
  const [scale, setScale] = useState(initial ?? "100");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await saveDisplay(scale);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <b>Display</b>
      <p className="-mt-2 text-sm text-neutral-500">Website font size. Applies to the whole shop instantly.</p>
      <span className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-neutral-100 border border-neutral-200 p-1.5">
        {SCALES.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => setScale(s.v)}
            className={`rounded-lg py-2 text-[13px] font-extrabold ${scale === s.v ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
          >
            {s.label}
          </button>
        ))}
      </span>
      <span className="block rounded-xl border border-neutral-200 px-3 py-2 bg-white" style={{ zoom: Number(scale) / 100 }}>
        Preview: Shop by Categories — ৳2,350
      </span>
      {msg && <p className="text-sm font-semibold">{msg}</p>}
      <button disabled={busy} onClick={save} className="self-start inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : "Save display"}
      </button>
    </div>
  );
}
