"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function AdminShell({
  nav,
  logout,
  children,
}: {
  nav: React.ReactNode;
  logout: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <div className="min-h-screen bg-neutral-100 md:flex">
      <header className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-neutral-900 text-white px-4 py-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10">
          <Menu size={20} />
        </button>
        <Image src="/logo.png" alt="Cholti" width={96} height={32} className="h-7 w-auto rounded-lg object-cover" />
        <b>Cholti Admin</b>
      </header>

      {open && (
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="md:hidden fixed inset-0 z-40 bg-black/45 cursor-default" />
      )}

      <aside
        className={`bg-neutral-900 text-neutral-200 p-4 flex flex-col gap-1 z-50
          fixed inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:sticky md:top-0 md:h-screen md:w-52 md:shrink-0 md:translate-x-0`}
      >
        <span className="flex items-center gap-2 px-2 py-3">
          <Image src="/logo.png" alt="Cholti" width={96} height={32} className="h-8 w-auto rounded-lg object-cover" />
          <b className="text-white">Cholti Admin</b>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="md:hidden ml-auto w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10">
            <X size={17} />
          </button>
        </span>
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {nav}
        </div>
        <div className="mt-auto">{logout}</div>
      </aside>

      <main className="flex-1 p-4 md:p-6 max-w-5xl min-w-0">{children}</main>
    </div>
  );
}
