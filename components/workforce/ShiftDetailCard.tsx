type Props = {
  title: string;
  startAt: string;
  location: string;
  notes: string;
};

export function ShiftDetailCard({ title, startAt, location, notes }: Props) {
  return (
    <section className="rounded-lg border p-4">
      <h1 className="font-heading text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm">
        <time dateTime={startAt}>
          {new Date(startAt).toLocaleString("en-AU")}
        </time>
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">Location: </span>
        {location}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{notes}</p>
    </section>
  );
}
