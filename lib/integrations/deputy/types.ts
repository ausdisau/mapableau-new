export type DeputyEmployeeMapping = {
  workerProfileId: string;
  deputyEmployeeId: number;
  organisationId: string;
};

export type DeputyDraftShiftInput = {
  organisationId: string;
  workerProfileId: string;
  careShiftId: string;
  /** Unix seconds */
  startTimestamp: number;
  /** Unix seconds */
  endTimestamp: number;
  operationalUnitId: number;
  deputyEmployeeId: number;
  /** Always false in v0.1 — human publish required. */
  publish: false;
};

export type DeputyDraftShiftResult =
  | {
      ok: true;
      draft: true;
      published: false;
      remoteRosterId: string | null;
      dryRun: boolean;
      denialReason?: undefined;
    }
  | {
      ok: false;
      denialReason:
        | "deputy_disabled"
        | "missing_employee_mapping"
        | "publish_forbidden"
        | "overlapping_shift_conflict";
      message: string;
    };
