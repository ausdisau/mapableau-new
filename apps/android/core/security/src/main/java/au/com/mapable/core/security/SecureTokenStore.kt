package au.com.mapable.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import au.com.mapable.core.model.MobileSession

interface SecureTokenStore {
    fun saveSession(session: MobileSession)
    fun readSession(): MobileSession?
    fun clear()
}

/**
 * Keystore-backed encrypted prefs (Phase 08).
 * Falls back to private prefs only when EncryptedSharedPreferences is unavailable (unit tests).
 */
class EncryptedSecureTokenStore(context: Context) : SecureTokenStore {
    private val prefs: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "mapable_secure_session",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    } catch (_: Throwable) {
        context.getSharedPreferences("mapable_secure_session_fallback", Context.MODE_PRIVATE)
    }

    override fun saveSession(session: MobileSession) {
        prefs.edit()
            .putString(KEY_ACCESS, session.accessToken)
            .putString(KEY_REFRESH, session.refreshToken)
            .putLong(KEY_EXP, session.expiresAtEpochMs)
            .putString(KEY_USER, session.userId)
            .putString(KEY_EMAIL, session.email)
            .putString(KEY_ROLE, session.primaryRole)
            .apply()
    }

    override fun readSession(): MobileSession? {
        val access = prefs.getString(KEY_ACCESS, null) ?: return null
        return MobileSession(
            accessToken = access,
            refreshToken = prefs.getString(KEY_REFRESH, "").orEmpty(),
            expiresAtEpochMs = prefs.getLong(KEY_EXP, 0L),
            userId = prefs.getString(KEY_USER, "").orEmpty(),
            email = prefs.getString(KEY_EMAIL, "").orEmpty(),
            primaryRole = prefs.getString(KEY_ROLE, "").orEmpty(),
        )
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS = "access"
        private const val KEY_REFRESH = "refresh"
        private const val KEY_EXP = "exp"
        private const val KEY_USER = "user"
        private const val KEY_EMAIL = "email"
        private const val KEY_ROLE = "role"
    }
}

class InMemorySecureTokenStore : SecureTokenStore {
    @Volatile private var session: MobileSession? = null
    override fun saveSession(session: MobileSession) { this.session = session }
    override fun readSession(): MobileSession? = session
    override fun clear() { session = null }
}
