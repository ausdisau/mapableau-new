package au.com.mapable.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import au.com.mapable.core.designsystem.MapAbleTokens

@Composable
fun TodayScreen(
    lines: List<String>,
    modifier: Modifier = Modifier,
    emptyMessage: String = "Nothing to show yet.",
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(MapAbleTokens.ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "Today",
            style = androidx.compose.material3.MaterialTheme.typography.headlineSmall,
            modifier = Modifier.semantics { heading() },
        )
        if (lines.isEmpty()) {
            Text(emptyMessage)
        } else {
            LazyColumn(
                contentPadding = PaddingValues(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(lines) { line ->
                    Text(line)
                }
            }
        }
    }
}
