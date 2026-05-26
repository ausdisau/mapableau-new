import Link from "next/link";
import { notFound } from "next/navigation";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { SquareThreadList } from "@/components/mapable-square/SquareThreadList";
import { getSquareRoom, SQUARE_ROOMS } from "@/lib/mapable-square/rooms";
import { threadsForRoom } from "@/lib/mapable-square/seed-threads";

export function generateStaticParams() {
  return SQUARE_ROOMS.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getSquareRoom(slug);
  if (!room) return { title: "Room not found" };
  return {
    title: `${room.title} — MapAble Square`,
    description: room.description,
  };
}

export default async function SquareRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getSquareRoom(slug);
  if (!room) notFound();

  const threads = threadsForRoom(slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <CorePageHeader
        eyebrow="MapAble Square"
        title={room.title}
        description={room.description}
      >
        <p className="text-sm text-muted-foreground">{room.purpose}</p>
      </CorePageHeader>

      <div
        className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm"
        role="note"
      >
        <strong className="text-secondary">Chronological order.</strong> Threads below are sorted by
        last activity only. No personalised ranking. Posting will open when Square accounts connect
        to MapAble sign-in.
      </div>

      <SquareThreadList threads={threads} roomSlug={slug} />

      <p className="text-sm text-muted-foreground">
        <Link href="/square" className="font-medium text-primary hover:underline">
          ← All rooms
        </Link>
        {" · "}
        <Link href="/access" className="font-medium text-primary hover:underline">
          MapAble Access
        </Link>
      </p>
    </div>
  );
}
