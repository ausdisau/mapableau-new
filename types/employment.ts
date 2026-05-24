import type { EmploymentType, JobApplicationStatus, JobStatus } from "@prisma/client";

export type JobSummary = {
  id: string;
  title: string;
  employmentType: EmploymentType;
  location: string | null;
  remoteAllowed: boolean;
  flexibleHours: boolean;
  status: JobStatus;
};

export type JobApplicationSummary = {
  id: string;
  jobId: string;
  status: JobApplicationStatus;
  transportSupportNeeded: boolean;
  careSupportNeeded: boolean;
  submittedAt: string | null;
};

export type EmploymentSupportBundleView = {
  applicationId: string;
  transportBooking: { id: string; status: string } | null;
  careRequest: { id: string; status: string } | null;
  calendarEventId: string | null;
};

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  interview_requested: "Interview requested",
  successful: "Successful",
  unsuccessful: "Not successful",
  withdrawn: "Withdrawn",
};
