import { notifyUser } from "@/lib/notifications/notification-service";

export type AccessReviewEventName =
  | "accessibility.review.created"
  | "accessibility.review.published"
  | "accessibility.review.restricted"
  | "accessibility.review.removed"
  | "accessibility.review.replied"
  | "accessibility.review.confirmed"
  | "accessibility.comment.created"
  | "accessibility.comment.replied"
  | "accessibility.comment.reported"
  | "accessibility.issue.venue_responded"
  | "accessibility.issue.resolved"
  | "accessibility.issue.reopened"
  | "accessibility.points.awarded"
  | "accessibility.points.reversed"
  | "accessibility.badge.earned"
  | "accessibility.challenge.completed";

/**
 * Publish accessibility notifications through the existing notification boundary.
 * Does not send messages directly from database mutation code paths except via this helper.
 * Lock-screen body remains high-level (no sensitive review text).
 */
export async function emitAccessNotification(params: {
  userId: string;
  event: AccessReviewEventName;
  title: string;
  body: string;
}) {
  try {
    await notifyUser(params.userId, "access", params.title, params.body);
  } catch {
    // Prefer existing preferences for categories that already exist.
    try {
      await notifyUser(params.userId, "system", params.title, params.body);
    } catch {
      // Notification failures must not break domain writes.
    }
  }
}
