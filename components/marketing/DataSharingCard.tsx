import { Button } from "@/components/ui/button";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";

export type DataSharingCardProps = {
  recipientType: string;
  dataCategories: string[];
  expiry?: string;
  status: "active" | "expired" | "revoked" | "pending";
};

const statusLabels: Record<DataSharingCardProps["status"], string> = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
  pending: "Pending approval",
};

const statusClass: Record<DataSharingCardProps["status"], string> = {
  active: "border-[#00A979]/30 bg-[#00A979]/10 text-[#006B4F]",
  expired: "border-slate-300 bg-slate-100 text-slate-600",
  revoked: "border-red-200 bg-red-50 text-red-800",
  pending: "border-[#F8C51C]/40 bg-[#F8C51C]/15 text-[#7A5E00]",
};

export function DataSharingCard({
  recipientType,
  dataCategories,
  expiry,
  status,
}: DataSharingCardProps) {
  return (
    <article
      className={mapablePublicCardClass}
      aria-labelledby={`sharing-${recipientType.replace(/\s+/g, "-")}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={`sharing-${recipientType.replace(/\s+/g, "-")}`}
          className="text-base font-black text-[#0C1833]"
        >
          Shared with: {recipientType}
        </h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold text-slate-700">Data categories</p>
        <ul className="mt-1 space-y-1 text-sm text-slate-600">
          {dataCategories.map((cat) => (
            <li key={cat}>{cat}</li>
          ))}
        </ul>
      </div>

      {expiry ? (
        <p className="mt-3 text-sm text-slate-600">
          <strong>Expires:</strong> {expiry}
        </p>
      ) : null}

      {status === "active" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled
          aria-label={`Revoke access for ${recipientType} (coming soon)`}
        >
          Revoke access (coming soon)
        </Button>
      ) : null}
    </article>
  );
}
