package com.example.data.model

import androidx.compose.ui.graphics.Color

val InkPalette = listOf(
    Color(0xFFE39B3E), // Amber / Ochre Ink
    Color(0xFF5FD3C4), // Mint / Cyan
    Color(0xFFC9A26A), // Brass Gold
    Color(0xFFE7E3DA), // Parchment / Paper
    Color(0xFFE85C5C), // Ruby Crimson
    Color(0xFF8E7CE8), // Electric Violet
    Color(0xFF4DD0E1), // Glacier Blue
    Color(0xFFFF80AB)  // Rose Quartz
)

fun Color.toHexString(): String {
    val red = (this.red * 255).toInt().coerceIn(0, 255)
    val green = (this.green * 255).toInt().coerceIn(0, 255)
    val blue = (this.blue * 255).toInt().coerceIn(0, 255)
    return String.format("#%02X%02X%02X", red, green, blue)
}

fun parseHexColor(hex: String, defaultColor: Color = InkPalette[0]): Color {
    return try {
        val clean = hex.trim().removePrefix("#")
        val colorInt = clean.toLong(16).toInt()
        Color(0xFF000000 or colorInt.toLong())
    } catch (_: Exception) {
        defaultColor
    }
}

data class CuratedPreset(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String,
    val description: String,
    val formulaSummary: String,
    val speedMult: Float = 1.0f,
    val weight: Float = 2.0f,
    val circles: List<GearCircle>
)

