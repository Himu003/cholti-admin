"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const SWATCHES = ["#07382f", "#BC4621", "#D9C7A7", "#8A9B7C", "#ffffff", "#000000"];

export default function FitModal({
  url,
  initialBg,
  onKeep,
  onSaveColor,
}: {
  url: string;
  initialBg: string;
  onKeep: () => void;
  onSaveColor: (hex: string) => void;
}) {
  const [bg, setBg] = useState(initialBg || "#07382f");
  const [custom, setCustom] = useState(/^#[0-9a-fA-F]{6}$/.test(initialBg) ? initialBg : "#07382f");

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 p-5 max-h-[92vh] overflow-y-auto">
        <b className="text-lg">Image shape is off</b>
        <p className="text-sm text-neutral-500 mt-1 mb-3">
          This photo is not the wide banner shape, so it will not fill the box edge-to-edge. Preview below is exact.
          Keep it anyway, or pick a background color for the empty space — or continue with no color.
        </p>
        <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-[8/3] grid place-items-center" style={{ background: bg }}>
          <img src={url} alt="Fit preview" className="max-w-full max-h-full object-contain" />
        </div>
        <p className="text-sm font-bold mt-3 mb-1.5">Background color</p>
        <div className="flex items-center gap-2 flex-wrap">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBg(c)}
              aria-label={c}
              className={`w-9 h-9 rounded-full border-2 ${bg.toLowerCase() === c ? "border-neutral-900" : "border-neutral-300"}`}
              style={{ background: c }}
            />
          ))}
          <label className="inline-flex items-center gap-1.5 text-sm font-bold">
            <input type="color" value={custom} onChange={(e) => { setCustom(e.target.value); setBg(e.target.value); }} className="w-9 h-9 rounded-full cursor-pointer bg-transparent" />
            Custom
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onSaveColor(bg)} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5">
            <Check size={15} />Use this color
          </button>
          <button onClick={onKeep} className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5">
            Keep without color
          </button>
        </div>
      </div>
    </div>
  );
}
