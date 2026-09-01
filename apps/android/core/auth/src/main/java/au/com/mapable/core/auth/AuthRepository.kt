package au.com.mapable.core.auth

import au.com.mapable.core.common.ApiResult
import au.com.mapable.core.model.MobileSession
import au.com.mapable.core.network.MapAbleApiClient
import au.com.mapable.core.security.SecureTokenStore

class AuthRepository(
    private val api: MapAbleApiClient,
    private val tokenStore: SecureTokenStore,
) {
    suspend fun signInWithPassword(email: String, password: String): ApiResult<MobileSession> {
        val result = api.exchangeCredentials(email, password)
        if (result is ApiResult.Ok) {
            tokenStore.saveSession(result.value)
        }
        return result
    }

    suspend fun refreshIfNeeded(): ApiResult<MobileSession?> {
        val current = tokenStore.readSession() ?: return ApiResult.Ok(null)
        if (current.expiresAtEpochMs > System.currentTimeMillis() + 60_000) {
            return ApiResult.Ok(current)
        }
        val refreshed = api.refresh(current.refreshToken)
        if (refreshed is ApiResult.Ok) tokenStore.saveSession(refreshed.value)
        return refreshed
    }

    suspend fun signOut() {
        tokenStore.clear()
    }

    fun currentSession(): MobileSession? = tokenStore.readSession()
}
