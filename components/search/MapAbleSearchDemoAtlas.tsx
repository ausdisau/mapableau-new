"use client";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  ST_IVES_BUS_STOP,
  ST_IVES_DEMO_CLINICS,
  ST_IVES_TRANSIT_PATH,
  type DemoClinicId,
} from "@/lib/search/demo/st-ives-search-demo";

type Props = {
  selectedClinicId: DemoClinicId;
  transitPathOn: boolean;
  sensoryLayerOn: boolean;
  onSelectClinic: (id: DemoClinicId) => void;
  className?: string;
};

export function MapAbleSearchDemoAtlas({
  selectedClinicId,
  transitPathOn,
  sensoryLayerOn,
  onSelectClinic,
  className,
}: Props) {
  const pathD = ST_IVES_TRANSIT_PATH.map(
    (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
  ).join(" ");

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-[#E8F0F4]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 80"
        role="img"
        aria-label="Illustrative St Ives street atlas with numbered demo clinic pins and optional transit path. Not a verified access map."
        className="h-auto w-full"
      >
        <rect width="100" height="80" fill="#E8F0F4" />
        <path
          d="M0 55 H100 M0 40 H100 M25 0 V80 M55 0 V80 M75 0 V80"
          stroke="#C5D5DE"
          strokeWidth="1.2"
        />
        <rect
          x="8"
          y="8"
          width="22"
          height="18"
          rx="2"
          fill="#C8E6C9"
          opacity="0.7"
        />
        <text x="11" y="19" fontSize="3.2" fill="#0C1833">
          Village Park
        </text>
        <rect
          x="60"
          y="55"
          width="28"
          height="16"
          rx="2"
          fill="#A5D6A7"
          opacity="0.55"
        />
        <text x="63" y="65" fontSize="3" fill="#0C1833">
          Bushland
        </text>
        <text x="4" y="52" fontSize="2.8" fill="#005B7F">
          Mona Vale Rd
        </text>

        {sensoryLayerOn ? (
          <ellipse
            cx="42"
            cy="48"
            rx="14"
            ry="10"
            fill="#F8C51C"
            opacity="0.25"
            aria-hidden="true"
          />
        ) : null}

        {transitPathOn ? (
          <path
            d={pathD}
            fill="none"
            stroke="#005B7F"
            strokeWidth="1.4"
            strokeDasharray="2 1.5"
          />
        ) : null}

        <circle
          cx={ST_IVES_BUS_STOP.x}
          cy={ST_IVES_BUS_STOP.y}
          r="2.2"
          fill="#0C1833"
        />
        <text
          x={ST_IVES_BUS_STOP.x + 3}
          y={ST_IVES_BUS_STOP.y + 1}
          fontSize="2.6"
          fill="#0C1833"
        >
          Bus
        </text>

        {ST_IVES_DEMO_CLINICS.map((clinic) => {
          const selected = clinic.id === selectedClinicId;
          const fill = clinic.pinNumber === 1 ? "#005B7F" : "#F8C51C";
          return (
            <g key={clinic.id}>
              <circle
                cx={clinic.map.x}
                cy={clinic.map.y}
                r={selected ? 4.2 : 3.4}
                fill={fill}
                stroke="#0C1833"
                strokeWidth={selected ? 0.8 : 0.4}
              />
              <text
                x={clinic.map.x}
                y={clinic.map.y + 1.2}
                textAnchor="middle"
                fontSize="3.4"
                fontWeight="700"
                fill={clinic.pinNumber === 1 ? "#fff" : "#0C1833"}
              >
                {clinic.pinNumber}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="absolute inset-x-2 bottom-2 flex flex-wrap gap-2">
        {ST_IVES_DEMO_CLINICS.map((clinic) => {
          const selected = clinic.id === selectedClinicId;
          return (
            <li key={clinic.id}>
              <button
                type="button"
                onClick={() => onSelectClinic(clinic.id)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex min-h-12 min-w-12 items-center gap-2 rounded-xl border-2 px-3 text-sm font-black",
                  selected
                    ? "border-[#005B7F] bg-[#005B7F] text-white"
                    : "border-slate-300 bg-white text-[#0C1833]",
                  mapableCareFocusRing,
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black"
                  style={{
                    backgroundColor:
                      clinic.pinNumber === 1 ? "#005B7F" : "#F8C51C",
                    color: clinic.pinNumber === 1 ? "#fff" : "#0C1833",
                  }}
                >
                  {clinic.pinNumber}
                </span>
                {clinic.name}
              </button>
            </li>
          );
        })}
      </ul>
      <figcaption className="sr-only">
        Illustrative route and pins for the synthetic St Ives demo. Equivalent
        access details are available in the list and comparison.
      </figcaption>
    </figure>
  );
}
