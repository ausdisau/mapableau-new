import Link from "next/link";

import {
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

export function EmploymentPathways() {
  return (
    <section
      aria-labelledby="employment-pathways"
      className={`${mapablePublicPageContainerClass} space-y-5 py-10`}
    >
      <h2 id="employment-pathways" className="font-heading text-2xl font-bold">
        MapAble Jobs guide
      </h2>
      <p className="max-w-2xl text-slate-700">
        Explore three fictional roles, see the skills each employer asks for, or
        draft an interview adjustment request. Pilot members can also sign in to
        browse roles or create an employer listing.
      </p>
      <nav aria-label="Employment pathways" className="flex flex-wrap gap-3">
        <a
          className={mapablePublicPrimaryButtonClass}
          href="/employment/guide/index.html"
        >
          Open the Jobs guide
        </a>
        <Link
          className={mapablePublicSecondaryButtonClass}
          href="/dashboard/jobs"
        >
          Browse pilot roles
        </Link>
        <Link
          className={mapablePublicSecondaryButtonClass}
          href="/employer/jobs/new"
        >
          Create a job draft
        </Link>
      </nav>
    </section>
  );
}