object PresetLibrary {
    val presets: List<CuratedPreset> = listOf(
        CuratedPreset(
            id = "character_avatar",
            title = "Character Silhouette",
            subtitle = "Harmonic Figure with Looped Limbs",
            category = "Featured",
            description = "A 4-tier coupled epicyclic system that traces an anthropomorphic figure with curved arms, torso, and looping legs.",
            formulaSummary = "R1: 20px (50°/s) → R2: ×4.9 (-0.2x) → R3: ×0.7 (-1.5x) → R4: ×0.3 (7.0x)",
            speedMult = 1.0f,
            weight = 2.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 20f, radiusGlobal = 20f, speedDeg = 50f, isPen = false, color = InkPalette[0]),
                GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 4.9f, speedPrevMult = -0.2f, isPen = false, color = InkPalette[0]),
                GearCircle(id = 3, mode = GearMode.PREVIOUS, radiusPrevMult = 0.7f, speedPrevMult = -1.5f, isPen = false, color = InkPalette[0]),
                GearCircle(id = 4, mode = GearMode.PREVIOUS, radiusPrevMult = 0.3f, speedPrevMult = 7.0f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "spiro_flower",
            title = "Classic Spirograph",
            subtitle = "3-Gear Harmonic Flower",
            category = "Spirographs",
            description = "A balanced trio of counter-rotating arms producing a delicate multi-lobed floral hypocycloid.",
            formulaSummary = "R1: 1000px (50°/s) → R2: 500px (-150°/s) → R3: 250px (-100°/s)",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = false, color = InkPalette[0]),
                GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 0.5f, speedPrevMult = -3.0f, isPen = false, color = InkPalette[1]),
                GearCircle(id = 3, mode = GearMode.PREVIOUS, radiusPrevMult = 0.5f, speedPrevMult = -2.0f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "golden_bloom",
            title = "Golden Ratio Bloom",
            subtitle = "Phi Harmonic Epicycles",
            category = "Harmonics",
            description = "Epicycles scaled by the golden ratio (~1.618) generating an organic phyllotaxis mandala bloom.",
            formulaSummary = "R1: 1000px (50°/s) → R2: 618px (80.9°/s) → R3: 382px (-80.9°/s) → R4: 236px (80.9°/s)",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = false, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 0.618f, speedPrevMult = 1.618f, isPen = false, color = InkPalette[1]),
                GearCircle(id = 3, mode = GearMode.PREVIOUS, radiusPrevMult = 0.618f, speedPrevMult = -1.618f, isPen = true, color = InkPalette[1]),
                GearCircle(id = 4, mode = GearMode.PREVIOUS, radiusPrevMult = 0.618f, speedPrevMult = -1.618f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "fourier_square",
            title = "Fourier Epicycle Wave",
            subtitle = "Odd Harmonic Series (1f, 3f, 5f)",
            category = "Fourier",
            description = "Simulating Fourier series epicycles where radii drop by 1/(2n-1) and angular velocities follow odd integer multiples.",
            formulaSummary = "Σ (1/k) · sin(k·ωt), k ∈ {1, 3, 5, 7}",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = false, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.ENGINE, radiusEngineMult = 0.333f, speedEngineMult = 3.0f, isPen = false, color = InkPalette[1]),
                GearCircle(id = 3, mode = GearMode.ENGINE, radiusEngineMult = 0.200f, speedEngineMult = 5.0f, isPen = false, color = InkPalette[5]),
                GearCircle(id = 4, mode = GearMode.ENGINE, radiusEngineMult = 0.143f, speedEngineMult = 7.0f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "hypotrochoid_star",
            title = "Pentagram Nebula",
            subtitle = "5-Cusp Hypocycloid Star",
            category = "Spirographs",
            description = "Fast outer planetary gear orbiting an engine ring creating sharp 5-pointed celestial geometry.",
            formulaSummary = "R1: 1000px (50°/s) → R2: 400px (-250°/s) → R3: 200px (500°/s)",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = false, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.GLOBAL, radiusGlobal = 400f, speedGlobal = -250f, isPen = false, color = InkPalette[4]),
                GearCircle(id = 3, mode = GearMode.GLOBAL, radiusGlobal = 200f, speedGlobal = 500f, isPen = true, color = InkPalette[1])
            )
        ),
        CuratedPreset(
            id = "trefoil_knot",
            title = "Trefoil Epicyclic Knot",
            subtitle = "Topological 3-Fold Loop",
            category = "Harmonics",
            description = "Two resonant frequencies producing a self-weaving 3D-projected trefoil ribbon curve.",
            formulaSummary = "R1: 1000px (50°/s) → R2: 600px (-75°/s) → R3: 396px (150°/s)",
            speedMult = 1.0f,
            weight = 8.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = true, color = InkPalette[5]),
                GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 0.6f, speedPrevMult = -1.5f, isPen = false, color = InkPalette[1]),
                GearCircle(id = 3, mode = GearMode.PREVIOUS, radiusPrevMult = 0.66f, speedPrevMult = -2.0f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "rose_rhodonea",
            title = "Rhodonea Rose Curve",
            subtitle = "8-Petal Polar Geometry",
            category = "Curves",
            description = "Classic mathematical rose curve (r = a · cos(kθ)) synthesized by coupled rotating arms.",
            formulaSummary = "R1: 900px (50°/s) → R2: 900px (-50°/s) → R3: 300px (250°/s)",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 900f, radiusGlobal = 900f, speedDeg = 50f, isPen = false, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.GLOBAL, radiusGlobal = 900f, speedGlobal = -50f, isPen = false, color = InkPalette[4]),
                GearCircle(id = 3, mode = GearMode.GLOBAL, radiusGlobal = 300f, speedGlobal = 250f, isPen = true, color = InkPalette[4])
            )
        ),
        CuratedPreset(
            id = "double_pendulum",
            title = "Coupled Chaos Lace",
            subtitle = "4-Tiered Fine Mesh",
            category = "Harmonics",
            description = "Four nested gears with irrational speed ratios generating non-repeating dense lace textures.",
            formulaSummary = "R1: 800px (50°/s) → R2: 500px (-135°/s) → R3: 320px (290°/s) → R4: 180px (-590°/s)",
            speedMult = 1.0f,
            weight = 6.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 800f, radiusGlobal = 800f, speedDeg = 50f, isPen = false, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.GLOBAL, radiusGlobal = 500f, speedGlobal = -135f, isPen = false, color = InkPalette[1]),
                GearCircle(id = 3, mode = GearMode.GLOBAL, radiusGlobal = 320f, speedGlobal = 290f, isPen = true, color = InkPalette[1]),
                GearCircle(id = 4, mode = GearMode.GLOBAL, radiusGlobal = 180f, speedGlobal = -590f, isPen = true, color = InkPalette[0])
            )
        ),
        CuratedPreset(
            id = "cardioid_dual",
            title = "Dual Pen Cardioid",
            subtitle = "Synchronized Twin Orbits",
            category = "Curves",
            description = "Two active pens drawing intertwined cardioid orbits simultaneously in distinct ink colors.",
            formulaSummary = "R1: 1000px (50°/s) [Pen 1] → R2: 500px (100°/s) [Pen 2]",
            speedMult = 1.0f,
            weight = 7.0f,
            circles = listOf(
                GearCircle(id = 1, radius = 1000f, radiusGlobal = 1000f, speedDeg = 50f, isPen = true, color = InkPalette[2]),
                GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 0.5f, speedPrevMult = 2.0f, isPen = true, color = InkPalette[0])
            )
        )
    )
}
