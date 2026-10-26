"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { saveFormControls } from "./actions";
import type { FormControls as FormFlags } from "@/lib/admins";

export default function ImageInputToggles({ initial }: { initial: FormFlags }) {
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [upload, setUpload] = useState(initial.upload);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveFormControls({ imageUrl, upload });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-5">
      <h2 className="text-lg font-bold">Image inputs</h2>
      <p className="text-sm text-neutral-500 mb-3">Turn off a way of adding images and its field disappears from product, category and hero forms.</p>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={imageUrl} onChange={(e) => setImageUrl(e.target.checked)} className="w-4 h-4" />
          Image URL paste
          <span className="ml-auto text-xs text-neutral-400">paste a link</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={upload} onChange={(e) => setUpload(e.target.checked)} className="w-4 h-4" />
          Upload button
          <span className="ml-auto text-xs text-neutral-400">to ImageKit</span>
        </label>
      </div>
      <button onClick={save} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : saved ? "Saved" : "Save image inputs"}
      </button>
    </div>
  );
}
