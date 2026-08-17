export const STORAGE_AUDIT_ACTIONS = {
  uploadAuthorised: "storage.upload_authorised",
  uploadCompleted: "storage.upload_completed",
  readAuthorised: "storage.read_authorised",
  deleteRequested: "storage.delete_requested",
  objectDeleted: "storage.object_deleted",
  evidenceAttached: "evidence.attached",
  evidenceSuperseded: "evidence.superseded",
  evidenceDisputed: "evidence.disputed",
  evidenceVerificationChanged: "evidence.verification_changed",
} as const;
