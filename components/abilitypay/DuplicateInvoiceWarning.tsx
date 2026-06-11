import { AlertTriangle } from "lucide-react";

export function DuplicateInvoiceWarning({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Possible duplicate invoice</p>
        <p className="text-sm">
          Another invoice with the same number from this provider was found.
          Check before approving.
        </p>
      </div>
    </div>
  );
}
