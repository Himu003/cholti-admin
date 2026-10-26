"use client";

import { useState } from "react";
import { Check, Upload, Eye } from "lucide-react";
import FieldHelp from "../FieldHelp";
import Modal from "../Modal";
import { uploadWithProgress } from "@/lib/upload-client";
import { saveBrand, saveAbout } from "../actions";
import type { FormControls as FormFlags } from "@/lib/admins";

export type BrandRow = {
  title_en: string; title_bn: string; text_en: string; text_bn: string; img: string;
  points_en: string[]; points_bn: string[];
};

export type AboutRow = { title_en: string; title_bn: string; body_en: string; body_bn: string };

export default function BrandPanel({ brand, forms }: { brand: BrandRow; forms: FormFlags }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Brand</h1>
      <BrandForm initial={brand} forms={forms} />
    </div>
  );
}

export function AboutPanel({ about }: { about: AboutRow }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">About</h1>
      <AboutForm initial={about} />
    </div>
  );
}

function BrandForm({ initial, forms }: { initial: BrandRow; forms: FormFlags }) {
  const [v, setV] = useState<BrandRow>({ ...initial, points_en: [...initial.points_en], points_bn: [...initial.points_bn] });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<BrandRow>) => setV((e) => ({ ...e, ...patch }));
  const setPoint = (which: "points_en" | "points_bn", i: number, val: string) =>
    set({ [which]: v[which].map((p, j) => (j === i ? val : p)) } as Partial<BrandRow>);

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await saveBrand({ ...v, points_en: v.points_en.map((s) => s.trim()).filter(Boolean), points_bn: v.points_bn.map((s) => s.trim()).filter(Boolean) });
      setMsg("Saved. Shop updates shortly.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null);
    setBusy(true);
    try {
      const ufd = new FormData();
      ufd.append("file", f);
      ufd.append("folder", "brand");
      const data = (await uploadWithProgress("/api/upload", ufd, () => {})) as { path?: string };
      if (!data?.path) throw new Error("Image upload failed");
      set({ img: data.path });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setBusy(false);
    }
  };

  const inp = "mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3";
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <b>Landing brand block</b>
      <p className="-mt-2 text-sm text-neutral-500">Shows only on the home page. Explains the brand — photo, title, text and highlight chips.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <FieldHelp label="Title (EN)" help="Brand headline in English."><input value={v.title_en} onChange={(e) => set({ title_en: e.target.value })} required maxLength={120} className={inp} /></FieldHelp>
        <FieldHelp label="Title (BN)" help="Brand headline in Bangla."><input value={v.title_bn} onChange={(e) => set({ title_bn: e.target.value })} required maxLength={120} className={inp} /></FieldHelp>
      </div>
      <FieldHelp label="Text (EN)" help="1–3 short paragraphs about the brand. Line breaks become paragraphs."><textarea value={v.text_en} onChange={(e) => set({ text_en: e.target.value })} required maxLength={1000} rows={3} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></FieldHelp>
      <FieldHelp label="Text (BN)" help="Same text in Bangla."><textarea value={v.text_bn} onChange={(e) => set({ text_bn: e.target.value })} required maxLength={1000} rows={3} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></FieldHelp>
      <FieldHelp label="Photo" help="Brand photo beside the text. Upload or paste an image link.">
        <span className="flex gap-2 mt-1 items-center">
          {forms.imageUrl && <input value={v.img} onChange={(e) => set({ img: e.target.value })} maxLength={500} placeholder="https://…" className="flex-1 h-10 border border-neutral-300 rounded-lg px-3" />}
          {!forms.imageUrl && <input type="hidden" value={v.img} />}
          {forms.upload && (
            <label className="inline-flex items-center gap-1.5 h-10 rounded-lg border border-neutral-300 px-4 text-sm font-bold cursor-pointer whitespace-nowrap">
              <Upload size={14} />Upload
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          )}
        </span>
        {!!v.img && <span className="block text-xs text-neutral-500 break-all mt-1">{v.img}</span>}
      </FieldHelp>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <span className="text-sm font-medium">Highlight chips (EN, up to 3)</span>
          {[0, 1, 2].map((i) => (
            <input key={i} value={v.points_en[i] ?? ""} onChange={(e) => setPoint("points_en", i, e.target.value)} maxLength={60} placeholder={`Point ${i + 1}`} className={`${inp} mb-2`} />
          ))}
        </div>
        <div>
          <span className="text-sm font-medium">Highlight chips (BN, up to 3)</span>
          {[0, 1, 2].map((i) => (
            <input key={i} value={v.points_bn[i] ?? ""} onChange={(e) => setPoint("points_bn", i, e.target.value)} maxLength={60} placeholder={`পয়েন্ট ${i + 1}`} className={`${inp} mb-2`} />
          ))}
        </div>
      </div>
      <BrandPreview v={v} />
      {msg && <p className="text-sm font-semibold">{msg}</p>}
      <button disabled={busy} onClick={save} className="self-start inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : "Save brand"}
      </button>
    </div>
  );
}

