package au.com.mapable.core.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * MapAble visual tokens.
 *
 * Brand colours stay distinct from semantic service/status colours so meaning is
 * never conveyed by colour alone. All interactive components should also expose
 * visible text and accessibility semantics.
 */
object MapAbleTokens {
    val Navy = Color(0xFF0C1833)
    val Teal = Color(0xFF005B7F)
    val Gold = Color(0xFFF8C51C)
    val SoftBg = Color(0xFFF6FBFC)
    val SurfaceMuted = Color(0xFFF4F7FB)
    val Border = Color(0xFFD9E2EC)
    val TextMuted = Color(0xFF526276)

    val Care = Color(0xFF6D35B5)
    val CareSurface = Color(0xFFF4EEFC)
    val Travel = Color(0xFF0B63CE)
    val TravelSurface = Color(0xFFEAF3FF)
    val Jobs = Color(0xFFD96B00)
    val JobsSurface = Color(0xFFFFF2E5)
    val Success = Color(0xFF16794B)
    val SuccessSurface = Color(0xFFEAF7F0)
    val Support = Color(0xFF6A2DB4)
    val SupportSurface = Color(0xFFF4ECFD)

    val MinTouch: Dp = 48.dp
    val CardRadius: Dp = 20.dp
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
    surfaceVariant = MapAbleTokens.SurfaceMuted,
    onSurfaceVariant = MapAbleTokens.TextMuted,
    outline = MapAbleTokens.Border,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF6FC9EA),
    onPrimary = Color(0xFF002C3D),
    secondary = MapAbleTokens.Gold,
    onSecondary = MapAbleTokens.Navy,
    background = Color(0xFF0A1222),
    surface = Color(0xFF111B2D),
    onSurface = Color(0xFFF4F7FB),
    surfaceVariant = Color(0xFF1C2940),
    onSurfaceVariant = Color(0xFFD6DFEA),
    outline = Color(0xFF6D7B8D),
)

@Composable
fun MapAbleTheme(darkTheme: Boolean = false, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
