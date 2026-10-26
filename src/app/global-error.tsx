"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin-crash] message:", error.message);
    console.error("[admin-crash] stack:", error.stack);
    if (error.digest) console.error("[admin-crash] digest:", error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen grid place-items-center bg-neutral-100 px-4">
        <div className="w-full max-w-lg bg-white border border-red-300 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-red-700">Something broke</h1>
          <p className="text-sm text-neutral-600 mt-1 mb-3">Screenshot or copy this and send it to the developer:</p>
          <pre className="text-xs bg-neutral-900 text-green-300 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {error.message}
            {error.stack ? `\n\n${error.stack.split("\n").slice(0, 12).join("\n")}` : ""}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button onClick={() => reset()} className="mt-4 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
