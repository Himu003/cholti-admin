"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export default function FieldHelp({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number; below: boolean } | null>(null);

  useEffect(() => {
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, []);

  const show = () => {
    const r = iconRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = 208;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
    const below = r.top < 190;
    setTip({ top: below ? r.bottom + 8 : r.top - 8, left, below });
  };

  return (
    <label className="text-sm block">
      <span className="inline-flex items-center gap-1 font-medium">
        {label}
        <span
          ref={iconRef}
          className="inline-flex cursor-help"
          tabIndex={0}
          aria-label={help}
          onMouseEnter={show}
          onMouseLeave={() => setTip(null)}
          onFocus={show}
          onBlur={() => setTip(null)}
        >
          <HelpCircle size={13} className="text-neutral-400" />
        </span>
      </span>
      {children}
      {tip && (
        <span
          className="fixed z-[200] w-52 rounded-lg bg-neutral-900 text-white text-xs font-normal leading-snug p-2.5 shadow-xl"
          style={{
            top: tip.below ? tip.top : undefined,
            bottom: tip.below ? undefined : Math.max(8, window.innerHeight - tip.top),
            left: tip.left,
          }}
        >
          {help}
        </span>
      )}
    </label>
  );
}
