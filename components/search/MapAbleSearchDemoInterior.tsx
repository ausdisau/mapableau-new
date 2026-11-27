"use client";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  ST_IVES_FLOOR_PLAN,
  getClinicById,
  type DemoClinicId,
} from "@/lib/search/demo/st-ives-search-demo";

type Props = {
  selectedClinicId: DemoClinicId;
  className?: string;
};

export function MapAbleSearchDemoInterior({
  selectedClinicId,
  className,
}: Props) {
  const clinic = getClinicById(selectedClinicId);

  if (!clinic.hasFloorPlan) {
    return (
      <div
        className={cn(
          "flex min-h-[14rem] flex-col justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5",
          className,
        )}
      >
        <h3 className="font-heading text-lg font-bold text-[#0C1833]">
          No floor plan for {clinic.name}
        </h3>
        <p className="mt-2 text-sm text-slate-700">
          This synthetic demo does not supply an interior plan for clinic 2. Use
          the comparison table and list for entrance width, hoist, quiet room
          and bus approach details.
        </p>
        {!clinic.busGradientKnown ? (
          <p className="mt-3 text-sm font-semibold text-[#0C1833]">
            Kerb ramp gradient remains unknown.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F6FBFC]",
        className,
      )}
    >
      <p className="border-b border-slate-200 px-4 py-2 text-sm font-black text-[#0C1833]">
        {ST_IVES_FLOOR_PLAN.title}
      </p>
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 via-white to-slate-200">
        <svg
          viewBox="0 0 100 62"
          className="h-full w-full"
          role="img"
          aria-label={ST_IVES_FLOOR_PLAN.altText}
        >
          <rect
            x="8"
            y="8"
            width="84"
            height="46"
            rx="2"
            fill="#fff"
            stroke="#0C1833"
            strokeWidth="0.8"
          />
          <rect
            x="10"
            y="40"
            width="18"
            height="12"
            fill="#E3F2FD"
            stroke="#005B7F"
            strokeWidth="0.5"
          />
          <rect
            x="48"
            y="18"
            width="28"
            height="20"
            fill="#FFF8E1"
            stroke="#F8C51C"
            strokeWidth="0.5"
          />
          <rect
            x="72"
            y="10"
            width="18"
            height="14"
            fill="#E8F5E9"
            stroke="#00A979"
            strokeWidth="0.5"
          />
          <path
            d="M19 52 L19 36 L56 36 L56 28"
            fill="none"
            stroke="#005B7F"
            strokeWidth="1"
            strokeDasharray="2 1.5"
          />
        </svg>
        <ul className="absolute inset-0 m-0 list-none p-0">
          {ST_IVES_FLOOR_PLAN.features.map((feature) => (
            <li
              key={feature.id}
              className="absolute"
              style={{ left: `${feature.x}%`, top: `${feature.y}%` }}
            >
              <button
                type="button"
                title={feature.description}
                className={cn(
                  "-translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-[#005B7F] bg-white px-2 py-1 text-xs font-black text-[#005B7F] shadow-sm",
                  mapableCareFocusRing,
                )}
              >
                {feature.label}
              </button>
              <span className="sr-only">{feature.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="px-4 py-2 text-xs text-slate-600">
        Illustrative interior for demo clinic 1. Read the equivalent access
        details in the comparison below.
      </figcaption>
    </figure>
  );
}
