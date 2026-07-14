import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listAdminCatalogue } from "@/lib/academy/catalogue/catalogue-service";

export default async function AdminCataloguePage() {
  await requirePermission("academy:admin");
  const courses = await listAdminCatalogue({});

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-teal-950">
            Catalogue administration
          </h1>
          <p className="text-sm text-slate-600">
            Includes planned courses and governance fields. Public users never see this view.
          </p>
        </div>
        <Link href="/academy/admin/catalogue/imports" className="text-teal-800 underline text-sm">
          Import runs
        </Link>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Academy catalogue administration</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2">Code</th>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Wave</th>
              <th scope="col">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 align-top">
                <td className="py-2 font-mono text-xs">{c.code}</td>
                <td>
                  {c.title}
                  {c.governanceNote ? (
                    <p className="text-xs text-slate-500 line-clamp-2">{c.governanceNote}</p>
                  ) : null}
                </td>
                <td>{c.publicationStatus}</td>
                <td>{c.releaseWave ?? "—"}</td>
                <td className="text-xs">
                  {c.disabilityLedReviewRequired ? "DLR " : ""}
                  {c.clinicalReviewRequired ? "Clinical " : ""}
                  {c.practicalAssessmentRequired ? "Practical" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-600">{courses.length} courses</p>
    </article>
  );
}
