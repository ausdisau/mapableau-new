import { SUPPRESSED_DATA_NOTICE } from "@/lib/config/accountability";

export function SuppressedDataNotice() {
  return (
    <p
      role="note"
      className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
    >
      {SUPPRESSED_DATA_NOTICE}
    </p>
  );
}
