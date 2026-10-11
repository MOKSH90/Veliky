package com.example.veliky.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = VelikyCyan,
    onPrimary = Color(0xFF00363D),
    primaryContainer = VelikyCyanContainer,
    onPrimaryContainer = VelikyOnCyanContainer,

    secondary = VelikySkyBlue,
    onSecondary = Color(0xFF00344F),
    secondaryContainer = VelikySkyBlueContainer,
    onSecondaryContainer = Color(0xFFCBE6FF),

    tertiary = VelikyAmber,
    onTertiary = Color(0xFF3E2E00),
    tertiaryContainer = VelikyAmberContainer,
    onTertiaryContainer = Color(0xFFFFDF9E),

    error = VelikyRed,
    onError = Color(0xFF680010),
    errorContainer = VelikyRedContainer,
    onErrorContainer = Color(0xFFFFDAD6),

    background = VelikyObsidian,
    onBackground = VelikyTextPrimary,

    surface = VelikySurface,
    onSurface = VelikyTextPrimary,
    surfaceVariant = VelikySurfaceVariant,
    onSurfaceVariant = VelikyTextSecondary,

    surfaceContainer = VelikySurfaceContainer,
    surfaceContainerHigh = VelikySurfaceContainerHigh,

    outline = VelikyBorder,
    outlineVariant = Color(0xFF1E293B)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF006874),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF97F0FF),
    onPrimaryContainer = Color(0xFF001F24),

    secondary = Color(0xFF006590),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFC8E6FF),
    onSecondaryContainer = Color(0xFF001E2F),

    tertiary = Color(0xFF785900),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFDF9E),
    onTertiaryContainer = Color(0xFF261A00),

    error = Color(0xFFBA1A1A),
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),

    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),

    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFE2E8F0),
    onSurfaceVariant = Color(0xFF475569),

    surfaceContainer = Color(0xFFF1F5F9),
    surfaceContainerHigh = Color(0xFFE2E8F0),

    outline = Color(0xFFCBD5E1),
    outlineVariant = Color(0xFFE2E8F0)
)

@Composable
fun VelikyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}