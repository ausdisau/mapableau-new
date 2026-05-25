export function SupportTicketStatusBadge({
  status,
  safeguarding,
}: {
  status: string;
  safeguarding?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        safeguarding
          ? "bg-red-100 text-red-900 border border-red-300"
          : "bg-slate-100 text-slate-800 border border-slate-300"
      }`}
    >
      {safeguarding ? "Safety — " : ""}
      {status.replace(/_/g, " ")}
    </span>
  );
}
