"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shirt, Ruler, Palette, ChevronDown, Loader2 } from "lucide-react";
import Modal from "../Modal";
import FieldHelp from "../FieldHelp";
import SaveButtons from "../SaveButtons";
import { saveOption, toggleOption, deleteOption, saveOptionVisibility } from "./actions";

export type OptionRow = { id: string; name: string; extra: string; active: number };
export type OptionVis = { fabrics: boolean; sizes: boolean; colors: boolean };
type Kind = "fabrics" | "sizes" | "colors";

const KINDS: { id: Kind; label: string; Icon: typeof Shirt; tagline: string; nameHelp: string; extraLabel: string; extraHelp: string; extraPh: string }[] = [
  {
    id: "fabrics", label: "Fabrics", Icon: Shirt, tagline: "Fabric buttons on the product page",
    nameHelp: "Fabric button on the product page, e.g. “Korean Velvet”. Shows for every product.",
    extraLabel: "", extraHelp: "", extraPh: "",
  },
  {
    id: "sizes", label: "Sizes", Icon: Ruler, tagline: "Size buttons like King or 7ft",
    nameHelp: "Size button on the product page, e.g. “King” or “7ft”.",
    extraLabel: "Categories (comma, empty = all)",
    extraHelp: "Which categories see this size, e.g. “bedsheet, curtain”. Empty = every category.",
    extraPh: "bedsheet, curtain",
  },
  {
    id: "colors", label: "Colors", Icon: Palette, tagline: "Color dots shoppers tap",
    nameHelp: "Color dot name on the product page, e.g. “Terracotta”. Hover shows the name.",
    extraLabel: "Color code (#rrggbb)",
    extraHelp: "The dot color. Pick with any color picker, e.g. #BC4621.",
    extraPh: "#BC4621",
  },
];

const EMPTY: OptionRow = { id: "", name: "", extra: "", active: 1 };

