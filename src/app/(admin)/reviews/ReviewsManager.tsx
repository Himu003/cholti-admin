"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { addReview, toggleReview, deleteReview } from "../actions";
import SaveButtons from "../SaveButtons";

export type ReviewRow = { id: string; text: string; name: string; area: string; active: number };

export default function ReviewsManager({ rows }: { rows: ReviewRow[] }) {
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

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      await addReview({ text: String(fd.get("text") ?? ""), name: String(fd.get("name") ?? ""), area: String(fd.get("area") ?? "") });
      (document.getElementById("review-form") as HTMLFormElement | null)?.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Reviews ({rows.length})</h1>
      <p className="text-sm text-neutral-500 mb-3">Only real customer reviews. Nothing is pre-filled.</p>
      <form id="review-form" action={submit} className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col gap-3">
        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        <label className="text-sm">Review text<textarea name="text" required maxLength={300} rows={2} className="mt-1 w-full border border-neutral-300 rounded-lg p-3" /></label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Name<input name="name" required maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
          <label className="text-sm">Area<input name="area" maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" /></label>
        </div>
        <SaveButtons saveLabel="Add review" rowClassName="flex gap-2 self-start" />
      </form>
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mt-4">
        <table className="hidden md:table w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3">"{r.text}"<br /><span className="text-neutral-500">{r.name} • {r.area}</span></td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => runRow(r.id, () => toggleReview(r.id, r.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === r.id}>
                    {pending === r.id ? <Loader2 size={12} className="animate-spin" /> : r.active ? "On" : "Off"}
                  </button>
                  {armDel === r.id ? (
                    <button onClick={() => runRow(r.id, async () => { await deleteReview(r.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(r.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-neutral-500">No reviews yet. The shop shows a TBD notice until you add real ones.</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {rows.map((r) => (
            <div key={r.id} className="p-3 border-b border-neutral-100 last:border-0">
              <p className="text-sm">“{r.text}”</p>
              <p className="text-xs text-neutral-500 mt-0.5">{r.name} • {r.area}</p>
              <div className="flex gap-1 mt-2">
                <button onClick={() => runRow(r.id, () => toggleReview(r.id, r.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === r.id}>
                  {pending === r.id ? <Loader2 size={12} className="animate-spin" /> : r.active ? "On" : "Off"}
                </button>
                {armDel === r.id ? (
                  <button onClick={() => runRow(r.id, async () => { await deleteReview(r.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(r.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!rows.length && <p className="p-4 text-sm text-neutral-500">No reviews yet. The shop shows a TBD notice until you add real ones.</p>}
        </div>
      </div>
    </div>
  );
}
