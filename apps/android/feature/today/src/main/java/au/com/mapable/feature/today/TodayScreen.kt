package au.com.mapable.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.item
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import au.com.mapable.core.designsystem.MapAbleTokens
import au.com.mapable.core.ui.MapAblePrimaryButton
import au.com.mapable.core.ui.MapAbleSectionCard
import au.com.mapable.core.ui.MapAbleServiceCard
import au.com.mapable.core.ui.MapAbleStatusPill

/**
 * Participant-first Today experience.
 *
 * This screen intentionally uses clearly-labelled sample content until protected
 * participant data is connected through the existing MapAble API/RBAC boundary.
 */
@Composable
fun TodayScreen(
    lines: List<String>,
    modifier: Modifier = Modifier,
    emptyMessage: String = "Nothing to show yet.",
) {
    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val wideLayout = maxWidth >= 840.dp

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(MapAbleTokens.ScreenPadding),
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(MapAbleTokens.SectionGap),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Good morning",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        text = "Here’s what’s happening today.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            item {
                MapAbleSectionCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Preview",
                            style = MaterialTheme.typography.labelLarge,
                            color = MapAbleTokens.Blue,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = "Sample information is shown while protected participant data remains behind MapAble’s authenticated API and permission controls.",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }

            if (wideLayout) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(MapAbleTokens.SectionGap),
                    ) {
                        TodayTimeline(modifier = Modifier.weight(2f))
                        ParticipantControls(modifier = Modifier.weight(1f))
                    }
                }
            } else {
                item { TodayTimeline() }
                item { ParticipantControls() }
            }

            if (lines.isNotEmpty()) {
                item {
                    MapAbleSectionCard {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Development status",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                            )
                            lines.forEach { line ->
                                Text(
                                    text = line,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            } else {
                item {
                    Text(
                        text = emptyMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun TodayTimeline(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(MapAbleTokens.SectionGap),
    ) {
        Text(
            text = "Today",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.semantics { heading() },
        )

        MapAbleServiceCard(
            eyebrow = "Care · 8:00 am",
            title = "Support with Maya",
            detail = "Communication preferences available for this service only.",
            status = "Confirmed",
            accent = MapAbleTokens.Purple,
        )

        MapAbleServiceCard(
            eyebrow = "Travel · 8:45 am",
            title = "Accessible ride",
            detail = "Wheelchair space and step-free pickup recorded for this trip.",
            status = "Access fit recorded",
            accent = MapAbleTokens.Blue,
        )

        MapAbleServiceCard(
            eyebrow = "Jobs · 10:00 am",
            title = "Interview at Harbour Studio",
            detail = "Quiet-room and extra-time adjustments are shown only when you choose to share them.",
            status = "Adjustments ready",
            accent = MapAbleTokens.Orange,
        )
    }
}

@Composable
private fun ParticipantControls(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(MapAbleTokens.SectionGap),
    ) {
        MapAbleSectionCard {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        text = "My Access",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.semantics { heading() },
                    )
                    MapAbleStatusPill(
                        label = "3 snapshots",
                        accent = MapAbleTokens.Blue,
                    )
                }
                Text(
                    text = "You choose what each service can see. Review sharing before information moves between Care, Travel or Jobs.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                MapAblePrimaryButton(
                    label = "Review sharing",
                    onClick = {},
                )
            }
        }

        MapAbleSectionCard {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Need help?",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.semantics { heading() },
                )
                Text(
                    text = "Talk to a person. Human support should remain available even when automation, location or notifications are unavailable.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                MapAblePrimaryButton(
                    label = "Get human support",
                    onClick = {},
                )
            }
        }
    }
}
