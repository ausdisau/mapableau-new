package au.com.mapable.core.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** MapAble brand tokens — navy + gold CTAs; TalkBack-first 48dp targets. */
object MapAbleTokens {
    val Navy = Color(0xFF0C1833)
    val Teal = Color(0xFF005B7F)
    val Gold = Color(0xFFF8C51C)
    val SoftBg = Color(0xFFF6FBFC)
    val MinTouch: Dp = 48.dp
    val ScreenPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
}

private val LightColors = lightColorScheme(
    primary = MapAbleTokens.Teal,
    onPrimary = Color.White,
    secondary = MapAbleTokens.Gold,
    onSecondary = MapAbleTokens.Navy,
    background = MapAbleTokens.SoftBg,
    onBackground = MapAbleTokens.Navy,
    surface = Color.White,
    onSurface = MapAbleTokens.Navy,
)

private val DarkColors = darkColorScheme(
    primary = MapAbleTokens.Teal,
    secondary = MapAbleTokens.Gold,
)

@Composable
fun MapAbleTheme(darkTheme: Boolean = false, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
