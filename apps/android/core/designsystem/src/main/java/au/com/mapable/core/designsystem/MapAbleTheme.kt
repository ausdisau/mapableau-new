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
 * The palette keeps the established navy/teal/gold foundation while adding
 * semantic service accents used by the participant dashboard. Every semantic
 * colour must be paired with text or iconography; colour is never the sole
 * carrier of meaning.
 */
object MapAbleTokens {
    val Navy = Color(0xFF0C1833)
    val NavyMuted = Color(0xFF43506A)
    val Teal = Color(0xFF005B7F)
    val Gold = Color(0xFFF8C51C)

    val Purple = Color(0xFF6F32B6)
    val Blue = Color(0xFF075FC9)
    val Orange = Color(0xFFE96A00)
    val Green = Color(0xFF087A55)

    val SoftBg = Color(0xFFF6F8FC)
    val SoftPurple = Color(0xFFF5EEFC)
    val SoftBlue = Color(0xFFEDF5FF)
    val SoftOrange = Color(0xFFFFF3E7)
    val SoftGreen = Color(0xFFEBF8F2)
    val Border = Color(0xFFDDE3EC)

    val MinTouch: Dp = 48.dp
    val CardRadius: Dp = 18.dp
    val SectionGap: Dp = 16.dp
    val ScreenPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp)
}

private val LightColors = lightColorScheme(
    primary = MapAbleTokens.Blue,
    onPrimary = Color.White,
    secondary = MapAbleTokens.Gold,
    onSecondary = MapAbleTokens.Navy,
    tertiary = MapAbleTokens.Purple,
    onTertiary = Color.White,
    background = MapAbleTokens.SoftBg,
    onBackground = MapAbleTokens.Navy,
    surface = Color.White,
    onSurface = MapAbleTokens.Navy,
    surfaceVariant = Color(0xFFF0F3F8),
    onSurfaceVariant = MapAbleTokens.NavyMuted,
    outline = MapAbleTokens.Border,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8CC6FF),
    onPrimary = Color(0xFF00325F),
    secondary = MapAbleTokens.Gold,
    tertiary = Color(0xFFD7B8FF),
    background = Color(0xFF0B1324),
    surface = Color(0xFF121D31),
    onSurface = Color(0xFFF3F6FC),
)

@Composable
fun MapAbleTheme(darkTheme: Boolean = false, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
