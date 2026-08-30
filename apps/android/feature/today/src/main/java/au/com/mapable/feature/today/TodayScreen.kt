package au.com.mapable.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import au.com.mapable.core.designsystem.MapAbleTokens
import au.com.mapable.core.ui.MapAbleInfoPanel
import au.com.mapable.core.ui.MapAbleSectionTitle
import au.com.mapable.core.ui.MapAbleServiceCard

enum class TodayTone {
    CARE,
    TRAVEL,
    JOBS,
    NEUTRAL,
}

data class TodayItem(
    val id: String,
    val service: String,
    val time: String,
    val title: String,
    val supportingText: String,
    val status: String,
    val tone: TodayTone = TodayTone.NEUTRAL,
)

private data class TodayPalette(val accent: Color, val surface: Color)

@Composable
private fun TodayTone.palette(): TodayPalette = when (this) {
    TodayTone.CARE -> TodayPalette(MapAbleTokens.Care, MapAbleTokens.CareSurface)
    TodayTone.TRAVEL -> TodayPalette(MapAbleTokens.Travel, MapAbleTokens.TravelSurface)
    TodayTone.JOBS -> TodayPalette(MapAbleTokens.Jobs, MapAbleTokens.JobsSurface)
    TodayTone.NEUTRAL -> TodayPalette(MapAbleTokens.Teal, MapAbleTokens.SurfaceMuted)
}

@Composable
fun TodayScreen(
    greeting: String,
    scheduleItems: List<TodayItem>,
    modifier: Modifier = Modifier,
    supportingText: String = "Here’s what’s happening today.",
    previewNotice: String? = null,
    onReviewSharing: () -> Unit = {},
    onGetSupport: () -> Unit = {},
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(MapAbleTokens.ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text(
                text = greeting,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                text = supportingText,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        previewNotice?.let { notice ->
            item {
                Text(
                    text = notice,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 2.dp),
                )
            }
        }

        item {
            MapAbleSectionTitle(
                title = "Today",
                supportingText = if (scheduleItems.isEmpty()) {
                    "Nothing scheduled. Your confirmed services will appear here."
                } else {
                    "Your services stay separate so you can review each one clearly."
                },
            )
        }

        if (scheduleItems.isEmpty()) {
            item {
                MapAbleInfoPanel(
                    title = "Your day is clear",
                    body = "When authorised Care, Travel or Jobs activity is available, MapAble will show it here without booking or sharing anything automatically.",
                    actionLabel = "Review information sharing",
                    onAction = onReviewSharing,
                )
            }
        } else {
            items(scheduleItems, key = { it.id }) { item ->
                val palette = item.tone.palette()
                MapAbleServiceCard(
                    service = item.service,
                    time = item.time,
                    title = item.title,
                    supportingText = item.supportingText,
                    status = item.status,
                    accent = palette.accent,
                    accentSurface = palette.surface,
                )
            }
        }

        item {
            MapAbleInfoPanel(
                title = "My Access",
                body = "You choose what each MapAble service can see. Sharing stays purpose-specific and can be reviewed or changed.",
                actionLabel = "Review sharing",
                onAction = onReviewSharing,
                accent = MapAbleTokens.Travel,
            )
        }

        item {
            MapAbleInfoPanel(
                title = "Need help?",
                body = "Use the human support pathway whenever you want a person involved. Automated suggestions never replace your choice.",
                actionLabel = "Get human support",
                onAction = onGetSupport,
                accent = MapAbleTokens.Support,
                container = MapAbleTokens.SupportSurface,
            )
        }
    }
}
