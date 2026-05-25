type CertificateBadgeProps = {
  certificateNumber: string;
  courseTitle: string;
  issuedAt: Date | string;
};

export function CertificateBadge({
  certificateNumber,
  courseTitle,
  issuedAt,
}: CertificateBadgeProps) {
  const date =
    typeof issuedAt === "string"
      ? new Date(issuedAt).toLocaleDateString()
      : issuedAt.toLocaleDateString();

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium text-primary">Certificate earned</p>
      <p className="mt-1 font-heading text-lg font-bold">{courseTitle}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Certificate {certificateNumber} · Issued {date}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        PDF download coming soon. Keep this number for your records.
      </p>
    </div>
  );
}
