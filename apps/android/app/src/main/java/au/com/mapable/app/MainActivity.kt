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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import au.com.mapable.core.designsystem.MapAbleTheme
import au.com.mapable.feature.access.AccessScreen
import au.com.mapable.feature.care.CareScreen
import au.com.mapable.feature.jobs.JobsScreen
import au.com.mapable.feature.today.TodayScreen
import au.com.mapable.feature.travel.TravelScreen

private data class PrimaryDestination(
    val label: String,
    val shortLabel: String,
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val deepLink = intent?.data?.toString()

        setContent {
            MapAbleTheme {
                var tab by remember { mutableIntStateOf(0) }
                val destinations = listOf(
                    PrimaryDestination("Today", "T"),
                    PrimaryDestination("Access", "A"),
                    PrimaryDestination("Care", "C"),
                    PrimaryDestination("Travel", "Tr"),
                    PrimaryDestination("Jobs", "J"),
                )

                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            destinations.forEachIndexed { index, destination ->
                                NavigationBarItem(
                                    selected = tab == index,
                                    onClick = { tab = index },
                                    icon = { Text(destination.shortLabel) },
                                    label = { Text(destination.label) },
                                    modifier = Modifier.semantics {
                                        contentDescription = destination.label
                                    },
                                )
                            }
                        }
                    },
                ) { padding ->
                    val contentModifier = Modifier.padding(padding)
                    when (tab) {
                        0 -> TodayScreen(
                            lines = listOfNotNull(
                                "Native participant dashboard preview",
                                deepLink?.let { "Opened from App Link: $it" },
                            ),
                            modifier = contentModifier,
                        )
                        1 -> AccessScreen(
                            lines = listOf(
                                "List-first Access search",
                                "MapLibre + OpenStreetMap",
                                "Location is optional; manual search remains available",
                            ),
                            modifier = contentModifier,
                        )
                        2 -> CareScreen(
                            lines = listOf("Read-only Care data remains behind MapAble permissions"),
                            modifier = contentModifier,
                        )
                        3 -> TravelScreen(
                            lines = listOf("Read-only Travel data remains behind MapAble permissions"),
                            modifier = contentModifier,
                        )
                        else -> JobsScreen(
                            lines = listOf("Employment disclosure remains participant-controlled"),
                            modifier = contentModifier,
                        )
                    }
                }
            }
        }
    }
}
