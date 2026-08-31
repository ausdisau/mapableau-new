package au.com.mapable.core.testing

import au.com.mapable.core.model.MobileSession

object TestFixtures {
    fun session() = MobileSession(
        accessToken = "test-access",
        refreshToken = "test-refresh",
        expiresAtEpochMs = System.currentTimeMillis() + 3_600_000,
        userId = "user_test",
        email = "participant@example.com",
        primaryRole = "participant",
    )
}
