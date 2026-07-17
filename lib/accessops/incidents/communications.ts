export interface IncidentCommunicationDraft {
  audience: "public" | "operator" | "owner";
  message: string;
  regulatorContact: false;
}

export function draftIncidentCommunication(
  message: string,
  audience: IncidentCommunicationDraft["audience"],
): IncidentCommunicationDraft {
  return { audience, message, regulatorContact: false };
}

export function shouldAutoContactRegulator(): false {
  return false;
}
