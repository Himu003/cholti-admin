"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ImagePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import FieldHelp from "../FieldHelp";
import GalleryPicker, { type GalleryItem } from "../GalleryPicker";
import { uploadWithProgress } from "@/lib/upload-client";
import { saveProduct } from "./actions";
import type { ProductRow, CatOpt, SubOpt, OptRow } from "./ProductsManager";
import type { FormControls as FormFlags } from "@/lib/admins";

export default function ProductForm({
  initial,
  cats,
  subs,
  fabrics,
  sizes,
  colors,
  forms,
  isNew,
  origSlug,
  backHref,
}: {
  initial: ProductRow;
  cats: CatOpt[];
  subs: SubOpt[];
  fabrics: OptRow[];
  sizes: OptRow[];
  colors: OptRow[];
  forms: FormFlags;
  isNew: boolean;
  origSlug: string;
  backHref: string;
}) {
  const [editing, setEditing] = useState<ProductRow>({ ...initial });
  const [formCat, setFormCat] = useState(initial.cat);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const raw = (initial.imgs?.length ? initial.imgs : initial.img ? [initial.img] : []).slice(0, 10);
    const urls = [...new Set(raw)];
    return urls.map((url, i) => ({ key: `e-${i}`, url, name: url }));
  });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [coverSrc, setCoverSrc] = useState(initial.imgs?.[0] ?? initial.img ?? "");
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<ProductRow>) => setEditing((e) => ({ ...e, ...patch }));

  const openGallery = (items: GalleryItem[]) => {
    setGallery(items);
    const first = items[0];
    if (first?.url) setCoverSrc(first.url);
    else if (first?.blob) {
      const url = URL.createObjectURL(first.blob);
      setCoverSrc((prev) => {
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      setCoverSrc((prev) => {
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return "";
      });
    }
    setGalleryOpen(false);
  };

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const get = (k: string) => String(fd.get(k) ?? "");
      const old = Number(get("old"));
      const now = Number(get("now"));
      if (!(old > 0) || !(now > 0) || now >= old) {
        setError("Sale price must be below old price (e.g. Old 1000, Sale 800).");
        return;
      }
      const urls: string[] = [];
      for (const g of gallery) {
        if (g.url) {
          if (!urls.includes(g.url)) urls.push(g.url);
        } else if (g.blob) {
          const ufd = new FormData();
          ufd.append("file", g.blob);
          ufd.append("folder", "products");
          const data = (await uploadWithProgress("/api/upload", ufd, () => {})) as { path?: string };
          if (!data.path) throw new Error("Image upload failed");
          if (!urls.includes(data.path)) urls.push(data.path);
        }
      }
      if (urls.length > 10) throw new Error("Maximum 10 photos.");
      await saveProduct({
        slug: get("slug").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        from: origSlug,
        name: get("name"), bn: get("bn"),
        description: get("description"),
        cat: get("cat"), sub: get("sub"),
        fabricIds: fabrics.length ? fd.getAll("fabricIds").map(String).slice(0, 30) : editing.fabricIds ?? [],
        sizeIds: sizes.length ? fd.getAll("sizeIds").map(String).slice(0, 30) : editing.sizeIds ?? [],
        colorIds: colors.length ? fd.getAll("colorIds").map(String).slice(0, 30) : editing.colorIds ?? [],
        best: fd.get("best") ? 1 : 0,
        hot: fd.get("hot") ? 1 : 0,
        old, now,
        rating: get("rating"), image: urls[0] ?? "", imgs: urls,
        badge: get("badge") || null,
        active: fd.get("active") ? 1 : 0,
      });
      window.location.href = backHref;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between mb-3">
        <h1 className="text-2xl font-bold">{isNew ? "New product" : "Edit product"}</h1>
        <Link href={backHref} className="rounded-lg border border-neutral-300 text-sm font-bold px-4 py-2 self-start">← Back to products</Link>
      </div>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <form action={submit} className="flex flex-col gap-4">
        <FormSavingOverlay />
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <b>Basics</b>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <input type="hidden" name="prevSlug" value={origSlug} />
            <FieldHelp label="Route" help="Website address ending: /product/<route>. Only small letters, numbers and dashes. You CAN change it later — the product moves to the new address (old saved links stop working, past orders keep the old name).">
              <input name="slug" value={editing.slug} onChange={(e) => set({ slug: e.target.value })} required maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <FieldHelp label="Category" help="Main section of the shop. Decides which category tile, category page (/shop/<id>) and home section show this product.">
              <select name="cat" value={editing.cat} onChange={(e) => { set({ cat: e.target.value, sub: "" }); setFormCat(e.target.value); }} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3">
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </FieldHelp>
            <FieldHelp label="Subcategory" help="Optional group inside the category. Shows as a filter chip shoppers can tap, with its own page (/shop/<cat>/<sub>). Pick “—” to list directly under the category.">
              <select name="sub" value={editing.sub} onChange={(e) => set({ sub: e.target.value })} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3">
                <option value="">— No subcategory —</option>
                {subs.filter((s) => s.cat === formCat).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FieldHelp>
            <div className="sm:col-span-2">
              <OptGroup
                title="Fabrics for this product"
                help="Which fabric buttons shoppers see on this product's page. Clear all = fabric row hidden on shop. Picked from Product Options."
                name="fabricIds"
                options={fabrics.map((f) => ({ id: f.id, label: f.name }))}
                selected={editing.fabricIds ?? []}
                onToggle={(id) => set({ fabricIds: toggleList(editing.fabricIds, id) })}
                onSelectAll={(ids) => set({ fabricIds: ids })}
              />
            </div>
            <div className="sm:col-span-2">
              <OptGroup
                title="Sizes for this product"
                help="Which size buttons shoppers see. Clear all = size row hidden on shop. Picked from Product Options."
                name="sizeIds"
                options={sizes.map((s) => ({ id: s.id, label: s.cats?.length ? `${s.name} (${s.cats.join(", ")})` : s.name }))}
                selected={editing.sizeIds ?? []}
                onToggle={(id) => set({ sizeIds: toggleList(editing.sizeIds, id) })}
                onSelectAll={(ids) => set({ sizeIds: ids })}
              />
            </div>
            <div className="sm:col-span-2">
              <OptGroup
                title="Colors for this product"
                help="Which color dots shoppers see. Clear all = color row hidden on shop. Picked from Product Options."
                name="colorIds"
                options={colors.map((c) => ({ id: c.id, label: c.name, swatch: c.hex }))}
                selected={editing.colorIds ?? []}
                onToggle={(id) => set({ colorIds: toggleList(editing.colorIds, id) })}
                onSelectAll={(ids) => set({ colorIds: ids })}
              />
            </div>
            <div className="sm:col-span-2">
            <FieldHelp label="Name" help="Big product title on the card and detail page, e.g. “China Magic Print Sofa Cover”. Also used in search.">
              <input name="name" value={editing.name} onChange={(e) => set({ name: e.target.value })} required maxLength={160} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            </div>
            <FieldHelp label="Short label" help="Search-only hint, e.g. “soft o sundor”. NOT shown on the site — only helps shoppers find this product via search.">
              <input name="bn" value={editing.bn} onChange={(e) => set({ bn: e.target.value })} maxLength={120} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <FieldHelp label="Badge (empty for none)" help="Small ribbon on the product photo, e.g. “Popular” or “New”. Leave empty for no ribbon.">
              <input name="badge" value={editing.badge ?? ""} onChange={(e) => set({ badge: e.target.value || null })} maxLength={30} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <div className="sm:col-span-2">
            <FieldHelp label="Description" help="Full product details shown under the Description tab on the product page. Line breaks become paragraphs.">
              <textarea name="description" value={editing.description ?? ""} onChange={(e) => set({ description: e.target.value })} maxLength={2000} rows={4} placeholder="Fabric, size, wash care, delivery note…" className="mt-1 w-full border border-neutral-300 rounded-lg p-3" />
            </FieldHelp>
            </div>
            <FieldHelp label="Old price (৳)" help="Crossed-out price next to the sale price. Discount % is calculated from old vs sale automatically.">
              <input name="old" type="number" min={0} value={editing.old} onChange={(e) => set({ old: Number(e.target.value) })} required className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <FieldHelp label="Sale price (৳)" help="The price customers pay. Shown big in red on card and detail page.">
              <input name="now" type="number" min={0} value={editing.now} onChange={(e) => set({ now: Number(e.target.value) })} required className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <FieldHelp label="Rating text" help="Shown as ★★★★★ plus this text under the title, e.g. “4.9 (98)”. Free text — update it when real reviews come in.">
              <input name="rating" value={editing.rating} onChange={(e) => set({ rating: e.target.value })} maxLength={40} placeholder="4.9 (98)" className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <FieldHelp label="Photos (first = main)" help="Shop card shows the first photo; detail page shows all. Tap to pick many at once or drag & drop. Big files ask to compress (unless Smart Upload is on).">
              <span className="flex gap-2 mt-1 items-center">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2"
                >
                  <ImagePlus size={15} />
                  {gallery.length ? `Photos (${gallery.length})` : "Add photos"}
                </button>
                {gallery.length > 0 && (
                  <span className="flex -space-x-2">
                    {gallery.slice(0, 4).map((g) => (
                      <GalleryThumb key={g.key} item={g} />
                    ))}
                  </span>
                )}
              </span>
            </FieldHelp>
          </div>
          <ProductPreview p={editing} cats={cats} subs={subs} cover={coverSrc || editing.img} />
          <label className="text-sm flex items-center gap-2 mt-3"><input type="checkbox" name="best" checked={(editing.tags ?? []).includes("best")} onChange={(e) => set({ tags: e.target.checked ? [...(editing.tags ?? []).filter((t) => t !== "best"), "best"] : (editing.tags ?? []).filter((t) => t !== "best") })} /> Best seller</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="hot" checked={(editing.tags ?? []).includes("hot")} onChange={(e) => set({ tags: e.target.checked ? [...(editing.tags ?? []).filter((t) => t !== "hot"), "hot"] : (editing.tags ?? []).filter((t) => t !== "hot") })} /> Offers Hot <span className="bg-neutral-900 text-white text-[11px] font-extrabold rounded-full px-1.5 py-0.5">HOT</span></label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" checked={!!editing.active} onChange={(e) => set({ active: e.target.checked ? 1 : 0 })} /> Active</label>
          <div className="flex gap-2">
            <ProductSaveButton />
            <Link href={backHref} className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5">Cancel</Link>
          </div>
        </div>
      </form>
      {galleryOpen && (
        <GalleryPicker
          initial={gallery}
          smart={forms.smartUpload}
          hq={forms.highQuality}
          allowUrl={forms.imageUrl}
          allowFiles={forms.upload}
          onDone={openGallery}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}

function FormSavingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl">
        <Loader2 size={22} className="animate-spin text-neutral-900" />
        <b className="text-[15px]">Saving…</b>
      </div>
    </div>
  );
}

function ProductSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50"
    >
      <Check size={15} />
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function toggleList(arr: string[] | undefined, id: string): string[] {
  const cur = arr ?? [];
  return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
}

function OptGroup({
  title,
  help,
  name,
  options,
  selected,
  onToggle,
  onSelectAll,
}: {
  title: string;
  help: string;
  name: string;
  options: { id: string; label: string; swatch?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}) {
  if (!options.length) return null;
  const all = options.map((o) => o.id);
  const allOn = all.length > 0 && all.every((id) => selected.includes(id));
  return (
    <div>
      <span className="block text-sm font-medium">
        {title}
        <span className="block md:inline text-xs font-normal text-neutral-400">(empty = hidden on shop)</span>
      </span>
      <span className="block text-xs text-neutral-400 mb-1">{help}</span>
      <div className="flex gap-1.5 mb-1.5">
        <button
          type="button"
          onClick={() => onSelectAll(allOn ? [] : all)}
          className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-bold hover:bg-neutral-100"
        >
          {allOn ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 max-h-32 overflow-y-auto">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <label key={o.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-bold cursor-pointer ${on ? "bg-neutral-900 text-white border-neutral-900" : "bg-white border-neutral-300"}`}>
              <input type="checkbox" name={name} value={o.id} checked={on} onChange={() => onToggle(o.id)} className="hidden" />
              {o.swatch && <span className="w-4 h-4 rounded-full border border-white/60 inline-block" style={{ background: o.swatch }} />}
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function GalleryThumb({ item }: { item: GalleryItem }) {
  const [src, setSrc] = useState(item.url ?? "");
  useEffect(() => {
    if (item.url) return;
    if (!item.blob) return;
    const url = URL.createObjectURL(item.blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [item]);
  if (!src) return <span className="w-8 h-8 rounded-lg bg-neutral-200 border border-white" />;
  return <img src={src} alt="" className="w-8 h-8 rounded-lg object-cover border border-white" />;
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 inline-block align-middle text-[10px] font-bold uppercase tracking-wide bg-neutral-900 text-white rounded px-1.5 py-px">
      {children}
    </span>
  );
}

function ProductPreview({ p, cats, subs, cover }: { p: ProductRow; cats: CatOpt[]; subs: SubOpt[]; cover?: string }) {
  const catName = cats.find((c) => c.id === p.cat)?.name ?? p.cat ?? "—";
  const subName = subs.find((s) => s.id === p.sub)?.name;
  const off = p.old > 0 && p.now < p.old ? Math.round(((p.old - p.now) / p.old) * 100) : 0;
  const best = (p.tags ?? []).includes("best");
  const hot = (p.tags ?? []).includes("hot");
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <b className="text-sm">Website preview — updates as you type</b>
      <p className="text-xs text-neutral-500 break-all">/product/{p.slug || "…"}</p>
      <div className="mt-2 flex gap-3 items-center bg-white border border-neutral-200 rounded-xl p-3">
        {cover || p.img ? (
          <img src={cover || p.img} alt="" className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0" />
        ) : (
          <span className="w-16 h-16 rounded-xl bg-neutral-100 grid place-items-center text-neutral-400 text-xs shrink-0">no img</span>
        )}
        <div className="min-w-0">
          {p.badge ? <span className="inline-block text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">{p.badge}</span> : <span className="text-xs text-neutral-400">no ribbon</span>}<Mark>Badge</Mark>
          <b className="block truncate">{p.name || "Product name"}</b>
          {p.bn ? <span className="block text-xs text-neutral-500 truncate">{p.bn}</span> : <span className="block text-xs text-neutral-400">no short label</span>}<Mark>Short label · search only</Mark>
          <span className="block text-xs text-neutral-500">★★★★★ {p.rating || "…"}</span>
          <span className="block text-sm font-bold">৳{Number(p.now || 0).toLocaleString()} <s className="font-normal text-neutral-400">৳{Number(p.old || 0).toLocaleString()}</s>{off > 0 && <span className="text-green-700"> −{off}%</span>}</span>
        </div>
      </div>
      <p className="text-xs text-neutral-600 mt-2">
        Shows in: <b>{catName}</b>{subName ? <> → <b>{subName}</b></> : " (category page + home)"}{best ? " • Best-seller tab" : ""}{hot ? " • Offers Hot" : ""}{p.active ? "" : " • HIDDEN (inactive)"}
      </p>
    </div>
  );
}
