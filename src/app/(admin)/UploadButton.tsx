"use client";

import { useEffect, useState } from "react";
import { autoCompress, stageUpload, clearStaged, flushUploads } from "@/lib/upload-client";
import CompressModal from "./CompressModal";

const BIG_FILE = 1024 * 1024;

export default function UploadButton({
  target,
  folder,
  onUploaded,
  onSelectFile,
  smart,
  hq,
}: {
  target: string;
  folder?: string;
  onUploaded?: (url: string) => void;
  onSelectFile?: (file: File) => void;
  smart?: boolean;
  hq?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<{ url: string; name: string } | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const inputId = `upload-for-${target}-${folder ?? "misc"}`;

  useEffect(() => {
    return () => {
      setStaged((s) => {
        if (s) URL.revokeObjectURL(s.url);
        return s;
      });
    };
  }, []);

  const stage = (file: File, blob?: Blob) => {
    const payload = blob ?? file;
    const url = URL.createObjectURL(payload);
    setStaged((s) => {
      if (s) URL.revokeObjectURL(s.url);
      return { url, name: file.name };
    });
    stageUpload(target, folder, payload, file.name);
    onSelectFile?.(file);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > BIG_FILE && !smart) {
      setPending(file);
      return;
    }
    if (file.size > BIG_FILE) {
      try {
        const blob = await autoCompress(file, hq ? { maxDim: 1920, targetBytes: 1024 * 1024, qualities: [0.9, 0.82, 0.75, 0.68] } : undefined);
        stage(file, blob);
      } catch {
        setError("Could not read image");
      }
      return;
    }
    stage(file);
  };

  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="file"
        id={inputId}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <label htmlFor={inputId} className="h-10 min-w-[92px] grid place-items-center rounded-lg border border-neutral-300 px-4 text-sm font-bold cursor-pointer">
        Upload
      </label>
      {staged && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
          <img src={staged.url} alt="" className="w-8 h-8 rounded-lg object-cover border border-neutral-300" />
          <span className="max-w-[120px] truncate" title={staged.name}>{staged.name}</span>
          <button
            type="button"
            onClick={() => {
              clearStaged(target);
              setStaged((s) => {
                if (s) URL.revokeObjectURL(s.url);
                return null;
              });
            }}
            className="underline"
          >
            remove
          </button>
        </span>
      )}
      {error && <span className="text-xs font-semibold text-red-700">{error}</span>}
      {pending && (
        <CompressModal
          file={pending}
          maxBytes={2 * 1024 * 1024}
          onConfirm={(blob) => {
            setPending(null);
            stage(pending, blob);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </span>
  );
}
