package com.example.data.model

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path

enum class GearMode {
    GLOBAL,
    ENGINE,
    PREVIOUS
}

data class GearCircle(
    val id: Long,
    val mode: GearMode = GearMode.GLOBAL,
    // Radius values
    val radius: Float = 1000f, // For Engine or when Global
    val radiusGlobal: Float = 1000f,
    val radiusEngineMult: Float = 0.5f,
    val radiusPrevMult: Float = 0.5f,
    // Radius base & multiplier state (persists initial value)
    val radiusBase: Float? = null,
    val radiusStepIndex: Int = 11, // 11 is index of 1x
    // Speed values (in degrees per second)
    val speedDeg: Float = 50f, // For Engine or when Global
    val speedGlobal: Float = 50f,
    val speedEngineMult: Float = 1.5f,
    val speedPrevMult: Float = -1.5f,
    // Speed base & multiplier state (persists initial value)
    val speedBase: Float? = null,
    val speedStepIndex: Int = 11, // 11 is index of 1x
    // Angle state
    val angle: Float = -90f,
    val initialAngle: Float = -90f,
    // Drawing options
    val isPen: Boolean = true,
    val color: Color = Color(0xFFE39B3E)
)

data class ResolvedLink(
    val id: Long,
    val radius: Float,
    val speedDeg: Float,
    val cx: Float,
    val cy: Float,
    val px: Float,
    val py: Float,
    val isPen: Boolean,
    val color: Color
)

data class StrokePoint(
    val x: Float,
    val y: Float
)

data class InkStroke(
    val id: Long,
    val color: Color,
    val weight: Float,
    val points: MutableList<StrokePoint> = mutableListOf(),
    val composePath: Path = Path()
)
