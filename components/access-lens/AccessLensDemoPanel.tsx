import {
  ACCESS_LENS_OBSERVATION_TYPE_LABELS,
  ACCESS_LENS_VERIFICATION_LABELS,
  type AccessLensObservation,
} from "@/types/accessLens";
import { getSortedAccessLensObservations } from "@/lib/access-lens/access-lens-mock";
import {
  mapablePublicCardClass,
  mapablePublicMutedCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensDemoPanelProps = {
  observations?: AccessLensObservation[];
  placeName?: string;
  heading?: string;
  description?: string;
  id?: string;
};

function overlayPositionClass(index: number): string {
  const positions = [
    "top-6 left-4",
    "top-24 right-4",
    "top-[11rem] left-4",
    "bottom-28 right-4",
    "bottom-16 left-4",
  ];
  return positions[index % positions.length] ?? "top-6 left-4";
}

export function AccessLensDemoPanel({
  observations = getSortedAccessLensObservations(),
  placeName,
  heading = "Lens demo",
  description = "This is a mock camera preview. No camera or photo upload is required. The same information appears as a list so it can be read without the visual demo.",
  id = "access-lens-demo",
}: AccessLensDemoPanelProps) {
  const headingId = `${id}-heading`;
  const listId = "access-lens-information";
  const sorted = getSortedAccessLensObservations(observations);

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Demo</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
      >
        {heading}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {description}
        {placeName ? ` Example place: ${placeName}.` : null}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className={mapablePublicMutedCardClass} aria-hidden="false">
          <p className="text-sm font-bold text-[#0C1833]">Mock camera view</p>
          <p className="mt-1 text-sm text-slate-600">
            Visual overlays only. Use the list beside or below for the same access notes.
          </p>
          <div className="mt-4 flex justify-center">
            <div
              className="relative w-full max-w-[280px] overflow-hidden rounded-[2rem] border-4 border-[#0C1833] bg-slate-800 shadow-lg aspect-[9/16]"
              role="img"
              aria-label="Mock phone camera preview with high-contrast access overlays"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 motion-reduce:bg-slate-700"
              />
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-3 h-2 w-16 -translate-x-1/2 rounded-full bg-slate-950"
              />
              <ul className="absolute inset-0 list-none p-0">
                {sorted.slice(0, 5).map((obs, index) => (
                  <li
                    key={obs.id}
                    className={`absolute max-w-[11rem] rounded-lg border-2 border-white bg-[#0C1833]/95 px-2 py-1.5 text-left text-xs font-bold leading-snug text-white shadow-md ${overlayPositionClass(index)}`}
                  >
                    <span className="block">
                      {obs.label}
                      {obs.distanceLabel ? ` ${obs.distanceLabel}` : ""}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-[#F8C51C]">
                      {ACCESS_LENS_VERIFICATION_LABELS[obs.verificationStatus]}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
                <span
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-white bg-white/10 text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  Demo
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={mapablePublicCardClass} id={listId} tabIndex={-1}>
          <h3 className="text-lg font-black text-[#0C1833]">
            Access information (list view)
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Equivalent text for every demo overlay. Prefer this view if you do not want to use the camera preview.
          </p>
          <ol className="mt-5 space-y-3">
            {sorted.map((obs, index) => (
              <li
                key={obs.id}
                className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#005B7F]">
                  {index + 1}. {ACCESS_LENS_OBSERVATION_TYPE_LABELS[obs.type]}
                </p>
                <p className="mt-1 text-base font-bold text-[#0C1833]">
                  {obs.label}
                  {obs.distanceLabel ? ` · ${obs.distanceLabel}` : ""}
                </p>
                {obs.note ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">{obs.note}</p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Source: {ACCESS_LENS_VERIFICATION_LABELS[obs.verificationStatus]}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