function LangToggle({ bn, setBn }: { bn: boolean; setBn: (v: boolean) => void }) {
  return (
    <span className="inline-flex rounded-lg bg-neutral-100 border border-neutral-200 p-0.5 text-xs font-bold">
      {(["EN", "BN"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setBn(l === "BN")}
          className={`rounded-md px-2.5 py-1 ${bn === (l === "BN") ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
        >
          {l}
        </button>
      ))}
    </span>
  );
}

const SHOP_FONTS =
  "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;700&family=Noto+Serif+Bengali:wght@600;700&family=Playfair+Display:wght@600;700&display=swap";

function BrandPreview({ v }: { v: BrandRow }) {
  const [bn, setBn] = useState(false);
  const [popup, setPopup] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <span className="flex items-center justify-between gap-2">
        <b className="text-sm">Website preview — updates as you type</b>
        <span className="inline-flex items-center gap-1.5">
          <LangToggle bn={bn} setBn={setBn} />
          <button type="button" onClick={() => setPopup(true)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-bold hover:border-neutral-900">
            <Eye size={13} />Popup
          </button>
        </span>
      </span>
      <p className="text-xs text-neutral-500 mb-2">Home page brand block, exactly as the shop shows it</p>
      <BrandSection v={v} bn={bn} />
      {popup && (
        <Modal wide title="Brand block — full-size shop preview" onClose={() => setPopup(false)}>
          <span className="inline-flex mb-2"><LangToggle bn={bn} setBn={setBn} /></span>
          <BrandSection v={v} bn={bn} />
        </Modal>
      )}
    </div>
  );
}

function BrandSection({ v, bn }: { v: BrandRow; bn: boolean }) {
  const lang = bn ? "bn" : "en";
  const title = (bn ? v.title_bn : v.title_en) || "…";
  const text = bn ? v.text_bn : v.text_en;
  const points = bn ? v.points_bn : v.points_en;
  return (
    <div className="shop-scope overflow-hidden rounded-xl border border-neutral-200">
      <link href={SHOP_FONTS} rel="stylesheet" />
      <section className="bg-cream py-[64px]">
        <div className="max-w-[1180px] mx-auto px-5 grid md:grid-cols-2 gap-[42px] items-center">
          <div className="relative">
            {v.img ? (
              <img src={v.img} alt={title} className="w-full h-[280px] md:h-[390px] object-cover rounded-3xl shadow-[0_18px_50px_rgba(62,32,12,0.10)] border border-white" loading="lazy" />
            ) : (
              <span className="w-full h-[280px] md:h-[390px] grid place-items-center rounded-3xl bg-neutral-100 text-neutral-400 text-xs">no photo</span>
            )}
          </div>
          <div>
            <div className="eyebrow !text-[14px]">{lang === "bn" ? "আমাদের ব্র্যান্ড" : "Our Brand"}</div>
            <h2 className="font-serif text-[28px] md:text-[38px] mt-2">{title}</h2>
            <div className="gold-divider" />
            <div className="flex flex-col gap-2.5 mt-1">
              {(text || "…").split(/\n+/).map((para, i) => (
                <p key={i} className="text-[17px] leading-relaxed">{para}</p>
              ))}
            </div>
            {!!points.filter(Boolean).length && (
              <div className="flex gap-2 flex-wrap my-3.5">{points.filter(Boolean).map((p) => <span key={p} className="bg-paper border border-line rounded-full px-3 py-1.5 text-[15px] text-muted">{p}</span>)}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AboutPreview({ v }: { v: AboutRow }) {
  const [bn, setBn] = useState(false);
  const [popup, setPopup] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <span className="flex items-center justify-between gap-2">
        <b className="text-sm">Website preview — updates as you type</b>
        <span className="inline-flex items-center gap-1.5">
          <LangToggle bn={bn} setBn={setBn} />
          <button type="button" onClick={() => setPopup(true)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-bold hover:border-neutral-900">
            <Eye size={13} />Popup
          </button>
        </span>
      </span>
      <p className="text-xs text-neutral-500 mb-2">/about page, exactly as the shop shows it</p>
      <AboutSection v={v} bn={bn} />
      {popup && (
        <Modal wide title="About page — full-size shop preview" onClose={() => setPopup(false)}>
          <span className="inline-flex mb-2"><LangToggle bn={bn} setBn={setBn} /></span>
          <AboutSection v={v} bn={bn} />
        </Modal>
      )}
    </div>
  );
}

function AboutSection({ v, bn }: { v: AboutRow; bn: boolean }) {
  const lang = bn ? "bn" : "en";
  const title = (bn ? v.title_bn : v.title_en) || "…";
  const body = bn ? v.body_bn : v.body_en;
  return (
    <div className="shop-scope overflow-hidden rounded-xl border border-neutral-200">
      <link href={SHOP_FONTS} rel="stylesheet" />
      <section className="bg-cream py-[64px]">
        <div className="max-w-[800px] mx-auto px-5">
          <div className="eyebrow !text-[14px] text-center">{lang === "bn" ? "আমাদের সম্পর্কে" : "About Us"}</div>
          <h1 className="font-serif text-[30px] md:text-[40px] mt-2 text-center">{title}</h1>
          <div className="gold-divider center" />
          <div className="flex flex-col gap-3 mt-2">
            {(body || "…").split(/\n+/).map((para, i) => (
              <p key={i} className="text-[18px] leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AboutForm({ initial }: { initial: AboutRow }) {
  const [v, setV] = useState<AboutRow>({ ...initial });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<AboutRow>) => setV((e) => ({ ...e, ...patch }));

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await saveAbout(v);
      setMsg("Saved. Shop updates shortly.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const inp = "mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3";
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <b>About page (text only)</b>
      <p className="-mt-2 text-sm text-neutral-500">The /about page shows only this title and text — no product promos.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <FieldHelp label="Title (EN)" help="About page headline in English."><input value={v.title_en} onChange={(e) => set({ title_en: e.target.value })} required maxLength={120} className={inp} /></FieldHelp>
        <FieldHelp label="Title (BN)" help="About page headline in Bangla."><input value={v.title_bn} onChange={(e) => set({ title_bn: e.target.value })} required maxLength={120} className={inp} /></FieldHelp>
      </div>
      <FieldHelp label="Body (EN)" help="Full about text. Line breaks become paragraphs."><textarea value={v.body_en} onChange={(e) => set({ body_en: e.target.value })} required maxLength={3000} rows={5} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></FieldHelp>
      <FieldHelp label="Body (BN)" help="Same text in Bangla."><textarea value={v.body_bn} onChange={(e) => set({ body_bn: e.target.value })} required maxLength={3000} rows={5} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></FieldHelp>
      <AboutPreview v={v} />
      {msg && <p className="text-sm font-semibold">{msg}</p>}
      <button disabled={busy} onClick={save} className="self-start inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
        <Check size={15} />{busy ? "Saving…" : "Save about"}
      </button>
    </div>
  );
}
