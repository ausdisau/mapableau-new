package au.com.mapable.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import au.com.mapable.core.designsystem.MapAbleTheme
import au.com.mapable.feature.access.AccessScreen
import au.com.mapable.feature.care.CareScreen
import au.com.mapable.feature.inbox.InboxScreen
import au.com.mapable.feature.jobs.JobsScreen
import au.com.mapable.feature.settings.SettingsScreen
import au.com.mapable.feature.today.TodayScreen
import au.com.mapable.feature.travel.TravelScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val deepLink = intent?.data?.toString()
        setContent {
            MapAbleTheme {
                var tab by remember { mutableStateOf(0) }
                val tabs = listOf("Today", "Access", "Care", "Travel", "Jobs", "Inbox", "Settings")
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            tabs.forEachIndexed { index, label ->
                                NavigationBarItem(
                                    selected = tab == index,
                                    onClick = { tab = index },
                                    icon = { Text(label.take(1)) },
                                    label = { Text(label) },
                                    modifier = Modifier.semantics {
                                        contentDescription = label
                                    },
                                )
                            }
                        }
                    },
                ) { padding ->
                    val mod = Modifier.padding(padding)
                    when (tab) {
                        0 -> TodayScreen(
                            lines = listOfNotNull(
                                "MapAble native backbone",
                                deepLink?.let { "Opened from App Link: $it" },
                            ),
                            modifier = mod,
                        )
                        1 -> AccessScreen(
                            lines = listOf(
                                "List-first Access search",
                                "MapLibre + OSM (not Google Maps)",
                                "Location optional — manual search always available",
                            ),
                            modifier = mod,
                        )
                        2 -> CareScreen(lines = listOf("Read-only care bookings via /api/care/*"), modifier = mod)
                        3 -> TravelScreen(lines = listOf("Read-only trips via /api/transport/trips"), modifier = mod)
                        4 -> JobsScreen(lines = listOf("Jobs + disclosure-preview via participant APIs"), modifier = mod)
                        5 -> InboxScreen(lines = listOf("Notifications with redacted previews when push off"), modifier = mod)
                        else -> SettingsScreen(
                            lines = listOf(
                                "Package: ${BuildConfig.APPLICATION_ID}",
                                "API: ${BuildConfig.API_BASE_URL}",
                                "Google Play adapters degrade gracefully",
                            ),
                            modifier = mod,
                        )
                    }
                }
            }
        }
    }
}
