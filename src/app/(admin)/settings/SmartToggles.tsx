"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { saveFormControls } from "./actions";
import type { FormControls as FormFlags } from "@/lib/admins";

export default function SmartToggles({ initial }: { initial: FormFlags }) {
  const [smart, setSmart] = useState(initial.smartUpload);
  const [hq, setHq] = useState(initial.highQuality);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveFormControls({ smartUpload: smart, highQuality: hq });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const Toggle = ({ on, onFlip, label, hint }: { on: boolean; onFlip: () => void; label: string; hint: string }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onFlip}
      className="flex items-center gap-3 text-sm font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 cursor-pointer text-left w-full"
    >
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-neutral-900" : "bg-neutral-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span>
        {label}
        <span className="block text-xs font-normal text-neutral-400">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-5">
      <h2 className="text-lg font-bold">Smart upload</h2>
      <p className="text-sm text-neutral-500 mb-3">Big images auto-compress on upload. High Quality keeps them sharper.</p>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="flex flex-col gap-2">
        <Toggle on={smart} onFlip={() => setSmart(!smart)} label="Smart Upload" hint="no popup, auto resize" />
        <Toggle on={hq} onFlip={() => setHq(!hq)} label="High Quality" hint="better smart resize" />
      </div>
      <button onClick={save} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : saved ? "Saved" : "Save smart upload"}
      </button>
    </div>
  );
}
