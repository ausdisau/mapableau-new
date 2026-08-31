package au.com.mapable.core.network

import au.com.mapable.core.common.ApiResult
import au.com.mapable.core.model.AccessPlaceSummary
import au.com.mapable.core.model.CareBookingSummary
import au.com.mapable.core.model.InboxItem
import au.com.mapable.core.model.JobSummary
import au.com.mapable.core.model.MobileBootstrap
import au.com.mapable.core.model.MobileFeatureFlags
import au.com.mapable.core.model.MobileSession
import au.com.mapable.core.model.NotificationPrivacyPolicy
import au.com.mapable.core.model.RealtimeMode
import au.com.mapable.core.model.TransportTripSummary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/**
 * Thin HTTP client over MapAble Core REST.
 * No domain business rules — server remains authority.
 */
class MapAbleApiClient(
    private val baseUrlProvider: () -> String,
    private val accessTokenProvider: () -> String?,
) {
    suspend fun bootstrap(): ApiResult<MobileBootstrap> = withContext(Dispatchers.IO) {
        when (val raw = get("/api/mobile/bootstrap")) {
            is ApiResult.Err -> raw
            is ApiResult.Ok -> parseBootstrap(raw.value)
        }
    }

    suspend fun exchangeCredentials(email: String, password: String): ApiResult<MobileSession> =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("grantType", "password")
                .put("email", email)
                .put("password", password)
            when (val raw = post("/api/mobile/auth/exchange", body, authed = false)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseSession(raw.value)
            }
        }

    suspend fun refresh(refreshToken: String): ApiResult<MobileSession> =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("refreshToken", refreshToken)
            when (val raw = post("/api/mobile/auth/refresh", body, authed = false)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseSession(raw.value)
            }
        }

    suspend fun registerDevice(
        deviceId: String,
        platform: String,
        appVersion: String,
        pushToken: String?,
    ): ApiResult<Unit> = withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("deviceId", deviceId)
            .put("platform", platform)
            .put("appVersion", appVersion)
        if (pushToken != null) body.put("pushToken", pushToken)
        when (val raw = post("/api/mobile/devices", body, authed = true)) {
            is ApiResult.Err -> raw
            is ApiResult.Ok -> ApiResult.Ok(Unit)
        }
    }

    suspend fun verifyIntegrity(attestationToken: String): ApiResult<Boolean> =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("attestationToken", attestationToken)
            when (val raw = post("/api/mobile/integrity/verify", body, authed = true)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> {
                    val ok = raw.value.optBoolean("acceptable", true)
                    ApiResult.Ok(ok)
                }
            }
        }

    suspend fun searchAccess(query: String, limit: Int = 5): ApiResult<List<AccessPlaceSummary>> =
        withContext(Dispatchers.IO) {
            val path =
                "/api/access/search?q=${java.net.URLEncoder.encode(query, Charsets.UTF_8.name())}&limit=$limit&sort=relevance"
            when (val raw = get(path, authed = false)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parsePlaces(raw.value)
            }
        }

    suspend fun careBookings(): ApiResult<List<CareBookingSummary>> =
        withContext(Dispatchers.IO) {
            when (val raw = get("/api/care/bookings", authed = true)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseCare(raw.value)
            }
        }

    suspend fun transportTrips(): ApiResult<List<TransportTripSummary>> =
        withContext(Dispatchers.IO) {
            when (val raw = get("/api/transport/trips", authed = true)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseTrips(raw.value)
            }
        }

    suspend fun jobs(): ApiResult<List<JobSummary>> =
        withContext(Dispatchers.IO) {
            when (val raw = get("/api/jobs", authed = true)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseJobs(raw.value)
            }
        }

    suspend fun notifications(): ApiResult<List<InboxItem>> =
        withContext(Dispatchers.IO) {
            when (val raw = get("/api/notifications", authed = true)) {
                is ApiResult.Err -> raw
                is ApiResult.Ok -> parseInbox(raw.value)
            }
        }

    /**
     * Protected write gateway — always sends Idempotency-Key.
     * Domain mutation still executed only on server after permission/consent/audit.
     */
    suspend fun protectedPost(path: String, body: JSONObject): ApiResult<JSONObject> =
        withContext(Dispatchers.IO) {
            post(path, body, authed = true, idempotencyKey = UUID.randomUUID().toString())
        }

    private fun get(path: String, authed: Boolean = false): ApiResult<JSONObject> =
        request("GET", path, null, authed, null)

    private fun post(
        path: String,
        body: JSONObject,
        authed: Boolean,
        idempotencyKey: String? = null,
    ): ApiResult<JSONObject> = request("POST", path, body, authed, idempotencyKey)

    private fun request(
        method: String,
        path: String,
        body: JSONObject?,
        authed: Boolean,
        idempotencyKey: String?,
    ): ApiResult<JSONObject> {
        return try {
            val url = URL(baseUrlProvider().trimEnd('/') + path)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 30_000
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Content-Type", "application/json")
                if (authed) {
                    val token = accessTokenProvider()
                    if (token.isNullOrBlank()) {
                        return ApiResult.Err("Not signed in", code = "UNAUTHENTICATED")
                    }
                    setRequestProperty("Authorization", "Bearer $token")
                }
                if (idempotencyKey != null) {
                    setRequestProperty("Idempotency-Key", idempotencyKey)
                }
                if (body != null) {
                    doOutput = true
                    OutputStreamWriter(outputStream).use { it.write(body.toString()) }
                }
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.let { BufferedReader(InputStreamReader(it)).readText() }.orEmpty()
            if (code !in 200..299) {
                return ApiResult.Err(
                    message = text.ifBlank { "HTTP $code" },
                    code = "HTTP_$code",
                    retryable = code == 429 || code >= 500,
                )
            }
            val json = if (text.isBlank()) JSONObject() else JSONObject(text)
            ApiResult.Ok(json)
        } catch (e: Exception) {
            ApiResult.Err(e.message ?: "Network error", retryable = true)
        }
    }

    private fun parseBootstrap(json: JSONObject): ApiResult<MobileBootstrap> {
        val flags = json.optJSONObject("featureFlags") ?: JSONObject()
        val notif = json.optJSONObject("notificationPolicy") ?: JSONObject()
        val mode = when (json.optString("realtimeMode", "polling")) {
            "socket_io" -> RealtimeMode.SOCKET_IO
            else -> RealtimeMode.POLLING
        }
        return ApiResult.Ok(
            MobileBootstrap(
                apiBaseUrl = json.optString("apiBaseUrl"),
                minAppVersionCode = json.optInt("minAppVersionCode", 1),
                featureFlags = MobileFeatureFlags(
                    mobileApiEnabled = flags.optBoolean("mobileApiEnabled", false),
                    authExchangeEnabled = flags.optBoolean("authExchangeEnabled", false),
                    pushEnabled = flags.optBoolean("pushEnabled", false),
                    integrityEnabled = flags.optBoolean("integrityEnabled", false),
                    fusedLocationEnabled = flags.optBoolean("fusedLocationEnabled", false),
                    socketIoEnabled = flags.optBoolean("socketIoEnabled", false),
                ),
                notificationPolicy = NotificationPrivacyPolicy(
                    redactedPreviewOnly = notif.optBoolean("redactedPreviewOnly", true),
                    showParticipantNames = notif.optBoolean("showParticipantNames", false),
                ),
                realtimeMode = mode,
            ),
        )
    }

    private fun parseSession(json: JSONObject): ApiResult<MobileSession> {
        val access = json.optString("accessToken")
        if (access.isBlank()) return ApiResult.Err("Missing accessToken")
        return ApiResult.Ok(
            MobileSession(
                accessToken = access,
                refreshToken = json.optString("refreshToken"),
                expiresAtEpochMs = json.optLong("expiresAtEpochMs"),
                userId = json.optString("userId"),
                email = json.optString("email"),
                primaryRole = json.optString("primaryRole"),
            ),
        )
    }

    private fun parsePlaces(json: JSONObject): ApiResult<List<AccessPlaceSummary>> {
        val arr = json.optJSONArray("results") ?: json.optJSONArray("places") ?: JSONArray()
        val out = mutableListOf<AccessPlaceSummary>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out += AccessPlaceSummary(
                id = o.optString("id"),
                name = o.optString("name", o.optString("title")),
                confidenceLabel = o.optString("confidenceLabel", o.optString("confidence", "unknown")),
                suburb = o.optString("suburb").ifBlank { null },
            )
        }
        return ApiResult.Ok(out)
    }

    private fun parseCare(json: JSONObject): ApiResult<List<CareBookingSummary>> {
        val arr = json.optJSONArray("bookings") ?: json.optJSONArray("data") ?: JSONArray()
        val out = mutableListOf<CareBookingSummary>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out += CareBookingSummary(
                id = o.optString("id"),
                status = o.optString("status"),
                title = o.optString("title", o.optString("label", "Care booking")),
            )
        }
        return ApiResult.Ok(out)
    }

    private fun parseTrips(json: JSONObject): ApiResult<List<TransportTripSummary>> {
        val arr = json.optJSONArray("trips") ?: json.optJSONArray("data") ?: JSONArray()
        val out = mutableListOf<TransportTripSummary>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out += TransportTripSummary(
                id = o.optString("id"),
                status = o.optString("status"),
                label = o.optString("label", o.optString("title", "Trip")),
            )
        }
        return ApiResult.Ok(out)
    }

    private fun parseJobs(json: JSONObject): ApiResult<List<JobSummary>> {
        val arr = json.optJSONArray("jobs") ?: json.optJSONArray("data") ?: JSONArray()
        val out = mutableListOf<JobSummary>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out += JobSummary(
                id = o.optString("id"),
                title = o.optString("title"),
                employer = o.optString("employer").ifBlank { null },
            )
        }
        return ApiResult.Ok(out)
    }

    private fun parseInbox(json: JSONObject): ApiResult<List<InboxItem>> {
        val arr = json.optJSONArray("notifications") ?: json.optJSONArray("data") ?: JSONArray()
        val out = mutableListOf<InboxItem>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out += InboxItem(
                id = o.optString("id"),
                title = o.optString("title"),
                bodyPreview = o.optString("bodyPreview", o.optString("body", "")),
                read = o.optBoolean("read", false),
            )
        }
        return ApiResult.Ok(out)
    }
}
