import Image from "next/image";
import React from "react";

import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import type { TourStop } from "@/lib/resources/tours-data";

type TourStopCardProps = {
  stop: TourStop;
};

export function TourStopCard({ stop }: TourStopCardProps) {
  return (
    <article
      id={`stop-${stop.id}`}
      className={`${mapablePublicCardClass} scroll-mt-24`}
      aria-labelledby={`stop-${stop.id}-heading`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        Stop {stop.order}
      </p>
      <h3
        id={`stop-${stop.id}-heading`}
        className="mt-2 text-lg font-black text-[#0C1833]"
      >
        {stop.name}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-700">{stop.summary}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        About {stop.estimatedMinutes} minutes on site
      </p>

      <h4 className="mt-5 text-sm font-black text-[#0C1833]">Access notes</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
        {stop.accessNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <h4 className="mt-5 text-sm font-black text-[#0C1833]">Sensory notes</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
        {stop.sensoryNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      {stop.photos && stop.photos.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {stop.photos.map((photo) => (
            <figure key={photo.src} className="overflow-hidden rounded-2xl">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={800}
                height={500}
                className="h-auto w-full object-cover"
              />
            </figure>
          ))}
        </div>
      ) : null}
    </article>
  );
}
