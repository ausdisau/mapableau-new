import type { JobApplicationStatus, JobStatus } from "@prisma/client";

export type JobSummary = {
  id: string;
  title: string;
  status: JobStatus;
  location: string | null;
  remoteAllowed: boolean;
};

export type EmploymentSupportBundle = {
  applicationId: string;
  transportBookingId?: string;
  careRequestId?: string;
  calendarEventId?: string;
  duplicate?: boolean;
};

export const JOB_APPLICATION_STATUS_LABELS: Record<
  JobApplicationStatus,
  string
> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  interview_requested: "Interview requested",
  successful: "Successful",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
};
