"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck, Loader2 } from "lucide-react";
import Modal from "../Modal";
import FieldHelp from "../FieldHelp";
import SaveButtons from "../SaveButtons";
import { saveZone, toggleZone, deleteZone } from "../actions";

export type ZoneRow = { id: string; name_en: string; name_bn: string; charge: number; active: number };

const EMPTY: ZoneRow = { id: "", name_en: "", name_bn: "", charge: 0, active: 1 };

export default function ZonesManager({ zones }: { zones: ZoneRow[] }) {
  const [editing, setEditing] = useState<ZoneRow | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const runRow = async (id: string, fn: () => Promise<unknown>) => {
    if (pending) return;
    setPending(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPending(null);
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const isNew = !!editing && !zones.some((r) => r.id === editing.id);

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveZone({
        id: get("id"),
        name_en: get("name_en"),
        name_bn: get("name_bn"),
        charge: Number(get("charge")),
        active: fd.get("active") ? 1 : 0,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
      <span className="flex items-center justify-between">
        <b>Delivery areas</b>
        <button onClick={() => { setEditing({ ...EMPTY }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2"><Plus size={15} />Add area</button>
      </span>
      <p className="-mt-2 text-sm text-neutral-500">Checkout shows these areas with their charge. Turn one off to hide it from shoppers — at least one must stay on.</p>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <div className="flex flex-col gap-1.5">
        {zones.map((r) => (
          <div key={r.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 ${r.active ? "border-neutral-200" : "bg-neutral-50 border-neutral-200 opacity-75"}`}>
            <span className="w-9 h-9 grid place-items-center rounded-lg bg-neutral-900 text-white shrink-0"><Truck size={16} /></span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm truncate">{r.name_en}{r.name_bn ? <span className="font-normal text-neutral-500"> • {r.name_bn}</span> : null}</b>
              <span className="block text-xs text-neutral-500">৳{r.charge.toLocaleString()} delivery</span>
            </span>
            <button onClick={() => runRow(r.id, () => toggleZone(r.id, r.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${r.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === r.id}>
              {pending === r.id ? <Loader2 size={12} className="animate-spin" /> : r.active ? "On" : "Off"}
            </button>
            <span className="whitespace-nowrap shrink-0">
              <button onClick={() => { setEditing({ ...r }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 text-sm font-bold underline"><Pencil size={13} />Edit</button>
              {armDel === r.id ? (
                <button onClick={() => runRow(r.id, async () => { await deleteZone(r.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
              ) : (
                <button onClick={() => setArmDel(r.id)} className="inline-flex items-center gap-1 px-2 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
              )}
            </span>
          </div>
        ))}
        {!zones.length && <p className="text-sm text-neutral-500">Nothing here yet — the shop shows Inside Dhaka ৳80 and Outside Dhaka ৳130.</p>}
      </div>
      {editing && (
        <Modal title={isNew ? "New delivery area" : "Edit delivery area"} onClose={() => setEditing(null)}>
          <form action={submit} className="flex flex-col gap-3">
            {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
            <input type="hidden" name="id" value={isNew ? "" : editing.id} />
            <div className="grid sm:grid-cols-2 gap-3">
              <FieldHelp label="Name (EN)" help="Shown at checkout, e.g. “Inside Dhaka”.">
                <input name="name_en" defaultValue={editing.name_en} required maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
              </FieldHelp>
              <FieldHelp label="Name (BN)" help="Bangla name. Falls back to English if empty.">
                <input name="name_bn" defaultValue={editing.name_bn} maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
              </FieldHelp>
            </div>
            <FieldHelp label="Charge (৳)" help="Delivery fee shoppers pay for this area. 0 = free delivery.">
              <input name="charge" type="number" min={0} max={10000} defaultValue={editing.charge} required className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
            </FieldHelp>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editing.active} /> Active (off hides it from checkout)</label>
            <div className="flex gap-2">
              <SaveButtons onCancel={() => setEditing(null)} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
