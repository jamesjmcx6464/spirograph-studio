package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = BrassGold,
    onPrimary = CanvasBg,
    primaryContainer = BrassDim,
    onPrimaryContainer = PaperWhite,
    secondary = TealAccent,
    onSecondary = CanvasBg,
    secondaryContainer = PanelBgElevated,
    onSecondaryContainer = TealAccent,
    tertiary = InkAmber,
    onTertiary = CanvasBg,
    background = CanvasBg,
    onBackground = PaperWhite,
    surface = PanelBg,
    onSurface = PaperWhite,
    surfaceVariant = PanelBgElevated,
    onSurfaceVariant = MutedGray,
    outline = PanelEdge,
    outlineVariant = PanelEdgeFocused,
    error = DangerRed,
    onError = PaperWhite
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
