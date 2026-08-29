package au.com.mapable.core.model

data class MobileBootstrap(
    val apiBaseUrl: String,
    val minAppVersionCode: Int,
    val featureFlags: MobileFeatureFlags,
    val notificationPolicy: NotificationPrivacyPolicy,
    val realtimeMode: RealtimeMode,
)

data class MobileFeatureFlags(
    val mobileApiEnabled: Boolean,
    val authExchangeEnabled: Boolean,
    val pushEnabled: Boolean,
    val integrityEnabled: Boolean,
    val fusedLocationEnabled: Boolean,
    val socketIoEnabled: Boolean,
)

data class NotificationPrivacyPolicy(
    val redactedPreviewOnly: Boolean,
    val showParticipantNames: Boolean,
)

enum class RealtimeMode { POLLING, SOCKET_IO }

data class MobileSession(
    val accessToken: String,
    val refreshToken: String,
    val expiresAtEpochMs: Long,
    val userId: String,
    val email: String,
    val primaryRole: String,
)

data class AccessPlaceSummary(
    val id: String,
    val name: String,
    val confidenceLabel: String,
    val suburb: String? = null,
)

data class CareBookingSummary(val id: String, val status: String, val title: String)
data class TransportTripSummary(val id: String, val status: String, val label: String)
data class JobSummary(val id: String, val title: String, val employer: String?)
data class InboxItem(val id: String, val title: String, val bodyPreview: String, val read: Boolean)
