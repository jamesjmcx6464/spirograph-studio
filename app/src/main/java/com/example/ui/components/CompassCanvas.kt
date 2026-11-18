package com.example.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.example.data.model.InkStroke
import com.example.data.model.ResolvedLink
import com.example.ui.theme.BoltDark
import com.example.ui.theme.BoltGray
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.PaperWhite
import com.example.ui.viewmodel.CompassInkUiState
import kotlin.math.hypot

@Composable
fun CompassCanvas(
    uiState: CompassInkUiState,
    chain: List<ResolvedLink>,
    strokes: List<InkStroke>,
    onTick: (Float) -> Unit,
    onPan: (Float, Float) -> Unit,
    onZoom: (Float, Float, Float, Float, Float) -> Unit,
    onEndPenTapped: () -> Unit,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    val currentOnPan by rememberUpdatedState(onPan)
    val currentOnZoom by rememberUpdatedState(onZoom)
    val currentOnEndPenTapped by rememberUpdatedState(onEndPenTapped)
    val currentChain by rememberUpdatedState(chain)
    val currentUiState by rememberUpdatedState(uiState)

    val infiniteTransition = rememberInfiniteTransition(label = "PenPulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    // Simulation loop driven by frame clock
    var lastFrameNanos by remember { mutableLongStateOf(0L) }
    LaunchedEffect(uiState.isPlaying) {
        if (uiState.isPlaying) {
            lastFrameNanos = 0L
            while (true) {
                withFrameNanos { frameNanos ->
                    if (lastFrameNanos > 0L) {
                        val dt = ((frameNanos - lastFrameNanos) / 1_000_000_000f).coerceIn(0.001f, 0.05f)
                        onTick(dt)
                    }
                    lastFrameNanos = frameNanos
                }
            }
        }
    }

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures { tapOffset ->
                    val chainSnap = currentChain
                    if (chainSnap.isNotEmpty()) {
                        val end = chainSnap.last()
                        val state = currentUiState
                        val screenCenterX = size.width / 2f + state.panX
                        val screenCenterY = size.height / 2f + state.panY
                        val screenPenX = screenCenterX + end.px * state.zoom
                        val screenPenY = screenCenterY + end.py * state.zoom

                        val dist = hypot(tapOffset.x - screenPenX, tapOffset.y - screenPenY)
                        val tapRadiusPx = 36.dp.toPx()
                        if (dist <= tapRadiusPx) {
                            currentOnEndPenTapped()
                        }
                    }
                }
            }
            .pointerInput(Unit) {
                detectTransformGestures(panZoomLock = false) { centroid, pan, zoom, _ ->
                    if (zoom != 1.0f) {
                        currentOnZoom(
                            zoom,
                            centroid.x,
                            centroid.y,
                            size.width.toFloat(),
                            size.height.toFloat()
                        )
                    }
                    if (pan != Offset.Zero) {
                        currentOnPan(pan.x, pan.y)
                    }
                }
            }
    ) {
        val cx = size.width / 2f + uiState.panX
        val cy = size.height / 2f + uiState.panY
        val zoom = uiState.zoom

        withTransform({
            translate(left = cx, top = cy)
            scale(scaleX = zoom, scaleY = zoom, pivot = Offset.Zero)
        }) {
            // 1. Draw Ink Strokes using pre-compiled cached paths (Zero lag, zero allocations)
            for (stroke in strokes) {
                if (stroke.id in uiState.hiddenLayerIds) continue
                drawPath(
                    path = stroke.composePath,
                    color = stroke.color,
                    style = Stroke(
                        width = stroke.weight,
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round
                    )
                )
            }

            // 2. Draw Guides (Connecting Rods & Trajectory Circles)
            if (uiState.showGuides) {
                val guideWidth = 1.2f / zoom.coerceAtLeast(0.001f)
                val rodWidth = 1.5f / zoom.coerceAtLeast(0.001f)
                val dotRadius = 3f / zoom.coerceAtLeast(0.001f)

                for (link in chain) {
                    // Circle orbit guide
                    drawCircle(
                        color = BrassDim.copy(alpha = 0.35f),
                        radius = link.radius,
                        center = Offset(link.cx, link.cy),
                        style = Stroke(
                            width = guideWidth,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f / zoom, 6f / zoom), 0f)
                        )
                    )

                    // Link arm / connecting rod
                    drawLine(
                        color = BrassGold.copy(alpha = 0.45f),
                        start = Offset(link.cx, link.cy),
                        end = Offset(link.px, link.py),
                        strokeWidth = rodWidth,
                        cap = StrokeCap.Round
                    )

                    // Center pivot joint
                    drawCircle(
                        color = BrassGold.copy(alpha = 0.6f),
                        radius = dotRadius,
                        center = Offset(link.cx, link.cy)
                    )
                }
            }

            // 3. Draw Points / Pen Heads / Bolts
            if (uiState.showPoints) {
                for (link in chain) {
                    val ptCenter = Offset(link.px, link.py)
                    if (link.isPen) {
                        // Glowing Pen Nib
                        val glowRadius = 12f / zoom.coerceAtLeast(0.001f)
                        val coreRadius = 5.5f / zoom.coerceAtLeast(0.001f)

                        // Outer glowing aura
                        drawCircle(
                            color = link.color.copy(alpha = 0.35f),
                            radius = glowRadius,
                            center = ptCenter
                        )
                        // Inner solid nib
                        drawCircle(
                            color = link.color,
                            radius = coreRadius,
                            center = ptCenter
                        )
                        // Bright center highlight
                        drawCircle(
                            color = PaperWhite,
                            radius = coreRadius * 0.4f,
                            center = ptCenter
                        )
                    } else {
                        // Metallic Bolt Pivot
                        val boltRadius = 5.5f / zoom.coerceAtLeast(0.001f)
                        drawCircle(
                            color = BoltGray,
                            radius = boltRadius,
                            center = ptCenter
                        )
                        drawCircle(
                            color = BoltDark,
                            radius = boltRadius,
                            center = ptCenter,
                            style = Stroke(width = 1.2f / zoom.coerceAtLeast(0.001f))
                        )
                        drawCircle(
                            color = BoltDark,
                            radius = boltRadius * 0.35f,
                            center = ptCenter
                        )
                    }
                }

                // 4. Trailing End-Pen Pulse Beacon (Tap to add gear indicator)
                if (chain.isNotEmpty()) {
                    val end = chain.last()
                    val pulseRadius = (13f + pulseAlpha * 7f) / zoom.coerceAtLeast(0.001f)
                    drawCircle(
                        color = PaperWhite.copy(alpha = pulseAlpha * 0.4f),
                        radius = pulseRadius,
                        center = Offset(end.px, end.py),
                        style = Stroke(width = 1.2f / zoom.coerceAtLeast(0.001f))
                    )
                }
            }
        }
    }
}
