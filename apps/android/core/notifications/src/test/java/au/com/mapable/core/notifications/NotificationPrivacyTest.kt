package au.com.mapable.core.notifications

import au.com.mapable.core.model.InboxItem
import au.com.mapable.core.model.NotificationPrivacyPolicy
import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationPrivacyTest {
    @Test
    fun redactsWhenPolicyRequires() {
        val item = InboxItem("1", "Alice", "Shift with Bob", false)
        val out = NotificationPrivacy.preview(
            item,
            NotificationPrivacyPolicy(redactedPreviewOnly = true, showParticipantNames = false),
        )
        assertEquals("MapAble", out.title)
        assertEquals("New MapAble update", out.bodyPreview)
    }
}
