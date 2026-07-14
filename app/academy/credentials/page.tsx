import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listLearnerCredentials } from "@/lib/academy/credentials/credential-service";
import { COMPLETION_CERTIFICATE_LABEL } from "@/lib/academy/config";

export default async function AcademyCredentialsPage() {
  const user = await requirePermission("academy:learn");
  const credentials = await listLearnerCredentials(user.id);

  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">
        Your {COMPLETION_CERTIFICATE_LABEL}s
      </h1>
      <ul className="space-y-4">
        {credentials.map((c) => (
          <li key={c.id} className="border-b border-slate-200 pb-3">
            <p className="font-medium text-teal-950">{c.achievementTitle}</p>
            <p className="text-sm text-slate-600">
              Issued {c.issuedAt.toISOString().slice(0, 10)} · status {c.status}
              {c.expiresAt ? ` · expires ${c.expiresAt.toISOString().slice(0, 10)}` : null}
            </p>
            <Link
              href={`/academy/credentials/verify/${c.publicId}`}
              className="text-sm text-teal-800 underline"
            >
              Public verification link
            </Link>
          </li>
        ))}
      </ul>
      {credentials.length === 0 ? (
        <p className="text-slate-600">No certificates yet.</p>
      ) : null}
    </article>
  );
}
