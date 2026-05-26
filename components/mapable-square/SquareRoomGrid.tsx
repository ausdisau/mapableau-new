import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SquareRoom } from "@/lib/mapable-square/rooms";

export function SquareRoomGrid({ rooms }: { rooms: SquareRoom[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {rooms.map((room) => (
        <li key={room.slug}>
          <Link
            href={`/square/rooms/${room.slug}`}
            className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card variant="interactive" className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{room.title}</CardTitle>
                <CardDescription>{room.description}</CardDescription>
                <p className="pt-2 text-xs text-muted-foreground">{room.purpose}</p>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
