import Link from "next/link";
import { notFound } from "next/navigation";

import { ComplaintStatusPanel } from "@/components/complaints/ComplaintStatusPanel";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessComplaint } from "@/lib/disputes/access";
import { getComplaintById } from "@/lib/complaints/complaint-service";
import {
  COMPLAINT_TYPE_LABELS,
  formatStatusLabel,
} from "@/lib/disputes/labels";

export const metadata = { title: "Complaint details | MapAble Core" };

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const complaint = await getComplaintById(id);
  if (!complaint) notFound();
  if (!(await canAccessComplaint(user, complaint))) notFound();

  const isParticipant = complaint.participantId === user.id;
  const responses = isParticipant
    ? complaint.responses.filter((r) => !r.isInternal)
    : complaint.responses;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <Link href="/dashboard/complaints" className="text-sm text-primary underline">
          Back to complaints
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">{complaint.title}</h1>
        <p className="text-sm text-muted-foreground">
          {COMPLAINT_TYPE_LABELS[complaint.type]} · {formatStatusLabel(complaint.status)}
        </p>
        {complaint.safetyEscalated ? (
          <p className="mt-2 text-sm" role="status">
            This complaint was escalated to our incident and safeguarding workflow
            for review. You can check updates under{" "}
            <Link href="/dashboard/incidents" className="text-primary underline">
              your reports
            </Link>
            .
          </p>
        ) : null}
      </header>

      <p className="whitespace-pre-wrap text-sm">{complaint.description}</p>

      <ComplaintStatusPanel
        complaintId={complaint.id}
        currentStatus={complaint.status}
        isAdmin={isAdminRole(user.primaryRole)}
      />

      {responses.length > 0 ? (
        <section aria-labelledby="complaint-responses-heading">
          <h2
            id="complaint-responses-heading"
            className="font-heading text-lg font-semibold"
          >
            Responses
          </h2>
          <ul className="mt-3 space-y-2">
            {responses.map((r) => (
              <li key={r.id} className="rounded-lg border p-3 text-sm">
                {r.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="space-y-2">
        {complaint.events.map((ev) => (
          <li key={ev.id} className="text-sm text-muted-foreground">
            {new Date(ev.createdAt).toLocaleString("en-AU")}: {ev.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
