"use client";

import { useState } from "react";
import SaveButtons from "../SaveButtons";
import { saveContact } from "../actions";

export default function ContactForm({ initial }: { initial: Record<string, string> }) {
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (fd: FormData) => {
    setMsg(null);
    try {
      await saveContact({
        wa_number: String(fd.get("wa_number") ?? ""),
        hotline: String(fd.get("hotline") ?? ""),
        email: String(fd.get("email") ?? ""),
        address_en: String(fd.get("address_en") ?? ""),
        address_bn: String(fd.get("address_bn") ?? ""),
      });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <form action={submit} className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <b>Contact info</b>
      <p className="-mt-2 text-sm text-neutral-500">Shown in the shop header, footer and contact page.</p>
      <label className="text-sm">WhatsApp number (8801XXXXXXXXX)<input name="wa_number" defaultValue={initial.wa_number ?? ""} required className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
      <label className="text-sm">Hotline<input name="hotline" defaultValue={initial.hotline ?? ""} required maxLength={20} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
      <label className="text-sm">Email<input name="email" defaultValue={initial.email ?? ""} required maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
      <label className="text-sm">Address (EN)<input name="address_en" defaultValue={initial.address_en ?? ""} maxLength={200} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
      <label className="text-sm">Address (BN)<input name="address_bn" defaultValue={initial.address_bn ?? ""} maxLength={200} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
      {msg && <p className="text-sm font-semibold">{msg}</p>}
      <span className="self-start"><SaveButtons saveLabel="Save contact" /></span>
    </form>
  );
}
