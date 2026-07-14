/**
 * Future extension point stubs — not implemented in the MVP vertical slice.
 * Keep interfaces stable so Phase 5+ adapters can plug in without schema churn.
 */

export interface OpenBadgesExporter {
  exportCredential(credentialPublicId: string): Promise<unknown>;
}

export interface XapiLearningRecorder {
  recordStatement(statement: Record<string, unknown>): Promise<void>;
}

export interface ScormPackageDispatcher {
  importPackage(storageKey: string): Promise<{ courseVersionId: string }>;
}

export interface NadiaAcademyCoach {
  answer(question: string): Promise<{ answer: string; citations: string[] }>;
}

export const openBadgesStub: OpenBadgesExporter = {
  async exportCredential() {
    throw new Error("Open Badges 3.0 export is not enabled in MVP");
  },
};

export const xapiStub: XapiLearningRecorder = {
  async recordStatement() {
    throw new Error("xAPI learning events are not enabled in MVP");
  },
};

export const scormStub: ScormPackageDispatcher = {
  async importPackage() {
    throw new Error("SCORM/cmi5 import is not enabled in MVP");
  },
};

export const nadiaCoachStub: NadiaAcademyCoach = {
  async answer() {
    throw new Error("NADIA Academy Coach is not enabled in MVP");
  },
};
