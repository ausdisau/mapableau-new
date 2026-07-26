import Link from "next/link";

import { AccessLensSyntheticDemo } from "@/components/access-lens/AccessLensSyntheticDemo";
import {
  mapablePublicPageContainerClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Access Lens synthetic demo | MapAble",
  description:
    "Fixture-only Access Lens demo with provisional candidates and a text list equivalent. No camera required.",
};

export default function AccessLensDemoPage() {
  return (
    <div className="bg-white text-mapable-navy">
      <div className={`${mapablePublicPageContainerClass} py-10 sm:py-14`}>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-mapable-brand">
          Access Lens
        </p>
        <h1 className="mapable-display mt-2 text-3xl font-black tracking-[-0.04em] text-mapable-navy sm:text-4xl">
          Synthetic demo
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Harbour Civic Centre Entrance B fixture. No camera permission is requested and no
          images are uploaded.
        </p>
        <div className="mt-6">
          <Link href="/access-lens" className={mapablePublicSecondaryButtonClass}>
            Back to Access Lens overview
          </Link>
        </div>

        <div className="mt-12">
          <AccessLensSyntheticDemo />
        </div>
      </div>
    </div>
  );
}
