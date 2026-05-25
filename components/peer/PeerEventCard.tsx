import { Card } from "@/components/ui/card";

export function PeerEventCard({
  id,
  title,
  description,
  startsAt,
  locationType,
}: {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  locationType: string;
}) {
  return (
    <Card className="p-4">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(startsAt).toLocaleString("en-AU")} · {locationType}
      </p>
      <form action={`/api/peer/events/${id}/rsvp`} method="post" className="mt-3">
        <button
          type="submit"
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          RSVP
        </button>
      </form>
    </Card>
  );
}
