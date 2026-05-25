import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function IncidentQuickReportButton() {
  return (
    <Link
      href="/dashboard/incidents/new"
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive bg-destructive/5 font-bold text-destructive focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ShieldAlert className="h-5 w-5" aria-hidden />
      Report safety issue
    </Link>
  );
}
