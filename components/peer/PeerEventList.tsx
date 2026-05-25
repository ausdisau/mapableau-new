import { PeerEventCard } from "./PeerEventCard";

export function PeerEventList({
  events,
}: {
  events: {
    id: string;
    title: string;
    description: string;
    startsAt: Date | string;
    locationType: string;
  }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((e) => (
        <li key={e.id}>
          <PeerEventCard
            id={e.id}
            title={e.title}
            description={e.description}
            startsAt={typeof e.startsAt === "string" ? e.startsAt : e.startsAt.toISOString()}
            locationType={e.locationType}
          />
        </li>
      ))}
    </ul>
  );
}
