"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const MAX_DIM = 1600;
const MIN_Q = 0.4;
const MAX_Q = 0.95;
const REC_Q = 0.8;

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressModal({
  file,
  maxBytes,
  onConfirm,
  onCancel,
}: {
  file: File;
  maxBytes: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [quality, setQuality] = useState(REC_Q);
  const [preview, setPreview] = useState("");
  const [srcUrl, setSrcUrl] = useState("");
  const [outSize, setOutSize] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      encode(REC_Q);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const encode = (q: number) => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mime = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob(
      (b) => {
        if (!b) return;
        setBlob(b);
        setOutSize(b.size);
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(b);
        });
      },
      mime,
      q
    );
  };

  useEffect(() => {
    const t = setTimeout(() => encode(quality), 150);
    return () => clearTimeout(t);
  }, [quality]);

  const originalOk = file.size <= maxBytes;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4">
      <button aria-label="Close" onClick={onCancel} className="absolute inset-0 bg-black/55 cursor-default" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 p-5 max-h-[92vh] overflow-y-auto">
        <b className="text-lg">Image too big ({fmt(file.size)})</b>
        <p className="text-sm text-neutral-500 mt-1 mb-3">
          Compress it before upload. Drag the slider — preview updates live. Recommended quality is marked.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <small className="text-xs font-bold text-neutral-500">ORIGINAL • {fmt(file.size)}</small>
            <img src={srcUrl} alt="Original" className="mt-1 w-full h-40 rounded-xl object-cover bg-neutral-100" />
          </div>
          <div>
            <small className="text-xs font-bold text-neutral-500">COMPRESSED • {outSize ? fmt(outSize) : "…"}</small>
            {preview ? (
              <img src={preview} alt="Compressed preview" className="mt-1 w-full h-40 rounded-xl object-cover bg-neutral-100" />
            ) : (
              <span className="mt-1 block w-full h-40 rounded-xl bg-neutral-100" />
            )}
          </div>
        </div>
        <label className="block text-sm font-bold">
          Quality: {Math.round(quality * 100)}%
          {quality === REC_Q && <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">recommended</span>}
          <input
            type="range"
            min={MIN_Q}
            max={MAX_Q}
            step={0.05}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="lux-range mt-1.5 w-full"
            style={{ "--fill": `${Math.round(((quality - MIN_Q) / (MAX_Q - MIN_Q)) * 100)}%` } as CSSProperties}
          />
          <span className="flex justify-between text-xs font-normal text-neutral-400"><span>smaller ({Math.round(MIN_Q * 100)}%)</span><span>bigger ({Math.round(MAX_Q * 100)}%)</span></span>
        </label>
        <div className="flex gap-2 mt-4">
          <button
            disabled={!blob}
            onClick={() => blob && onConfirm(blob)}
            className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50"
          >
            Use compressed ({outSize ? fmt(outSize) : "…"})
          </button>
          {originalOk && (
            <button onClick={() => onConfirm(file)} className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5">
              Original
            </button>
          )}
          <button onClick={onCancel} className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
