import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

type Note = {
  id: string;
  content: string;
  createdAt: string | Date;
};

export function SupportCoordinationNotes({ notes }: { notes: Note[] }) {
  return (
    <MapAbleCard
      title="Support coordination notes"
      description="Notes are permissioned and auditable."
    >
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border p-4">
              <p className="text-sm">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
