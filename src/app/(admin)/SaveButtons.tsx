"use client";

import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

export default function SaveButtons({
  saveLabel = "Save",
  onCancel,
  rowClassName = "flex gap-2",
}: {
  saveLabel?: string;
  onCancel?: () => void;
  rowClassName?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className={rowClassName}>
      <button
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50"
      >
        <Check size={15} />
        {pending ? "Saving…" : saveLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 text-sm font-bold px-5 py-2.5 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
