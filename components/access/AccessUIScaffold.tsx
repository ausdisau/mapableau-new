import { AccessExplorationShell } from "@/components/access/AccessExplorationShell";
import { ACCESS_UI_SCAFFOLD_PLACES } from "@/lib/demo/access-ui-scaffold";
import { Badge } from "@mapable/ui";

export function AccessUIScaffold() {
  return (
    <>
      <section
        className="mx-auto max-w-6xl px-4 pt-8"
        aria-labelledby="access-scaffold-notice-heading"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-amber-300 bg-amber-100 text-amber-950">
              UI scaffold
            </Badge>
            <Badge className="border-amber-300 bg-white text-amber-950">
              Synthetic fixture data
            </Badge>
          </div>
          <h2
            id="access-scaffold-notice-heading"
            className="mt-3 text-lg font-black"
          >
            Canonical MapAble Access shell, fixture-backed
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6">
            This review route uses the same Access exploration shell, AccessFit
            engine, GCCSA boundary controls, evidence model, mobility settings,
            and MapLibre map as the real <code>/access</code> experience. The
            places below are synthetic fixtures only and are not live
            accessibility records.
          </p>
        </div>
      </section>

      <AccessExplorationShell
        initialPlaces={ACCESS_UI_SCAFFOLD_PLACES}
        mode="scaffold"
      />
    </>
  );
}