function Switch({ checked, onFlip, label }: { checked: boolean; onFlip: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onFlip}
      className={`relative ml-auto w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-green-600" : "bg-neutral-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export default function OptionsManager({ fabrics, sizes, colors, vis, cats }: { fabrics: OptionRow[]; sizes: OptionRow[]; colors: OptionRow[]; vis: OptionVis; cats: { id: string; name: string }[] }) {
  const [kind, setKind] = useState<Kind>("fabrics");
  const [editing, setEditing] = useState<OptionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armDel, setArmDel] = useState<string | null>(null);
  const [on, setOn] = useState<OptionVis>(vis);
  const [pending, setPending] = useState<string | null>(null);
  const [visOpen, setVisOpen] = useState(false);
  useEffect(() => {
    let stored: boolean | null = null;
    try {
      const raw = localStorage.getItem("cholti_optvis_open");
      if (raw !== null) stored = raw === "1";
    } catch {}
    setVisOpen(stored ?? (!vis.fabrics || !vis.sizes || !vis.colors));
  }, []);
  const rows = kind === "fabrics" ? fabrics : kind === "sizes" ? sizes : colors;
  const meta = KINDS.find((k) => k.id === kind)!;
  const isNew = !!editing && !rows.some((r) => r.id === editing.id);

  const submit = async (fd: FormData) => {
    setError(null);
    try {
      const get = (k: string) => String(fd.get(k) ?? "");
      await saveOption({
        kind,
        id: get("id"),
        name: get("name"),
        extra: kind === "sizes" ? fd.getAll("cats").map(String).join(", ") : get("extra"),
        active: fd.get("active") ? 1 : 0,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

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

  const flip = async (id: Kind) => {
    const next = !on[id];
    setOn((o) => ({ ...o, [id]: next }));
    try {
      await saveOptionVisibility(id, next);
    } catch (e) {
      setOn((o) => ({ ...o, [id]: !next }));
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const hidden = (Object.keys(on) as Kind[]).filter((k) => !on[k]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Product Options</h1>
      <p className="text-sm text-neutral-500 mb-3">Fabric, size and color buttons on the product page. Changes go live within a minute.</p>
      <div className="bg-white border border-neutral-200 rounded-2xl p-2 mb-3">
        <button
          onClick={() => {
            setVisOpen((o) => {
              try {
                localStorage.setItem("cholti_optvis_open", !o ? "1" : "0");
              } catch {}
              return !o;
            });
          }}
          aria-expanded={visOpen}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${on.fabrics && on.sizes && on.colors ? "bg-green-600" : "bg-amber-500"}`} />
          <span className="min-w-0">
            <b className="block text-xs uppercase tracking-wide text-neutral-500">Show on shop</b>
            <span className="block text-[13px] text-neutral-600 truncate">
              {hidden.length ? `${hidden.map((k) => KINDS.find((x) => x.id === k)!.label).join(" • ")} hidden` : "Fabrics • Sizes • Colors visible"}
            </span>
          </span>
          <ChevronDown size={15} className={`ml-auto text-neutral-400 transition-transform shrink-0 ${visOpen ? "" : "-rotate-90"}`} />
        </button>
        {visOpen && (
          <div className="flex flex-col gap-1 mt-1">
            {KINDS.map(({ id, label, Icon, tagline }) => (
              <div key={id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${on[id] ? "" : "bg-neutral-50"}`}>
                <span className={`w-9 h-9 grid place-items-center rounded-lg shrink-0 ${on[id] ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <b className="block text-sm">{label}</b>
                  <span className="block text-xs text-neutral-500 truncate">{on[id] ? tagline : "Hidden on the shop"}</span>
                </span>
                <Switch checked={on[id]} onFlip={() => flip(id)} label={`${label} on shop`} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {KINDS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { setKind(id); setEditing(null); setError(null); setArmDel(null); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold ${kind === id ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"}`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
        <button onClick={() => { setEditing({ ...EMPTY }); setError(null); setArmDel(null); }} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-4 py-2"><Plus size={15} />Add</button>
      </div>
      {!on[kind] && (
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          <span className="flex-1">{meta.label} are hidden on the shop right now.</span>
          <button onClick={() => flip(kind)} className="rounded-lg bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 shrink-0">Turn on</button>
        </div>
      )}
      {error && <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="hidden md:table w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {kind === "colors" && r.extra && <span className="w-5 h-5 rounded-full border border-neutral-300 inline-block" style={{ background: r.extra }} />}
                    {r.name}
                  </span>
                  <br /><span className="font-normal text-neutral-500">{r.id}{r.extra && kind !== "colors" ? ` • ${r.extra}` : ""}</span>
                </td>
                <td className="p-3">
                  <button onClick={() => runRow(r.id, () => toggleOption(kind, r.id, r.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === r.id}>
                    {pending === r.id ? <Loader2 size={12} className="animate-spin" /> : r.active ? "On" : "Off"}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing({ ...r }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 font-bold underline"><Pencil size={13} />Edit</button>
                  {armDel === r.id ? (
                    <button onClick={() => runRow(r.id, async () => { await deleteOption(kind, r.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                  ) : (
                    <button onClick={() => setArmDel(r.id)} className="inline-flex items-center gap-1 px-2 font-bold text-red-700"><Trash2 size={13} />Del</button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-neutral-500">Nothing here yet — the shop shows its defaults.</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden flex flex-col">
          {rows.map((r) => (
            <div key={r.id} className="p-3 border-b border-neutral-100 last:border-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <b className="flex items-center gap-2 text-sm">
                    {kind === "colors" && r.extra && <span className="w-5 h-5 rounded-full border border-neutral-300 inline-block shrink-0" style={{ background: r.extra }} />}
                    <span className="truncate">{r.name}</span>
                  </b>
                  <span className="block text-xs text-neutral-500 truncate">{r.id}{r.extra && kind !== "colors" ? ` • ${r.extra}` : ""}</span>
                </div>
                <button onClick={() => runRow(r.id, () => toggleOption(kind, r.id, r.active ? 0 : 1))} className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 ${r.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"} disabled:opacity-60`} disabled={pending === r.id}>
                  {pending === r.id ? <Loader2 size={12} className="animate-spin" /> : r.active ? "On" : "Off"}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => { setEditing({ ...r }); setError(null); setArmDel(null); }} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold underline"><Pencil size={13} />Edit</button>
                {armDel === r.id ? (
                  <button onClick={() => runRow(r.id, async () => { await deleteOption(kind, r.id); setArmDel(null); })} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Sure?</button>
                ) : (
                  <button onClick={() => setArmDel(r.id)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold text-red-700"><Trash2 size={13} />Del</button>
                )}
              </div>
            </div>
          ))}
          {!rows.length && <p className="p-4 text-sm text-neutral-500">Nothing here yet — the shop shows its defaults.</p>}
        </div>
      </div>
      {editing && (
        <Modal title={isNew ? `New ${meta.label.slice(0, -1).toLowerCase()}` : `Edit ${meta.label.slice(0, -1).toLowerCase()}`} onClose={() => setEditing(null)}>
        <form action={submit} className="flex flex-col gap-3">
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <input type="hidden" name="id" value={isNew ? "" : editing.id} />
          <FieldHelp label="Name" help={meta.nameHelp}>
            <input name="name" defaultValue={editing.name} required maxLength={60} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3" />
          </FieldHelp>
          {kind === "sizes" ? (
            <div>
              <span className="text-sm font-medium">Categories</span>
              <span className="block text-xs text-neutral-400 mb-1">Which categories see this size. Tick many — empty = every category.</span>
              {!cats.length ? (
                <p className="text-sm text-neutral-500">No categories yet — add some in Categories first.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 max-h-36 overflow-y-auto">
                  {cats.map((c) => {
                    const picked = editing.extra.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
                    const checked = picked.includes(c.id);
                    return (
                      <label key={c.id} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-bold cursor-pointer has-[:checked]:bg-neutral-900 has-[:checked]:text-white has-[:checked]:border-neutral-900 bg-white border-neutral-300">
                        <input type="checkbox" name="cats" value={c.id} defaultChecked={checked} className="hidden" />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : meta.extraLabel ? (
            <FieldHelp label={meta.extraLabel} help={meta.extraHelp}>
              <input name="extra" defaultValue={editing.extra} maxLength={200} placeholder={meta.extraPh} className="mt-1 w-full h-10 border border-neutral-300 rounded-lg px-3 font-mono" />
            </FieldHelp>
          ) : null}
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
