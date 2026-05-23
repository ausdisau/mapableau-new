import Link from "next/link";

export type ThreadListItem = {
  id: string;
  title: string;
  type: string;
  lastMessageAt?: Date | string | null;
  bookingId?: string | null;
};

export function ThreadList({
  threads,
  basePath = "/dashboard/messages",
}: {
  threads: ThreadListItem[];
  basePath?: string;
}) {
  if (!threads.length) {
    return <p className="text-muted-foreground">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`${basePath}/${t.id}`}
            className="block p-4 hover:bg-muted/50 focus-visible:outline focus-visible:outline-2"
          >
            <span className="font-medium">{t.title}</span>
            {t.bookingId && (
              <span className="ml-2 text-xs text-muted-foreground">
                Booking linked
              </span>
            )}
            {t.lastMessageAt && (
              <time
                className="mt-1 block text-xs text-muted-foreground"
                dateTime={new Date(t.lastMessageAt).toISOString()}
              >
                {new Date(t.lastMessageAt).toLocaleString("en-AU")}
              </time>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
