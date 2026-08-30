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
import au.com.mapable.feature.today.TodayItem
import au.com.mapable.feature.today.TodayScreen
import au.com.mapable.feature.today.TodayTone
import au.com.mapable.feature.travel.TravelScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val deepLink = intent?.data?.toString()
        setContent {
            MapAbleTheme {
                var tab by remember { mutableStateOf(0) }
                val tabs = listOf("Today", "Access", "Care", "Travel", "Jobs", "Inbox", "Settings")
                val previewItems = if (BuildConfig.DEBUG) {
                    listOf(
                        TodayItem(
                            id = "care-preview",
                            service = "Care",
                            time = "8:00 am",
                            title = "Support with your chosen worker",
                            supportingText = "Preview only — live care bookings stay behind native account access.",
                            status = "Preview",
                            tone = TodayTone.CARE,
                        ),
                        TodayItem(
                            id = "travel-preview",
                            service = "Travel",
                            time = "8:45 am",
                            title = "Accessible trip",
                            supportingText = "Preview only — access-fit and trip status will come from authorised MapAble data.",
                            status = "Preview",
                            tone = TodayTone.TRAVEL,
                        ),
                        TodayItem(
                            id = "jobs-preview",
                            service = "Jobs",
                            time = "10:00 am",
                            title = "Work and study",
                            supportingText = "Preview only — employment information remains participant-controlled.",
                            status = "Preview",
                            tone = TodayTone.JOBS,
                        ),
                    )
                } else {
                    emptyList()
                }

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
                            greeting = "Welcome to MapAble",
                            scheduleItems = previewItems,
                            previewNotice = if (BuildConfig.DEBUG) {
                                listOfNotNull(
                                    "Design preview — synthetic data only.",
                                    deepLink?.let { "Opened from App Link: $it" },
                                ).joinToString(" ")
                            } else {
                                null
                            },
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
