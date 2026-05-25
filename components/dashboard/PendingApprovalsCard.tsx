import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export function PendingApprovalsCard({
  count,
  href,
  label = "Pending approvals",
}: {
  count: number;
  href: string;
  label?: string;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ClipboardCheck className="h-5 w-5 text-amber-800" aria-hidden />
      <span>
        <span className="font-semibold text-amber-950">{label}</span>
        <span className="block text-sm text-amber-900">
          {count} item{count === 1 ? "" : "s"} need your review
        </span>
      </span>
    </Link>
  );
}
