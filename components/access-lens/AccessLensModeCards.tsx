import Link from "next/link";

import {
  accessLensModeCards,
  type AccessLensModeCardContent,
} from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";
import { ACCESS_LENS_MODE_LABELS } from "@/types/accessLens";

type AccessLensModeCardsProps = {
  title?: string;
  description?: string;
  cards?: AccessLensModeCardContent[];
  id?: string;
};

export function AccessLensModeCards({
  title = "Choose a Lens mode",
  description = "Camera assistance is optional. Every mode also works as text and list-based access information.",
  cards = accessLensModeCards,
  id = "access-lens-modes",
}: AccessLensModeCardsProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Modes</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.mode} className={mapablePublicCardClass}>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
              {ACCESS_LENS_MODE_LABELS[card.mode]}
            </p>
            <h3 className="mt-2 text-xl font-black text-[#0C1833]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
            <Link
              href={card.href}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white transition hover:bg-[#004866] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 motion-reduce:transition-none"
            >
              {card.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
