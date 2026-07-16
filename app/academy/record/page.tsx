import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listLearnerEnrolments } from "@/lib/academy/learning/learning-service";

export default async function AcademyRecordPage() {
  const user = await requirePermission("academy:learn");
  const enrolments = await listLearnerEnrolments(user.id);

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Learning record</h1>
      <p className="text-sm text-slate-600">
        Records support workforce capability. They do not guarantee NDIS compliance.
      </p>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Enrolments and completion status</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2">Course</th>
            <th scope="col">Version</th>
            <th scope="col">Status</th>
            <th scope="col">Open</th>
          </tr>
        </thead>
        <tbody>
          {enrolments.map((e) => (
            <tr key={e.id} className="border-b border-slate-100">
              <td className="py-2">{e.courseVersion.course.title}</td>
              <td>{e.courseVersion.versionNumber}</td>
              <td>{e.status}</td>
              <td>
                <Link href={`/academy/learn/${e.id}`} className="text-teal-800 underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
