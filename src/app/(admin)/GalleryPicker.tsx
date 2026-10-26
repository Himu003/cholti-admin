"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, ImagePlus } from "lucide-react";
import CompressModal from "./CompressModal";
import { autoCompress } from "@/lib/upload-client";

export type GalleryItem = { key: string; url?: string; blob?: Blob; name: string };

const BIG_FILE = 1024 * 1024;
let seq = 0;
const nid = () => `g-${Date.now().toString(36)}-${seq++}`;

export default function GalleryPicker({
  initial,
  smart,
  hq,
  allowUrl,
  allowFiles = true,
  onDone,
  onClose,
}: {
  initial: GalleryItem[];
  smart: boolean;
  hq: boolean;
  allowUrl: boolean;
  allowFiles?: boolean;
  onDone: (items: GalleryItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [pending, setPending] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pushBlobs = async (files: File[]) => {
    for (const f of files) {
      const blob = await autoCompress(f, hq ? { maxDim: 1920, targetBytes: 1024 * 1024, qualities: [0.9, 0.82, 0.75, 0.68] } : undefined);
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      setItems((prev) => {
        if (prev.length >= 10 || prev.some((i) => i.blob instanceof File && `${i.blob.name}|${i.blob.size}|${i.blob.lastModified}` === key)) return prev;
        return [...prev, { key: nid(), blob, name: f.name }];
      });
    }
  };

  const addFiles = (files: FileList | File[] | null | undefined) => {
    if (!files) return;
    const keyOf = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
    setItems((prev) => {
      const seen = new Set(prev.map((i) => (i.blob instanceof File ? keyOf(i.blob) : `url:${i.url}`)));
      const room = Math.max(0, 10 - prev.length);
      const small = [...files]
        .filter((f) => f.type.startsWith("image/") && f.size <= BIG_FILE && !seen.has(keyOf(f)))
        .slice(0, room);
      small.forEach((f) => seen.add(keyOf(f)));
      return small.length ? [...prev, ...small.map((f) => ({ key: nid(), blob: f, name: f.name }))] : prev;
    });
    const big = [...files].filter((f) => f.type.startsWith("image/") && f.size > BIG_FILE);
    if (!big.length) return;
    if (smart) {
      pushBlobs(big.slice(0, 10));
    } else {
      setPending((p) => [...p, ...big].slice(0, 10));
    }
  };

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    setItems((prev) => (prev.length >= 10 ? prev : [...prev, { key: nid(), url: v, name: v }]));
    setUrlInput("");
  };

  const removeAt = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const move = (key: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/55 cursor-default" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <b className="text-lg">Product photos ({items.length}/10)</b>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 grid place-items-center rounded-full border border-neutral-200">
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-neutral-500 mb-3">First photo = main shop card image. Tap the box or drag &amp; drop — many at once.</p>
        {allowFiles && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 hover:border-neutral-900"}`}
        >
          <ImagePlus size={22} className="mx-auto text-neutral-400" />
          <b className="text-sm block mt-1">{dragOver ? "Drop them!" : "Tap to select pictures"}</b>
          <span className="text-xs text-neutral-500">or drag &amp; drop here — many at once</span>
        </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        {allowUrl && (
          <div className="flex gap-2 mt-3">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="…or paste image link, then Add" maxLength={500} className="flex-1 h-10 border border-neutral-300 rounded-lg px-3 text-sm" />
            <button type="button" onClick={addUrl} className="rounded-lg border border-neutral-300 text-sm font-bold px-4">Add</button>
          </div>
        )}
        {!!items.length && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-4">
            {items.map((it, idx) => (
              <Thumb key={it.key} item={it} first={idx === 0} onRemove={() => removeAt(it.key)} onLeft={() => move(it.key, -1)} onRight={() => move(it.key, 1)} />
            ))}
            {items.length < 10 && allowFiles && (
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add more photos" className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 grid place-items-center text-neutral-400 hover:border-neutral-900">
                <Plus size={22} />
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={() => onDone(items)} className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5">
            Done ({items.length})
          </button>
          <button onClick={onClose} className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5">
            Cancel
          </button>
        </div>
      </div>
      {pending.length > 0 && (
        <PendingCompress
          files={pending}
          onDone={(blobs) => {
            setPending([]);
            setItems((prev) => {
              const room = Math.max(0, 10 - prev.length);
              const names = pending.slice(0, room);
              return [...prev, ...blobs.slice(0, room).map((blob, i) => ({ key: nid(), blob, name: names[i]?.name ?? "photo" }))];
            });
          }}
          onCancel={() => setPending([])}
        />
      )}
    </div>
  );
}

function Thumb({ item, first, onRemove, onLeft, onRight }: { item: GalleryItem; first: boolean; onRemove: () => void; onLeft: () => void; onRight: () => void }) {
  const [src, setSrc] = useState(item.url ?? "");
  useEffect(() => {
    if (item.url) return;
    if (!item.blob) return;
    const url = URL.createObjectURL(item.blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [item]);
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 group">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full grid place-items-center text-xs text-neutral-400">…</span>
      )}
      {first && <span className="absolute left-1 top-1 text-[10px] font-bold bg-neutral-900 text-white rounded-full px-2 py-0.5">main</span>}
      <button type="button" onClick={onRemove} aria-label="Remove photo" className="absolute right-1 top-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center">
        <X size={12} />
      </button>
      <span className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button type="button" onClick={onLeft} aria-label="Move left" className="w-6 h-6 rounded-full bg-black/60 text-white text-xs">‹</button>
        <button type="button" onClick={onRight} aria-label="Move right" className="w-6 h-6 rounded-full bg-black/60 text-white text-xs">›</button>
      </span>
    </div>
  );
}

function PendingCompress({ files, onDone, onCancel }: { files: File[]; onDone: (blobs: Blob[]) => void; onCancel: () => void }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Blob[]>([]);
  const cur = files[idx];

  useEffect(() => {
    if (!cur) onDone(done);
  }, [cur === undefined]);

  if (!cur) return null;
  return (
    <CompressModal
      key={`${idx}-${cur.name}`}
      file={cur}
      maxBytes={2 * 1024 * 1024}
      onConfirm={(blob) => {
        const next = [...done, blob];
        if (idx + 1 >= files.length) onDone(next);
        else {
          setDone(next);
          setIdx(idx + 1);
        }
      }}
      onCancel={onCancel}
    />
  );
}
