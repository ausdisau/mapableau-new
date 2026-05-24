import Link from "next/link";

type Item = { id: string; title: string; startAt: string; href: string };

export function TodayScheduleList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-muted-foreground" role="status">
        No shifts scheduled for today. Check back later or contact your provider.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="flex min-h-16 flex-col justify-center rounded-lg border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">
              {new Date(item.startAt).toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
