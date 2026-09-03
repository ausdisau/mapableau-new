package au.com.mapable.core.datastore

import android.content.Context

/** Non-secret preferences (theme, last bootstrap flags). Tokens live in core:security. */
class PreferencesStore(context: Context) {
    private val prefs = context.getSharedPreferences("mapable_prefs", Context.MODE_PRIVATE)

    fun setApiBaseUrl(url: String) = prefs.edit().putString("api_base", url).apply()
    fun apiBaseUrl(default: String): String = prefs.getString("api_base", default) ?: default

    fun setLocationConsent(granted: Boolean) =
        prefs.edit().putBoolean("location_consent", granted).apply()

    fun locationConsent(): Boolean = prefs.getBoolean("location_consent", false)
}
