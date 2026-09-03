package au.com.mapable.core.googleplay

import au.com.mapable.core.common.ApiResult

/** Phase 04 — MapAble-owned interfaces; Google SDKs stay behind adapters. */

interface PlayServicesAvailability {
    fun isGooglePlayServicesAvailable(): Boolean
}

interface CredentialGateway {
    /**
     * Returns an ID token / assertion for MapAble server exchange, or Err if unavailable.
     * Never grants MapAble roles by itself.
     */
    suspend fun obtainGoogleIdToken(): ApiResult<String>
}

interface PushMessagingGateway {
    suspend fun currentToken(): ApiResult<String?>
    fun areNotificationsEnabled(): Boolean
}

data class DeviceLocation(val lat: Double, val lng: Double, val accuracyMeters: Float?)

interface FusedLocationGateway {
    /** Requires participant consent + runtime permission. */
    suspend fun lastKnownLocation(): ApiResult<DeviceLocation?>
}

interface PlayIntegrityGateway {
    suspend fun requestAttestation(nonce: String): ApiResult<String>
}

interface AppLinksGateway {
    fun canHandleMapAbleUrl(url: String): Boolean
}

interface DistributionGateway {
    fun checkForFlexibleUpdate()
}

class UnavailablePlayServices : PlayServicesAvailability {
    override fun isGooglePlayServicesAvailable(): Boolean = false
}

class NoOpCredentialGateway : CredentialGateway {
    override suspend fun obtainGoogleIdToken(): ApiResult<String> =
        ApiResult.Err("Google login unavailable", code = "GOOGLE_UNAVAILABLE")
}

class NoOpPushMessagingGateway : PushMessagingGateway {
    override suspend fun currentToken(): ApiResult<String?> = ApiResult.Ok(null)
    override fun areNotificationsEnabled(): Boolean = false
}

class DeniedFusedLocationGateway : FusedLocationGateway {
    override suspend fun lastKnownLocation(): ApiResult<DeviceLocation?> =
        ApiResult.Ok(null) // manual search fallback
}

class UnavailableIntegrityGateway : PlayIntegrityGateway {
    override suspend fun requestAttestation(nonce: String): ApiResult<String> =
        ApiResult.Err("Play Integrity unavailable", code = "INTEGRITY_UNAVAILABLE")
}

class DefaultAppLinksGateway : AppLinksGateway {
    override fun canHandleMapAbleUrl(url: String): Boolean =
        url.startsWith("https://mapable.com.au/") || url.startsWith("https://www.mapable.com.au/")
}

class NoOpDistributionGateway : DistributionGateway {
    override fun checkForFlexibleUpdate() = Unit
}

data class GooglePlayFacades(
    val availability: PlayServicesAvailability = UnavailablePlayServices(),
    val credentials: CredentialGateway = NoOpCredentialGateway(),
    val messaging: PushMessagingGateway = NoOpPushMessagingGateway(),
    val location: FusedLocationGateway = DeniedFusedLocationGateway(),
    val integrity: PlayIntegrityGateway = UnavailableIntegrityGateway(),
    val appLinks: AppLinksGateway = DefaultAppLinksGateway(),
    val distribution: DistributionGateway = NoOpDistributionGateway(),
)
