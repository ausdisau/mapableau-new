import Link from "next/link";
import { Calendar } from "lucide-react";

export function TodayScheduleCard({
  items,
  viewAllHref,
  emptyMessage = "Nothing scheduled for today.",
}: {
  items: { id: string; title: string; time?: string }[];
  viewAllHref: string;
  emptyMessage?: string;
}) {
  return (
    <section
      aria-labelledby="today-schedule-heading"
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="today-schedule-heading"
          className="flex items-center gap-2 font-semibold"
        >
          <Calendar className="h-5 w-5 text-primary" aria-hidden />
          Today
        </h2>
        <Link
          href={viewAllHref}
          className="min-h-11 text-sm font-medium text-primary underline"
        >
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{item.title}</span>
              {item.time ? (
                <span className="mt-0.5 block text-muted-foreground">
                  {item.time}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
