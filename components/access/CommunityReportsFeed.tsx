import Link from "next/link";

export function CommunityReportsFeed({
  items,
}: {
  items: {
    id: string;
    reportType: string;
    reviewBody: string;
    createdAt: string;
    place: {
      id: string;
      name: string;
      suburb?: string | null;
    };
  }[];
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border p-4">
          <p className="text-xs capitalize text-muted-foreground">
            {item.reportType.replace(/_/g, " ")} ·{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
          <Link
            href={`/access/places/${item.place.id}`}
            className="font-medium underline"
          >
            {item.place.name}
            {item.place.suburb ? ` · ${item.place.suburb}` : ""}
          </Link>
          <p className="mt-2 text-sm">{item.reviewBody}</p>
        </li>
      ))}
    </ul>
  );
}
