import { redirect } from "next/navigation";
import Image from "next/image";
import { validSession, readSessionCookie } from "@/lib/auth";
import GoogleLogin from "./GoogleLogin";

export default async function LoginPage() {
  if ((await validSession(await readSessionCookie())).ok) redirect("/orders");

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6">
        <Image src="/logo.png" alt="Cholti" width={120} height={40} className="h-10 w-auto rounded-lg object-cover" />
        <h1 className="text-xl font-bold mt-2">Cholti Admin</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-5">Owner login with Google.</p>
        <GoogleLogin />
      </div>
    </main>
  );
}
