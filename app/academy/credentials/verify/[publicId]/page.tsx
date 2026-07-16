import { notFound } from "next/navigation";

import { verifyCredentialPublic } from "@/lib/academy/credentials/credential-service";

type Props = { params: Promise<{ publicId: string }> };

export default async function AcademyCredentialVerifyPage({ params }: Props) {
  const { publicId } = await params;
  const credential = await verifyCredentialPublic(publicId);
  if (!credential) notFound();

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">
        Credential verification
      </h1>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-600">Issuer</dt>
          <dd>{credential.issuer}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Achievement</dt>
          <dd>{credential.achievement}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Course</dt>
          <dd>
            {credential.courseTitle} ({credential.courseCode} v
            {credential.courseVersion})
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Issued</dt>
          <dd>{new Date(credential.issuedAt).toISOString().slice(0, 10)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Status</dt>
          <dd>
            {credential.status} · {credential.verificationStatus}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Learner</dt>
          <dd>{credential.learnerDisplayName ?? "Name hidden (opt-in not enabled)"}</dd>
        </div>
      </dl>
      <p className="text-sm text-slate-600">{credential.disclaimer}</p>
    </article>
  );
}
