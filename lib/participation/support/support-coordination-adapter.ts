export interface SupportAllocationReference {
  status: "stub";
  note: string;
  workforceAllocationReferenceId: null;
}

export function requestSupportAllocationReference(): SupportAllocationReference {
  return {
    status: "stub",
    note: "Wave 16 workforce allocation is required before support can be reserved.",
    workforceAllocationReferenceId: null,
  };
}
