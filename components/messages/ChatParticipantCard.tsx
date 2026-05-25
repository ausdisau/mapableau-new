import Link from "next/link";

export function ChatParticipantCard({
  displayName,
  role,
  profileHref,
}: {
  displayName: string;
  role: string;
  profileHref: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-medium">{displayName}</p>
      <p className="text-xs text-muted-foreground">{role}</p>
      <Link
        href={profileHref}
        className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        View profile
      </Link>
    </div>
  );
}
