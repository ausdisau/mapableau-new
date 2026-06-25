export function AccessBadgeGrid({
  badges,
}: {
  badges: {
    code: string;
    title: string;
    description: string;
    earnedAt?: string;
  }[];
}) {
  if (!badges.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No badges earned yet. Submit access reports to earn your first badge.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-label="Your badges">
      {badges.map((badge) => (
        <li
          key={badge.code}
          className="rounded-lg border border-border p-4"
        >
          <p className="font-semibold">{badge.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {badge.description}
          </p>
          {badge.earnedAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Earned {new Date(badge.earnedAt).toLocaleDateString("en-AU")}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
