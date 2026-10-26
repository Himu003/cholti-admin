"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { adminClientAuth } from "@/lib/firebase-client";
import { loginWithGoogle } from "./actions";

export default function GoogleLogin() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      console.log("[admin-login] opening popup…");
      const cred = await signInWithPopup(adminClientAuth, new GoogleAuthProvider());
      console.log("[admin-login] popup ok:", cred.user.email);
      const token = await cred.user.getIdToken();
      console.log("[admin-login] token ok, signing out client…");
      await signOut(adminClientAuth);
      console.log("[admin-login] calling server…");
      const res = await loginWithGoogle(token);
      console.log("[admin-login] server says:", JSON.stringify(res));
      if (res.ok) {
        window.location.href = res.dest;
      } else {
        window.location.href = res.shop;
      }
    } catch (e) {
      const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[admin-login] failed:", code, msg);
      setError(`Google sign-in failed${code ? ` (${code})` : ""}: ${msg.slice(0, 160)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {error && <p className="text-sm font-semibold text-red-700 mb-3">{error}</p>}
      <button
        onClick={run}
        disabled={busy}
        className="w-full inline-flex justify-center items-center gap-2 bg-white border border-neutral-300 rounded-lg py-2.5 text-sm font-bold hover:border-neutral-500 disabled:opacity-50 text-neutral-900"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.7 2.9v.1C3.3 21.3 7.3 24 12 24z" />
          <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.6 0 10.2 0 12s.5 3.4 1.4 4.9l3.8-2.5z" />
          <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.8l3.8 2.9c.9-2.9 3.6-5.1 6.8-5.1z" />
        </svg>
        {busy ? "Signing in…" : "Continue with Google"}
      </button>
      <p className="text-xs text-neutral-500 mt-3">Only owner accounts can enter. Other Google accounts go straight to the shop.</p>
    </div>
  );
}
