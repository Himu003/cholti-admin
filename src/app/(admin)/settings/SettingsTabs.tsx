"use client";

import { useState } from "react";
import { Phone, Type, CloudUpload, PanelLeft, Truck } from "lucide-react";
import ContactForm from "./ContactForm";
import DisplayForm from "./DisplayForm";
import NavForm from "./NavForm";
import ZonesManager, { type ZoneRow } from "./ZonesManager";
import SmartToggles from "./SmartToggles";
import ImageInputToggles from "./ImageInputToggles";
import type { FormControls as FormFlags } from "@/lib/admins";

type Tab = "contact" | "display" | "sidebar" | "delivery" | "upload";

export default function SettingsTabs({
  settings,
  forms,
  showUpload,
  zones,
}: {
  settings: Record<string, string>;
  forms: FormFlags;
  showUpload: boolean;
  zones: ZoneRow[];
}) {
  const [tab, setTab] = useState<Tab>("contact");
  const tabs: { id: Tab; label: string; Icon: typeof Phone; desc: string }[] = [
    { id: "contact", label: "Contact", Icon: Phone, desc: "Hotline, email, address" },
    { id: "display", label: "Display", Icon: Type, desc: "Font size" },
    { id: "sidebar", label: "Sidebar", Icon: PanelLeft, desc: "Grouped or flat" },
    { id: "delivery", label: "Delivery", Icon: Truck, desc: "Areas + charges" },
    ...(showUpload ? [{ id: "upload", label: "Uploads", Icon: CloudUpload, desc: "Image inputs" } as const] : []),
  ];

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-4 items-start">
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto bg-white border border-neutral-200 rounded-2xl p-2">
        {tabs.map(({ id, label, Icon, desc }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-left whitespace-nowrap ${
              tab === id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>
              {label}
              <span className={`block text-xs font-normal ${tab === id ? "text-neutral-300" : "text-neutral-400"}`}>{desc}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="min-w-0">
        {tab === "contact" && <ContactForm initial={settings} />}
        {tab === "display" && <DisplayForm initial={settings.font_scale ?? "100"} />}
        {tab === "sidebar" && <NavForm initial={(settings.nav_grouped ?? "1") !== "0"} />}
        {tab === "delivery" && <ZonesManager zones={zones} />}
        {tab === "upload" && showUpload && (
          <>
            <ImageInputToggles initial={forms} />
            <SmartToggles initial={forms} />
          </>
        )}
      </div>
    </div>
  );
}
