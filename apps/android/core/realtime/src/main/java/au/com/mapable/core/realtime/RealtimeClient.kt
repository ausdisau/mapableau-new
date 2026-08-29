package au.com.mapable.core.realtime

import au.com.mapable.core.model.RealtimeMode

/**
 * Redis is server-side only (Upstash cache). Android never connects to Redis.
 * Default mode is POLLING until Socket.IO is production-ready.
 */
interface RealtimeClient {
    val mode: RealtimeMode
    suspend fun refreshAuthoritative()
}

class PollingRealtimeClient(
    private val onPoll: suspend () -> Unit,
) : RealtimeClient {
    override val mode: RealtimeMode = RealtimeMode.POLLING
    override suspend fun refreshAuthoritative() = onPoll()
}
