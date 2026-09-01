package au.com.mapable.core.notifications

import au.com.mapable.core.model.InboxItem
import au.com.mapable.core.model.NotificationPrivacyPolicy

object NotificationPrivacy {
    fun preview(item: InboxItem, policy: NotificationPrivacyPolicy): InboxItem {
        if (!policy.redactedPreviewOnly) return item
        val redactedBody = if (policy.showParticipantNames) item.bodyPreview else "New MapAble update"
        return item.copy(
            title = if (policy.showParticipantNames) item.title else "MapAble",
            bodyPreview = redactedBody,
        )
    }
}
