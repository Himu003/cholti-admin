import { NextResponse } from "next/server";
import { getSettings } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSettings(), {
    headers: { "Cache-Control": "public, s-maxage=300" },
  });
}
