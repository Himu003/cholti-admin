"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "../Modal";
import SaveButtons from "../SaveButtons";
import { saveFaq, toggleFaq, deleteFaq } from "../actions";

export type FaqRow = { id: string; q_en: string; a_en: string; q_bn: string; a_bn: string; active: number };
const EMPTY: FaqRow = { id: "", q_en: "", a_en: "", q_bn: "", a_bn: "", active: 1 };

export default function FaqsManager({ rows }: { rows: FaqRow[] }) {
  const [editing, setEditing] = useState<FaqRow | null>(null);
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

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Action failed");
  const isNew = !!editing && !rows.some((r) => r.id === editing.id);

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveFaq({
        id: get("id"), q_en: get("q_en"), a_en: get("a_en"), q_bn: get("q_bn"), a_bn: get("a_bn"),
        active: fd.get("active") ? 1 : 0,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">FAQs ({rows.length})</h1>
        <button onClick={() => { setEditing({ ...EMPTY }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2"><Plus size={15} />Add</button>
      </div>
      <p className="text-sm text-neutral-500 mb-3">Preset questions for the chat widget. Empty Bangla falls back to English on the site.</p>
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">{f.q_en}<br /><span className="font-normal text-neutral-500">{f.a_en.slice(0, 80)}{f.a_en.length > 80 ? "…" : ""}</span></td>
                <td className="p-3">
                  <button onClick={() => runRow(f.id, () => toggleFaq(f.id, f.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${f.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === f.id}>
                    {pending === f.id ? <Loader2 size={12} className="animate-spin" /> : f.active ? "On" : "Off"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing({ ...f }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 font-bold underline"><Pencil size={13} />Edit</button>
                  {armDel === f.id ? (
                    <button onClick={() => runRow(f.id, async () => { await deleteFaq(f.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(f.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-neutral-500">No FAQs yet. The chat widget hides the question list until you add some.</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {rows.map((f) => (
            <div key={f.id} className="p-3 border-b border-neutral-100 last:border-0">
              <b className="block text-sm">{f.q_en}</b>
              <span className="block text-xs text-neutral-500 mt-0.5">{f.a_en.slice(0, 80)}{f.a_en.length > 80 ? "…" : ""}</span>
              <div className="flex gap-1 mt-2">
                <button onClick={() => runRow(f.id, () => toggleFaq(f.id, f.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${f.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === f.id}>
                  {pending === f.id ? <Loader2 size={12} className="animate-spin" /> : f.active ? "On" : "Off"}
                </button>
                <button onClick={() => { setEditing({ ...f }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold underline"><Pencil size={13} />Edit</button>
                {armDel === f.id ? (
                  <button onClick={() => runRow(f.id, async () => { await deleteFaq(f.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(f.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!rows.length && <p className="p-4 text-sm text-neutral-500">No FAQs yet. The chat widget hides the question list until you add some.</p>}
        </div>
      </div>
      {editing && (
        <Modal title={isNew ? "New FAQ" : "Edit FAQ"} onClose={() => setEditing(null)}>
        <form action={submit} className="flex flex-col gap-3">
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <input type="hidden" name="id" value={isNew ? "" : editing.id} />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">Question (EN)<input name="q_en" defaultValue={editing.q_en} required maxLength={300} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm">Question (BN)<input name="q_bn" defaultValue={editing.q_bn} maxLength={300} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
            <label className="text-sm sm:col-span-2">Answer (EN)<textarea name="a_en" defaultValue={editing.a_en} required maxLength={600} rows={2} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></label>
            <label className="text-sm sm:col-span-2">Answer (BN)<textarea name="a_bn" defaultValue={editing.a_bn} maxLength={600} rows={2} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></label>
          </div>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editing.active} /> Active</label>
          <div className="flex gap-2">
            <SaveButtons onCancel={() => setEditing(null)} />
          </div>
        </form>
        </Modal>
      )}
    </div>
  );
}
