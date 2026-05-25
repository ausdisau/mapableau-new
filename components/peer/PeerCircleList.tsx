import { PeerCircleCard } from "./PeerCircleCard";

export function PeerCircleList({
  circles,
}: {
  circles: {
    id: string;
    title: string;
    description: string;
    topic: string;
    memberCount: number;
  }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {circles.map((c) => (
        <li key={c.id}>
          <PeerCircleCard {...c} />
        </li>
      ))}
    </ul>
  );
}
