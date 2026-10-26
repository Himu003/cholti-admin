"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "../Modal";
import UploadButton from "../UploadButton";
import FieldHelp from "../FieldHelp";
import SaveButtons from "../SaveButtons";
import { flushUploads } from "@/lib/upload-client";
import { saveCategory, toggleCategory, deleteCategory } from "../actions";
import { saveSubcategory, toggleSubcategory, deleteSubcategory } from "../subcategories/actions";
import type { FormControls as FormFlags } from "@/lib/admins";

export type CategoryRow = { id: string; name: string; bn: string; img: string; count_label: string; badge: string | null; active: number };
export type SubRow = { id: string; name: string; bn: string; cat: string; img: string; count_label: string; badge: string | null; active: number };
const EMPTY: CategoryRow = { id: "", name: "", bn: "", img: "", count_label: "", badge: null, active: 1 };
const EMPTY_SUB: SubRow = { id: "", name: "", bn: "", cat: "", img: "", count_label: "", badge: null, active: 1 };

export default function CategoriesManager({ rows, subs, forms }: { rows: CategoryRow[]; subs: SubRow[]; forms: FormFlags }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editingSub, setEditingSub] = useState<SubRow | null>(null);
  const setC = (patch: Partial<CategoryRow>) => setEditing((e) => (e ? { ...e, ...patch } : e));
  const setS = (patch: Partial<SubRow>) => setEditingSub((e) => (e ? { ...e, ...patch } : e));
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const [armDelSub, setArmDelSub] = useState<string | null>(null);

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

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");
  const isNew = !!editing && !rows.some((r) => r.id === editing.id);
  const isNewSub = !!editingSub && !subs.some((r) => r.id === editingSub.id);
  const subsOf = (catId: string) => subs.filter((s) => s.cat === catId);

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const up = await flushUploads();
      if (!up.ok) throw new Error(up.error ?? "Image upload failed");
      for (const [k, v] of Object.entries(up.urls ?? {})) fd.set(k, v);
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveCategory({
        id: get("id").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        name: get("name"), bn: get("bn"), img: get("img"),
        count_label: get("count_label"), badge: get("badge") || null,
        active: fd.get("active") ? 1 : 0,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
    }
  };

  const submitSub = async (fd: FormData) => {
    setError(null);
    try {
      const up = await flushUploads();
      if (!up.ok) throw new Error(up.error ?? "Image upload failed");
      for (const [k, v] of Object.entries(up.urls ?? {})) fd.set(k, v);
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveSubcategory({
        id: get("id").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        name: get("name"), bn: get("bn"), cat: get("cat"), img: get("img"),
        count_label: get("count_label"), badge: get("badge") || null,
        active: fd.get("active") ? 1 : 0,
      });
      setEditingSub(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Categories ({rows.length})</h1>
        <button onClick={() => { setEditing({ ...EMPTY }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2"><Plus size={15} />Add</button>
      </div>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">{c.name}<br /><span className="font-normal text-neutral-500">{c.id} • {c.count_label}</span>
                  <span className="block mt-1.5 font-normal">
                    {subsOf(c.id).map((s) => (
                      <span key={s.id} className={`mr-1.5 mb-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${s.active ? "border-neutral-300 bg-neutral-50" : "border-neutral-200 bg-neutral-100 text-neutral-400"}`}>
                        {s.name}
                        <button onClick={() => runRow(s.id, () => toggleSubcategory(s.id, s.active ? 0 : 1))} disabled={pending === s.id} className="font-bold underline disabled:opacity-60">{pending === s.id ? "…" : s.active ? "On" : "Off"}</button>
                        <button onClick={() => { setEditingSub({ ...s }); setError(null); setArmDelSub(null); }} className="font-bold underline">Edit</button>
                        {armDelSub === s.id ? (
                          <button onClick={() => runRow(s.id, async () => { await deleteSubcategory(s.id); setArmDelSub(null); })} className="font-bold text-red-700">Sure?</button>
                        ) : (
                          <button onClick={() => setArmDelSub(s.id)} className="font-bold text-red-700">Del</button>
                        )}
                      </span>
                    ))}
                    <button onClick={() => { setEditingSub({ ...EMPTY_SUB, cat: c.id }); setError(null); setArmDelSub(null); }} className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-400 px-2 py-0.5 text-xs font-bold text-neutral-600"><Plus size={12} />Sub</button>
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => runRow(c.id, () => toggleCategory(c.id, c.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === c.id}>
                    {pending === c.id ? <Loader2 size={12} className="animate-spin" /> : c.active ? "On" : "Off"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing({ ...c }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 font-bold underline"><Pencil size={13} />Edit</button>
                  {armDel === c.id ? (
                    <button onClick={() => runRow(c.id, async () => { await deleteCategory(c.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(c.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {rows.map((c) => (
            <div key={c.id} className="p-3 border-b border-neutral-100 last:border-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <b className="block text-sm">{c.name}</b>
                  <span className="block text-xs text-neutral-500 truncate">{c.id} • {c.count_label}</span>
                </div>
                <button onClick={() => runRow(c.id, () => toggleCategory(c.id, c.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${c.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === c.id}>
                  {pending === c.id ? <Loader2 size={12} className="animate-spin" /> : c.active ? "On" : "Off"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subsOf(c.id).map((s) => (
                  <span key={s.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${s.active ? "border-neutral-300 bg-neutral-50" : "border-neutral-200 bg-neutral-100 text-neutral-400"}`}>
                    {s.name}
                    <button onClick={() => runRow(s.id, () => toggleSubcategory(s.id, s.active ? 0 : 1))} disabled={pending === s.id} className="font-bold underline disabled:opacity-60">{pending === s.id ? "…" : s.active ? "On" : "Off"}</button>
                    <button onClick={() => { setEditingSub({ ...s }); setError(null); setArmDelSub(null); }} className="font-bold underline">Edit</button>
                    {armDelSub === s.id ? (
                      <button onClick={() => runRow(s.id, async () => { await deleteSubcategory(s.id); setArmDelSub(null); })} className="font-bold text-red-700">Sure?</button>
                    ) : (
                      <button onClick={() => setArmDelSub(s.id)} className="font-bold text-red-700">Del</button>
                    )}
                  </span>
                ))}
                <button onClick={() => { setEditingSub({ ...EMPTY_SUB, cat: c.id }); setError(null); setArmDelSub(null); }} className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-400 px-2 py-0.5 text-xs font-bold text-neutral-600"><Plus size={12} />Sub</button>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => { setEditing({ ...c }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold underline"><Pencil size={13} />Edit</button>
                {armDel === c.id ? (
                  <button onClick={() => runRow(c.id, async () => { await deleteCategory(c.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(c.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <Modal title={isNew ? "New category" : "Edit category"} onClose={() => setEditing(null)}>
        <form action={submit} className="flex flex-col gap-3">
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldHelp label="ID" help="Unique web address part: /shop/<id>. Lowercase letters, numbers and dashes. Never change later — links use it."><input name="id" defaultValue={editing.id} required maxLength={40} readOnly={!isNew} className={`mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3 ${!isNew ? "bg-neutral-100" : ""}`} /></FieldHelp>
            <FieldHelp label="Name" help="Category title on home tiles and the Shop page, e.g. “Sofa Cover”."><input name="name" value={editing.name} onChange={(e) => setC({ name: e.target.value })} required maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Bangla name" help="Shown instead of Name when the shop is in Bangla."><input name="bn" value={editing.bn} onChange={(e) => setC({ bn: e.target.value })} maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Badge" help="Small ribbon on the category tile, e.g. “Popular”. Empty = none."><input name="badge" value={editing.badge ?? ""} onChange={(e) => setC({ badge: e.target.value || null })} maxLength={30} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Count label" help="Small text under the tile, e.g. “24 designs”. Free text."><input name="count_label" value={editing.count_label} onChange={(e) => setC({ count_label: e.target.value })} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Image URL" help="Category tile photo. Upload here or paste a link."><span className="flex gap-2 mt-1">
                {forms.imageUrl && <input name="img" value={editing.img} onChange={(e) => setC({ img: e.target.value })} maxLength={500} className="flex-1 h-10 border border-neutral-300 rounded-lg px-3" />}
                {!forms.imageUrl && <input type="hidden" name="img" value={editing.img} />}
                {forms.upload && <UploadButton target="img" folder="categories" smart={forms.smartUpload} hq={forms.highQuality} onUploaded={(url) => setC({ img: url })} />}
                {!forms.imageUrl && !forms.upload && <span className="text-xs text-neutral-500 self-center">Image inputs turned off in Settings &gt; Uploads.</span>}
              </span></FieldHelp>
          </div>
          <CategoryPreview name={editing.name} bn={editing.bn} badge={editing.badge} count={editing.count_label} img={editing.img} />
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editing.active} /> Active</label>
          <div className="flex gap-2">
            <SaveButtons onCancel={() => setEditing(null)} />
          </div>
        </form>
        </Modal>
      )}
      {editingSub && (
        <Modal title={isNewSub ? "New subcategory" : "Edit subcategory"} onClose={() => setEditingSub(null)}>
        <form action={submitSub} className="flex flex-col gap-3">
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldHelp label="Parent category" help="Which category tile this group lives under. Appears as a filter chip there."><select name="cat" defaultValue={editingSub.cat} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3">
                {rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></FieldHelp>
            <FieldHelp label="ID" help="Unique web address part: /shop/<cat>/<id>. Never change later."><input name="id" defaultValue={editingSub.id} required maxLength={40} readOnly={!isNewSub} className={`mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3 ${!isNewSub ? "bg-neutral-100" : ""}`} /></FieldHelp>
            <FieldHelp label="Name" help="Filter chip title shoppers tap, e.g. “Floral”."><input name="name" value={editingSub.name} onChange={(e) => setS({ name: e.target.value })} required maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Bangla name" help="Shown instead of Name when the shop is in Bangla."><input name="bn" value={editingSub.bn} onChange={(e) => setS({ bn: e.target.value })} maxLength={80} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Badge" help="Small ribbon on the tile, e.g. “Popular”. Empty = none."><input name="badge" value={editingSub.badge ?? ""} onChange={(e) => setS({ badge: e.target.value || null })} maxLength={30} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <FieldHelp label="Count label" help="Small text under the tile, e.g. “24 designs”. Free text."><input name="count_label" value={editingSub.count_label} onChange={(e) => setS({ count_label: e.target.value })} maxLength={40} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></FieldHelp>
            <label className="text-sm sm:col-span-2">Image URL
              <span className="flex gap-2 mt-1">
                {forms.imageUrl && <input name="img" value={editingSub.img} onChange={(e) => setS({ img: e.target.value })} maxLength={500} className="flex-1 h-10 border border-neutral-300 rounded-lg px-3" />}
                {!forms.imageUrl && <input type="hidden" name="img" value={editingSub.img} />}
                {forms.upload && <UploadButton target="img" folder="subcategories" smart={forms.smartUpload} hq={forms.highQuality} onUploaded={(url) => setS({ img: url })} />}
                {!forms.imageUrl && !forms.upload && <span className="text-xs text-neutral-500 self-center">Image inputs turned off in Settings &gt; Uploads.</span>}
              </span>
            </label>
          </div>
          <CategoryPreview name={editingSub.name} bn={editingSub.bn} badge={editingSub.badge} count={editingSub.count_label} img={editingSub.img} />
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editingSub.active} /> Active</label>
          <div className="flex gap-2">
            <SaveButtons onCancel={() => setEditingSub(null)} />
          </div>
        </form>
        </Modal>
      )}
    </div>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 inline-block align-middle text-[10px] font-bold uppercase tracking-wide bg-neutral-900 text-white rounded px-1.5 py-px">
      {children}
    </span>
  );
}

function CategoryPreview({ name, bn, badge, count, img }: { name: string; bn: string; badge: string | null; count: string; img: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <div className="mt-2 bg-white border border-neutral-200 rounded-xl p-3 text-center">
        <span className="relative inline-block">
          {img ? (
            <img src={img} alt="" className="w-20 h-20 rounded-full object-cover border border-neutral-200" />
          ) : (
            <span className="w-20 h-20 rounded-full bg-neutral-100 grid place-items-center text-neutral-400 text-xs">no img</span>
          )}
          {badge ? (
            <span className="absolute top-0 right-0 bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-extrabold rounded-full px-2 py-0.5">{badge}</span>
          ) : null}
        </span>
        <span className="block mt-1 text-xs">
          {badge ? <>ribbon “{badge}”</> : <span className="text-neutral-400">no ribbon</span>}<Mark>Badge</Mark>
        </span>
        <b className="block mt-1.5">{name || "Name"}</b>
        <span className="block text-xs text-neutral-500">
          {bn ? <>BN mode shows “{bn}”</> : <span className="text-neutral-400">no Bangla name</span>}<Mark>Bangla name</Mark>
        </span>
        <span className="block text-xs text-neutral-500 mt-1">
          {count ? count : <span className="text-neutral-400">no count text</span>}<Mark>Count label</Mark>
        </span>
      </div>
    </div>
  );
}
