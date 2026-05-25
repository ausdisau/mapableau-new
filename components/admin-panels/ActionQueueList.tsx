import Link from "next/link";

export type ActionQueueItem = {
  label: string;
  count: number;
  href: string;
  urgent?: boolean;
};

export function ActionQueueList({
  items,
  title = "Action queue",
}: {
  items: ActionQueueItem[];
  title?: string;
}) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center justify-between rounded-lg border border-border px-4 py-2 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-medium">{item.label}</span>
              <span
                className={
                  item.urgent && item.count > 0
                    ? "rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground"
                    : "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold"
                }
                aria-label={`${item.count} items`}
              >
                {item.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
