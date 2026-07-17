import { validateKeyboardGeometry } from "@/lib/indoor-accessibility/authoring/keyboard-geometry";

const EXAMPLE_COORDINATES = "Entrance,0.10,0.20\nLift A,0.42,0.35\nAccessible toilet,0.68,0.74";

export interface KeyboardAuthoringPanelProps {
  floorPlanId: string;
}

export function KeyboardAuthoringPanel({
  floorPlanId,
}: KeyboardAuthoringPanelProps) {
  const validation = validateKeyboardGeometry(EXAMPLE_COORDINATES);
  return (
    <section
      aria-labelledby="keyboard-authoring-heading"
      className="rounded-2xl border border-slate-200 p-6"
    >
      <div className="space-y-2">
        <h2 id="keyboard-authoring-heading" className="text-xl font-black">
          Keyboard geometry authoring
        </h2>
        <p className="text-sm text-slate-700">
          Enter floor-plan geometry with a keyboard using labelled coordinate
          rows. Coordinates are normalised from 0 to 1, and every control has a
          visible label.
        </p>
      </div>

      <form className="mt-5 grid gap-5" aria-describedby="authoring-help">
        <input type="hidden" name="floorPlanId" value={floorPlanId} />
        <p id="authoring-help" className="text-sm text-slate-600">
          Format each row as label, x, y. Example: Entrance, 0.10, 0.20.
        </p>

        <div>
          <label htmlFor="elementName" className="block text-sm font-bold">
            Element name
          </label>
          <input
            id="elementName"
            name="elementName"
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            placeholder="Lift A"
          />
        </div>

        <div>
          <label htmlFor="coordinateTable" className="block text-sm font-bold">
            Coordinate table
          </label>
          <textarea
            id="coordinateTable"
            name="coordinateTable"
            rows={6}
            defaultValue={EXAMPLE_COORDINATES}
            className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"
          />
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold">Zoom controls</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className="rounded-xl border px-4 py-2">
              Zoom in
            </button>
            <button type="button" className="rounded-xl border px-4 py-2">
              Zoom out
            </button>
            <button type="button" className="rounded-xl border px-4 py-2">
              Reset zoom
            </button>
          </div>
        </fieldset>

        <button
          type="submit"
          className="min-h-11 rounded-xl bg-sky-700 px-4 py-2 font-bold text-white"
        >
          Save draft geometry
        </button>
      </form>

      <div className="mt-6" aria-live="polite">
        <h3 className="font-bold">Screen reader element list</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {validation.coordinates.map((coordinate) => (
            <li key={coordinate.label}>
              {coordinate.label}: x {coordinate.x}, y {coordinate.y}
            </li>
          ))}
        </ul>
        {validation.errors.length > 0 ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {validation.errors.join(" ")}
          </div>
        ) : null}
      </div>
    </section>
  );
}
