import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { readSessionCookie, validSession } from "@/lib/auth";
import { fsdb } from "@/lib/firebase";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;

let formCache: { at: number; upload: boolean } | null = null;

async function uploadAllowed(): Promise<boolean> {
  if (formCache && Date.now() - formCache.at < 60_000) return formCache.upload;
  try {
    const snap = await fsdb().doc("config/forms").get();
    const upload = snap.data()?.upload !== false;
    formCache = { at: Date.now(), upload };
    return upload;
  } catch {
    return formCache?.upload ?? true;
  }
}

function extFor(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "webp";
  return null;
}

function ik() {
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY ?? "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ?? "",
  });
}

function cleanFolder(raw: unknown): string {
  const parts = String(raw ?? "")
    .split("/")
    .map((p) => p.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40))
    .filter(Boolean)
    .slice(0, 4);
  return ["cholti", "admin", ...parts].join("/");
}

export async function POST(req: Request) {
  if (!(await validSession(await readSessionCookie())).ok) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  if (!(await uploadAllowed())) {
    return NextResponse.json({ error: "Uploads are turned off" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) return NextResponse.json({ error: "Max 2MB" }, { status: 400 });
  const ext = extFor(buf);
  if (!ext) return NextResponse.json({ error: "Only jpg, png or webp" }, { status: 400 });

  try {
    const up = await ik().upload({
      file: buf,
      fileName: `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`,
      folder: cleanFolder(form.get("folder")),
      useUniqueFileName: false,
    });
    return NextResponse.json({ path: up.url, url: up.url });
  } catch {
    return NextResponse.json({ error: "ImageKit upload failed" }, { status: 502 });
  }
}
