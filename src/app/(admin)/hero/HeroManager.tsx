"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import type { SlideRow } from "@/lib/types";
import Modal from "../Modal";
import SaveButtons from "../SaveButtons";
import UploadButton from "../UploadButton";
import FitModal from "./FitModal";
import { flushUploads } from "@/lib/upload-client";
import { saveSlide, toggleSlide, deleteSlide, moveSlide, switchStyleForm } from "./actions";
import type { FormControls as FormFlags } from "@/lib/admins";

const EMPTY: SlideRow = {
  id: "", title_bn: "", title_en: "", sub_bn: "", sub_en: "",
  eyebrow_bn: "", eyebrow_en: "", cta_bn: "", cta_en: "",
  link: "#products", image: "", theme: "clay", layout: "full", bg: "",
  badge_bn: "", badge_en: "", sort_order: 0, active: 1,
  starts_at: null, ends_at: null,
};

export default function HeroManager({ style, slides, forms }: { style: string; slides: SlideRow[]; forms: FormFlags }) {
  const [editing, setEditing] = useState<SlideRow | null>(null);
  const [slideLayout, setSlideLayout] = useState("full");
  const [bg, setBg] = useState("");
  const [fit, setFit] = useState<string | null>(null);
  const setE = (patch: Partial<SlideRow>) => setEditing((e) => (e ? { ...e, ...patch } : e));
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const runRow = async (id: string, fn: () => Promise<unknown>) => {
    if (pending) return;
    setPending(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setPending(null);
    }
  };
  const isNew = !!editing && !slides.some((s) => s.id === editing.id);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const up = await flushUploads();
      if (!up.ok) throw new Error(up.error ?? "Image upload failed");
      for (const [k, v] of Object.entries(up.urls ?? {})) fd.set(k, v);
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveSlide({
        id: get("id").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        layout: (get("layout") === "image" ? "image" : "full") as "full" | "image",
        bg: get("bg"),
        title_bn: get("title_bn"), title_en: get("title_en"),
        sub_bn: get("sub_bn"), sub_en: get("sub_en"),
        eyebrow_bn: get("eyebrow_bn"), eyebrow_en: get("eyebrow_en"),
        cta_bn: get("cta_bn"), cta_en: get("cta_en"),
        link: get("link"), image: get("image"),
        theme: get("theme") as "clay" | "forest" | "cocoa",
        badge_bn: get("badge_bn"), badge_en: get("badge_en"),
        active: fd.get("active") ? 1 : 0,
        starts_at: get("starts_at") || null,
        ends_at: get("ends_at") || null,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Hero</h1>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 mt-4">
        <b className="text-sm">Section style</b>
        <form action={switchStyleForm} className="flex gap-2 mt-2">
          <button
            name="style"
            value="banner"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold border ${style === "banner" ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"}`}
          >
            Full-width banner
          </button>
          <button
            name="style"
            value="boxed"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold border ${style === "boxed" ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"}`}
          >
            Boxed banner
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="font-bold">Slides ({slides.length})</h2>
        <button onClick={() => { setEditing({ ...EMPTY }); setSlideLayout("full"); setBg(""); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2">
          <Plus size={15} />Add slide
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="p-3">Title</th>
              <th className="p-3 hidden md:table-cell">Theme</th>
              <th className="p-3">Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">{s.title_en}<br /><span className="font-normal text-neutral-500">{s.title_bn}</span></td>
                <td className="p-3 hidden md:table-cell">{s.theme}</td>
                <td className="p-3">
                  <button onClick={() => runRow(s.id, () => toggleSlide(s.id, s.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${s.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === s.id}>
                    {pending === s.id ? <Loader2 size={12} className="animate-spin" /> : s.active ? "On" : "Off"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button disabled={!!pending} onClick={() => runRow(s.id + ":mv", () => moveSlide(s.id, -1))} className="p-1.5 font-bold" aria-label="Move up"><ChevronUp size={15} /></button>
                  <button disabled={!!pending} onClick={() => runRow(s.id + ":mv", () => moveSlide(s.id, 1))} className="p-1.5 font-bold" aria-label="Move down"><ChevronDown size={15} /></button>
                  <button onClick={() => { setEditing({ ...s }); setSlideLayout(s.layout === "image" ? "image" : "full"); setBg(s.bg ?? ""); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 font-bold underline"><Pencil size={13} />Edit</button>
                  {armDel === s.id ? (
                    <button onClick={() => runRow(s.id, async () => { await deleteSlide(s.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(s.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!slides.length && <tr><td className="p-4 text-neutral-500">No slides yet.</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {slides.map((s) => (
            <div key={s.id} className="p-3 border-b border-neutral-100 last:border-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <b className="block text-sm leading-snug">{s.title_en}</b>
                  <span className="block text-xs text-neutral-500 truncate">{s.title_bn} • {s.theme}</span>
                </div>
                <button onClick={() => runRow(s.id, () => toggleSlide(s.id, s.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${s.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === s.id}>
                  {pending === s.id ? <Loader2 size={12} className="animate-spin" /> : s.active ? "On" : "Off"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <button disabled={!!pending} onClick={() => runRow(s.id + ":mv", () => moveSlide(s.id, -1))} className="p-1.5 font-bold" aria-label="Move up"><ChevronUp size={15} /></button>
                <button disabled={!!pending} onClick={() => runRow(s.id + ":mv", () => moveSlide(s.id, 1))} className="p-1.5 font-bold" aria-label="Move down"><ChevronDown size={15} /></button>
                <button onClick={() => { setEditing({ ...s }); setSlideLayout(s.layout === "image" ? "image" : "full"); setBg(s.bg ?? ""); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold underline"><Pencil size={13} />Edit</button>
                {armDel === s.id ? (
                  <button onClick={() => runRow(s.id, async () => { await deleteSlide(s.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(s.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!slides.length && <p className="p-4 text-sm text-neutral-500">No slides yet.</p>}
        </div>
      </div>

      {editing && (
        <Modal title={isNew ? "New slide" : "Edit slide"} onClose={() => setEditing(null)}>
          <form action={submit} className="flex flex-col gap-3">
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <input type="hidden" name="layout" value={slideLayout} />
          <input type="hidden" name="bg" value={bg} />
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSlideLayout("full")}
              className={`rounded-xl border p-3 text-left ${slideLayout === "full" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"}`}
            >
              <b className="text-sm block">Full slide</b>
              <span className={`text-xs ${slideLayout === "full" ? "text-neutral-300" : "text-neutral-500"}`}>Photo + text + button</span>
            </button>
            <button
              type="button"
              onClick={() => setSlideLayout("image")}
              className={`rounded-xl border p-3 text-left ${slideLayout === "image" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"}`}
            >
              <b className="text-sm block">Image only</b>
              <span className={`text-xs ${slideLayout === "image" ? "text-neutral-300" : "text-neutral-500"}`}>Just a photo banner</span>
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">ID (slug)<input name="id" defaultValue={editing.id} required maxLength={60} readOnly={!isNew} className={`mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3 ${!isNew ? "bg-neutral-100" : ""}`} /></label>
            {slideLayout === "full" ? (
            <label className="text-sm">Theme
              <select name="theme" defaultValue={editing.theme} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3">
                <option value="clay">clay</option><option value="forest">forest</option><option value="cocoa">cocoa</option>
              </select>
            </label>
            ) : (
              <input type="hidden" name="theme" value={editing.theme} />
            )}
            {slideLayout === "full" && (
              <>
            <label className="text-sm">Title BN<input name="title_bn" defaultValue={editing.title_bn} maxLength={120} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Title EN<input name="title_en" defaultValue={editing.title_en} maxLength={120} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Sub BN<input name="sub_bn" defaultValue={editing.sub_bn} maxLength={300} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Sub EN<input name="sub_en" defaultValue={editing.sub_en} maxLength={300} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Eyebrow BN<input name="eyebrow_bn" defaultValue={editing.eyebrow_bn} maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Eyebrow EN<input name="eyebrow_en" defaultValue={editing.eyebrow_en} maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">CTA BN<input name="cta_bn" defaultValue={editing.cta_bn} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">CTA EN<input name="cta_en" defaultValue={editing.cta_en} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Badge BN<input name="badge_bn" defaultValue={editing.badge_bn} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Badge EN<input name="badge_en" defaultValue={editing.badge_en} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
              </>
            )}
            <label className="text-sm sm:col-span-2">Button link — tap target: #section, /shop route, or full link (auto-fixed)<input name="link" defaultValue={editing.link} maxLength={300} placeholder="#products, /shop, choltihomedecor.vercel.app/shop" className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm sm:col-span-2">Image — best size 1600 × 600 px (wide banner)
              <span className="flex gap-2 mt-1">
                {forms.imageUrl && <input name="image" value={editing.image} onChange={(e) => setE({ image: e.target.value })} maxLength={500} className="flex-1 h-10 border border-neutral-300 rounded-lg px-3" />}
                {!forms.imageUrl && <input type="hidden" name="image" value={editing.image} />}
                {forms.upload && <UploadButton
                  target="image"
                  folder="hero"
                  smart={forms.smartUpload}
                  hq={forms.highQuality}
                  onUploaded={(url: string) => setE({ image: url })}
                  onSelectFile={(f: File) => {
                    const url = URL.createObjectURL(f);
                    const img = new Image();
                    img.onload = () => {
                      if (!img.naturalWidth || !img.naturalHeight) {
                        URL.revokeObjectURL(url);
                        return;
                      }
                      const aspect = img.naturalWidth / img.naturalHeight;
                      if (Math.abs(aspect - 8 / 3) / (8 / 3) > 0.12) setFit(url);
                      else URL.revokeObjectURL(url);
                    };
                    img.onerror = () => URL.revokeObjectURL(url);
                    img.src = url;
                  }}
                />}
                {!forms.imageUrl && !forms.upload && <span className="text-xs text-neutral-500 self-center">Image inputs turned off in Settings &gt; Uploads.</span>}
              </span>
            </label>
          </div>
          {slideLayout === "image" && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Background:</span>
              {bg ? (
                <>
                  <span className="w-6 h-6 rounded-full border border-neutral-300 inline-block" style={{ background: bg }} />
                  <code className="text-xs">{bg}</code>
                  <button type="button" onClick={() => setBg("")} className="text-xs font-bold underline">Clear</button>
                </>
              ) : (
                <span className="text-xs text-neutral-500">None — set after uploading (fit check).</span>
              )}
            </div>
          )}
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editing.active} /> Active</label>
          <div className="flex gap-2">
            <SaveButtons onCancel={() => setEditing(null)} />
          </div>
        </form>
        </Modal>
      )}
      {fit && (
        <FitModal
          url={fit}
          initialBg={bg}
          onKeep={() => { URL.revokeObjectURL(fit); setFit(null); }}
          onSaveColor={(hex) => { setBg(hex); URL.revokeObjectURL(fit); setFit(null); }}
        />
      )}
    </div>
  );
}
