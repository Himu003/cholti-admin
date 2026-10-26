"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <button aria-label="Close dialog" onClick={onClose} className="fixed inset-0 bg-black/45 cursor-default" />
      <div className="min-h-full grid place-items-center p-4">
        <div className={`relative w-full m-auto max-h-[92vh] overflow-y-auto bg-white rounded-2xl border border-neutral-200 p-5 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2">
            <b>{title}</b>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 grid place-items-center rounded-full border border-neutral-200 hover:border-neutral-900">
              <X size={15} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
