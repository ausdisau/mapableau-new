import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function SafetyActionCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
      <span>
        <span className="font-semibold">Report a safety concern</span>
        <span className="block text-sm text-muted-foreground">
          Urgent issues need a connection to submit fully
        </span>
      </span>
    </Link>
  );
}
