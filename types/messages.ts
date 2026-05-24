import type { ConversationType } from "@/types/mapable-phase2";

export type ThreadType = ConversationType;

export type ThreadMemberRole =
  | "participant"
  | "nominee"
  | "provider_admin"
  | "support_worker"
  | "driver"
  | "plan_manager"
  | "mapable_admin"
  | "observer";

export interface MessageAttachmentMeta {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  documentId?: string;
}

export interface ThreadSummaryDto {
  id: string;
  type: ThreadType;
  title: string;
  bookingId?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  isSystemMessage: boolean;
  attachments?: MessageAttachmentMeta[];
  createdAt: string;
  editedAt?: string | null;
}

export interface CreateThreadRequestDto {
  threadType: ThreadType;
  subject: string;
  bookingId?: string;
  memberUserIds: string[];
}

export interface SendMessageRequestDto {
  body: string;
  plainLanguageSummary?: string;
  attachmentDocumentIds?: string[];
  attachments?: MessageAttachmentMeta[];
}
