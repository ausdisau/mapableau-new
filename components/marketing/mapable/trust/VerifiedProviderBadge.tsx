import { ShieldCheck } from "lucide-react";

export function VerifiedProviderBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-mapable-teal/30 bg-mapable-teal/10 px-2.5 py-1 text-xs font-semibold text-mapable-teal">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      Verified profile
    </span>
  );
}
