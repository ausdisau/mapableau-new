export type ThreadType =
  | "direct"
  | "group"
  | "booking"
  | "transport_trip"
  | "invoice"
  | "service_agreement"
  | "support_ticket"
  | "complaint"
  | "incident_safe_comms"
  | "telehealth"
  | "provider_team"
  | "admin_support";

export type MessageType =
  | "text"
  | "attachment"
  | "image"
  | "voice_note"
  | "system_event"
  | "booking_card"
  | "invoice_card"
  | "service_agreement_card"
  | "telehealth_link"
  | "support_ticket_update"
  | "incident_safety_update";

export type MessageStatus =
  | "draft"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "deleted";

export type MessageReportReason =
  | "abusive_or_harassing"
  | "unsafe_support"
  | "billing_issue"
  | "privacy_concern"
  | "discrimination"
  | "worker_no_show"
  | "inappropriate_contact"
  | "other";

export interface ConversationParticipant {
  id: string;
  threadId: string;
  profileId: string;
  role: string;
  displayName: string;
  canSend: boolean;
  canAttachFiles: boolean;
  muted: boolean;
  blocked: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export interface ConversationThread {
  id: string;
  threadType: ThreadType;
  title: string;
  participantId: string | null;
  providerId: string | null;
  bookingId: string | null;
  transportTripId: string | null;
  invoiceId: string | null;
  serviceAgreementId: string | null;
  supportTicketId: string | null;
  incidentId: string | null;
  complaintId: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  lastMessagePreview?: string | null;
  unreadCount?: number;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  documentId: string;
  attachmentType: string;
  createdAt: string;
}

export interface MessageReceipt {
  id: string;
  messageId: string;
  profileId: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface Message {
  id: string;
  threadId: string;
  senderProfileId: string;
  messageType: MessageType;
  body: string;
  status: MessageStatus;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  senderDisplayName?: string;
  attachments?: MessageAttachment[];
  receipts?: MessageReceipt[];
}

export interface MessageReport {
  id: string;
  messageId: string | null;
  threadId: string;
  reporterProfileId: string;
  reason: MessageReportReason;
  details: string | null;
  status: string;
  createdAt: string;
}

export type RealtimeMessageEvent =
  | { type: "message:new"; threadId: string; message: Message }
  | { type: "message:read"; threadId: string; messageId: string; profileId: string }
  | { type: "typing:start"; threadId: string; profileId: string }
  | { type: "typing:stop"; threadId: string; profileId: string }
  | { type: "presence:update"; threadId: string; profileId: string; state: "online" | "away" | "offline" };

export interface ViewerContext {
  profileId: string;
  primaryRole: string;
  organisationIds: string[];
  isAdmin: boolean;
}

export interface ThreadContextLinks {
  booking?: { id: string; title: string; href: string };
  invoice?: { id: string; title: string; href: string };
  serviceAgreement?: { id: string; title: string; href: string };
  supportTicket?: { id: string; title: string; href: string };
  transportTrip?: { id: string; title: string; href: string };
}
