package au.com.mapable.app

import android.app.Application
import au.com.mapable.core.datastore.PreferencesStore
import au.com.mapable.core.googleplay.GooglePlayFacades
import au.com.mapable.core.network.MapAbleApiClient
import au.com.mapable.core.security.EncryptedSecureTokenStore
import au.com.mapable.core.security.SecureTokenStore

class MapAbleApplication : Application() {
    lateinit var tokenStore: SecureTokenStore
        private set
    lateinit var preferencesStore: PreferencesStore
        private set
    lateinit var apiClient: MapAbleApiClient
        private set
    val googlePlay: GooglePlayFacades = GooglePlayFacades()

    override fun onCreate() {
        super.onCreate()
        tokenStore = EncryptedSecureTokenStore(this)
        preferencesStore = PreferencesStore(this)
        apiClient = MapAbleApiClient(
            baseUrlProvider = {
                preferencesStore.apiBaseUrl(BuildConfig.API_BASE_URL)
            },
            accessTokenProvider = { tokenStore.readSession()?.accessToken },
        )
    }
}
