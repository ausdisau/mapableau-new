import { SQUARE_PRINCIPLES } from "@/lib/mapable-square/copy";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function SquarePrincipleList() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {SQUARE_PRINCIPLES.map((p) => (
        <li key={p.id} className={mapableSectionCardClass}>
          <div className="p-5">
            <h3 className="font-heading text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
