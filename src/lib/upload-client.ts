export async function autoCompress(
  file: File,
  opts?: { maxDim?: number; targetBytes?: number; qualities?: number[] }
): Promise<Blob> {
  const maxDim = opts?.maxDim ?? 1600;
  const targetBytes = opts?.targetBytes ?? 600 * 1024;
  const qualities = opts?.qualities ?? [0.85, 0.75, 0.65, 0.55];
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    const mime = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of qualities) {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mime, q));
      if (blob && (blob.size <= targetBytes || q === qualities[qualities.length - 1])) return blob;
    }
    return file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
type PendingItem = { target: string; folder?: string; blob: Blob; name: string };

const pendingUploads = new Map<string, PendingItem>();

export function stageUpload(target: string, folder: string | undefined, blob: Blob, name: string) {
  pendingUploads.set(target, { target, folder, blob, name });
}

export function clearStaged(target: string) {
  pendingUploads.delete(target);
}

export async function flushUploads(
  onProgress?: (target: string, pct: number) => void
): Promise<{ ok: boolean; error?: string; urls?: Record<string, string> }> {
  const urls: Record<string, string> = {};
  for (const item of pendingUploads.values()) {
    try {
      const fd = new FormData();
      fd.append("file", item.blob);
      if (item.folder) fd.append("folder", item.folder);
      const data = (await uploadWithProgress("/api/upload", fd, (p) => onProgress?.(item.target, p))) as { path?: string };
      if (!data.path) return { ok: false, error: "Upload failed" };
      urls[item.target] = data.path;
      const input = document.querySelector(`input[name="${item.target}"]`) as HTMLInputElement | null;
      if (input) input.value = data.path;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
    }
  }
  pendingUploads.clear();
  return { ok: true, urls };
}

export function uploadWithProgress(
  url: string,
  fd: FormData,
  onProgress: (pct: number) => void,
  headers?: Record<string, string>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (headers) {
      for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(data);
      } else {
        reject(new Error((data as { error?: string } | null)?.error ?? "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 60000;
    xhr.send(fd);
  });
}
