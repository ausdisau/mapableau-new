import type { CurrentUser } from "@/lib/auth/current-user";

export function canCreateReport(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canEditDraftReport(
  user: CurrentUser | null,
  authorId: string
): boolean {
  return Boolean(user && user.id === authorId);
}

export function canPublishReport(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canUploadReportPhoto(
  user: CurrentUser | null,
  authorId: string
): boolean {
  return Boolean(user && user.id === authorId);
}
