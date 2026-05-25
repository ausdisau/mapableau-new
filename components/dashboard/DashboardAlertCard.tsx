import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function DashboardAlertCard({
  title,
  message,
  href,
  severity = "warning",
}: {
  title: string;
  message: string;
  href?: string;
  severity?: "warning" | "info";
}) {
  const content = (
    <div
      className={`rounded-xl border p-4 ${
        severity === "warning"
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-border bg-muted/50"
      }`}
      role="status"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {content}
      </Link>
    );
  }
  return content;
}
