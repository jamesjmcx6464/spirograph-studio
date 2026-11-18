package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Velocity
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Refresh
import kotlinx.coroutines.launch
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.GearCircle
import com.example.data.model.GearMode
import com.example.data.model.InkPalette
import com.example.data.model.ResolvedLink
import com.example.ui.theme.BoltDark
import com.example.ui.theme.BoltGray
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.BrassGlow
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.DangerRed
import com.example.ui.theme.InkAmber
import com.example.ui.theme.MutedGray
import com.example.ui.theme.PanelBg
import com.example.ui.theme.PanelBgElevated
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import com.example.ui.theme.TealAccent
import java.util.Locale
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun GearTrainSheet(
    sheetState: SheetState,
    circles: List<GearCircle>,
    resolvedChain: List<ResolvedLink>,
    listState: LazyListState = rememberLazyListState(),
    onDismiss: () -> Unit,
    onAddCircle: () -> Unit,
    onLayerCircle: () -> Unit,
    onRemoveCircle: (Long) -> Unit,
    onSetMode: (Int, GearMode) -> Unit,
    onSetPen: (Int, Boolean) -> Unit,
    onSetColor: (Int, Color) -> Unit,
    onSetRadius: (Int, Float, Float, Int) -> Unit,
    onSetSpeed: (Int, Float, Float, Int) -> Unit,
    onResetDrawing: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()

    // Automatically scroll to the newly added gear only when a circle is added or layered
    var previousCircleCount by remember { mutableIntStateOf(circles.size) }
    LaunchedEffect(circles.size) {
        if (circles.size > previousCircleCount && circles.isNotEmpty()) {
            listState.animateScrollToItem(circles.lastIndex)
        }
        previousCircleCount = circles.size
    }

    // Completely disable swipe-down-to-close on the sheet:
    // Consume any downward scroll and fling so ModalBottomSheet never drags to dismiss.
    // Dismissal is only triggered by pressing the X button or tapping outside on the scrim.
    val disableSwipeDownNestedScroll = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset = Offset.Zero

            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                // If user drags downwards, absorb all leftover delta so sheet never drags down
                if (available.y > 0f) {
                    return Offset(0f, available.y)
                }
                return Offset.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                // Absorb any downward fling velocity
                if (available.y > 0f) {
                    return Velocity(0f, available.y)
                }
                return Velocity.Zero
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = PanelBg,
        contentColor = PaperWhite,
        scrimColor = Color.Black.copy(alpha = 0.55f),
        dragHandle = null
    ) {
        HideNavigationBarsEffect()

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(top = 8.dp, bottom = 28.dp)
                .nestedScroll(disableSwipeDownNestedScroll)
        ) {
            // Header with Title, Quick Jump [TOP] / [BOTTOM] Buttons, and Close [X] Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .pointerInput(Unit) {
                        // Consume vertical drags on header so header drags do not close the sheet
                        detectVerticalDragGestures { _, _ -> }
                    },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "GEAR TRAIN",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = BrassGold
                        )
                    )
                    Surface(
                        color = BrassGlow,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "${circles.size}",
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = BrassGold
                        )
                    }
                }

                // Quick Jump Buttons: [▲ TOP] [▼ BOTTOM]
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(CanvasBg)
                        .border(1.dp, PanelEdge, RoundedCornerShape(8.dp))
                        .padding(2.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .clickable {
                                coroutineScope.launch {
                                    listState.animateScrollToItem(0)
                                }
                            }
                            .padding(horizontal = 8.dp, vertical = 5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowUp,
                                contentDescription = "Scroll to top",
                                tint = TealAccent,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "TOP",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    color = PaperWhite
                                )
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .clickable {
                                coroutineScope.launch {
                                    if (circles.isNotEmpty()) {
                                        listState.animateScrollToItem(circles.lastIndex)
                                    }
                                }
                            }
                            .padding(horizontal = 8.dp, vertical = 5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = "Scroll to bottom",
                                tint = BrassGold,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "BOTTOM",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    color = PaperWhite
                                )
                            )
                        }
                    }
                }

                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close sheet",
                        tint = MutedGray
                    )
                }
            }

            Text(
                text = "Configure radii, rotation speeds, modes, and ink pens for each harmonic link.",
                style = MaterialTheme.typography.bodySmall,
                color = MutedGray,
                modifier = Modifier.padding(top = 4.dp, bottom = 10.dp)
            )

            // Top Action: Reset Drawing
            OutlinedButton(
                onClick = onResetDrawing,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("reset_drawing_button"),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = BrassGold
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = androidx.compose.ui.graphics.SolidColor(BrassDim)
                )
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("RESET DRAWING & ANGLES", style = MaterialTheme.typography.labelMedium)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Circles List
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f, fill = false)
                    .nestedScroll(disableSwipeDownNestedScroll),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(circles.size, key = { idx -> circles[idx].id }) { index ->
                    val circle = circles[index]
                    val resolved = resolvedChain.getOrNull(index)
                    GearCard(
                        index = index,
                        circle = circle,
                        resolvedRadius = resolved?.radius ?: circle.radius,
                        resolvedSpeed = resolved?.speedDeg ?: circle.speedDeg,
                        canRemove = circles.size > 1 && index == circles.lastIndex,
                        onRemove = { onRemoveCircle(circle.id) },
                        onModeChange = { mode -> onSetMode(index, mode) },
                        onPenChange = { isPen -> onSetPen(index, isPen) },
                        onColorChange = { color -> onSetColor(index, color) },
                        onRadiusChange = { prod, base, step -> onSetRadius(index, prod, base, step) },
                        onSpeedChange = { prod, base, step -> onSetSpeed(index, prod, base, step) }
                    )
                }

                item {
                    // Two side-by-side action buttons: ADD (r=1, s=1) and LAYER (clones r, s from last gear)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp, bottom = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Add Button: r=1, s=1
                        Button(
                            onClick = onAddCircle,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .testTag("add_circle_button"),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = PanelBgElevated,
                                contentColor = BrassGold
                            ),
                            border = BorderStroke(1.dp, BrassDim.copy(alpha = 0.6f))
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "ADD (r=1, s=1)",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.5.sp
                                )
                            )
                        }

                        // Layer Button: clones r, s equal to last gear
                        Button(
                            onClick = onLayerCircle,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .testTag("layer_circle_button"),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = PanelBgElevated,
                                contentColor = TealAccent
                            ),
                            border = BorderStroke(1.dp, TealAccent.copy(alpha = 0.6f))
                        ) {
                            Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "LAYER (r, s)",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.5.sp
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun GearCard(
    index: Int,
    circle: GearCircle,
    resolvedRadius: Float,
    resolvedSpeed: Float,
    canRemove: Boolean,
    onRemove: () -> Unit,
    onModeChange: (GearMode) -> Unit,
    onPenChange: (Boolean) -> Unit,
    onColorChange: (Color) -> Unit,
    onRadiusChange: (Float, Float, Int) -> Unit,
    onSpeedChange: (Float, Float, Int) -> Unit
) {
    val isEngine = index == 0
    val cardBackground = if (isEngine) Color(0xFF241C14) else PanelBgElevated
    val cardBorderColor = when {
        isEngine -> BrassGold.copy(alpha = 0.85f)
        circle.isPen -> BrassDim
        else -> PanelEdge
    }
    val cardBorderWidth = if (isEngine) 1.5.dp else 1.dp

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = cardBorderWidth,
                color = cardBorderColor,
                shape = RoundedCornerShape(12.dp)
            ),
        shape = RoundedCornerShape(12.dp),
        color = cardBackground
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Card Head: Title, Bolt/Pen toggle, Color Palette (if Pen), and Delete
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Title / Engine Badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (circle.isPen) circle.color else if (isEngine) BrassGold else BoltGray)
                    )
                    if (isEngine) {
                        Surface(
                            color = BrassGlow,
                            shape = RoundedCornerShape(6.dp),
                            border = BorderStroke(1.dp, BrassGold.copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = "CIRCLE 1 · ENGINE",
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = BrassGold,
                                    fontSize = 13.sp,
                                    letterSpacing = 0.5.sp
                                )
                            )
                        }
                    } else {
                        Text(
                            text = "CIRCLE ${index + 1}",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = PaperWhite,
                                fontSize = 14.sp
                            )
                        )
                    }
                }

                // Middle & Right: Compact Bolt/Pen switch + Color Swatches (if Pen) + Remove Button
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Bolt vs Pen mini switch
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(CanvasBg)
                            .border(1.dp, PanelEdge, RoundedCornerShape(6.dp))
                            .padding(2.dp),
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (!circle.isPen) BoltGray.copy(alpha = 0.3f) else Color.Transparent)
                                .clickable { onPenChange(false) }
                                .padding(horizontal = 6.dp, vertical = 3.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "BOLT",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = if (!circle.isPen) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 9.5.sp,
                                    color = if (!circle.isPen) PaperWhite else MutedGray
                                )
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (circle.isPen) InkAmber.copy(alpha = 0.3f) else Color.Transparent)
                                .clickable { onPenChange(true) }
                                .padding(horizontal = 6.dp, vertical = 3.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "PEN",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = if (circle.isPen) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 9.5.sp,
                                    color = if (circle.isPen) InkAmber else MutedGray
                                )
                            )
                        }
                    }

                    // Palette visible if Pen
                    if (circle.isPen) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            InkPalette.forEach { color ->
                                val isSelected = circle.color == color
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(CircleShape)
                                        .background(color)
                                        .border(
                                            width = if (isSelected) 2.dp else 0.5.dp,
                                            color = if (isSelected) PaperWhite else Color.White.copy(alpha = 0.3f),
                                            shape = CircleShape
                                        )
                                        .clickable { onColorChange(color) }
                                )
                            }
                        }
                    }

                    if (canRemove) {
                        IconButton(
                            onClick = onRemove,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Remove circle",
                                tint = DangerRed,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }

            // Mode selector (for child circles) [ABSOLUTE] [ENGINE] [PREVIOUS]
            if (index > 0) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(CanvasBg)
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    TogglePill(
                        text = "ABSOLUTE",
                        isSelected = circle.mode == GearMode.GLOBAL,
                        onClick = { onModeChange(GearMode.GLOBAL) },
                        selectedColor = BrassGold,
                        modifier = Modifier.weight(1f)
                    )
                    TogglePill(
                        text = "ENGINE",
                        isSelected = circle.mode == GearMode.ENGINE,
                        onClick = { onModeChange(GearMode.ENGINE) },
                        selectedColor = BrassGold,
                        modifier = Modifier.weight(1f)
                    )
                    TogglePill(
                        text = "PREVIOUS",
                        isSelected = circle.mode == GearMode.PREVIOUS,
                        onClick = { onModeChange(GearMode.PREVIOUS) },
                        selectedColor = BrassGold,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Radius and Speed Inputs
            val isRelative = index > 0 && circle.mode != GearMode.GLOBAL
            val radiusVal = when {
                index == 0 -> circle.radius
                circle.mode == GearMode.GLOBAL -> circle.radiusGlobal
                circle.mode == GearMode.ENGINE -> circle.radiusEngineMult
                else -> circle.radiusPrevMult
            }
            val radiusUnit = if (isRelative) "×" else "px"

            val speedVal = when {
                index == 0 -> circle.speedDeg
                circle.mode == GearMode.GLOBAL -> circle.speedGlobal
                circle.mode == GearMode.ENGINE -> circle.speedEngineMult
                else -> circle.speedPrevMult
            }
            val speedUnit = if (isRelative) "×" else "°/s"

            // Radius Row
            ParamControlRow(
                label = "RADIUS",
                unit = radiusUnit,
                storedProduct = radiusVal,
                storedBase = circle.radiusBase,
                storedStepIndex = circle.radiusStepIndex,
                allowNegative = false,
                onValueChange = onRadiusChange
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Speed Row
            ParamControlRow(
                label = "SPEED",
                unit = speedUnit,
                storedProduct = speedVal,
                storedBase = circle.speedBase,
                storedStepIndex = circle.speedStepIndex,
                allowNegative = true,
                onValueChange = onSpeedChange
            )
        }
    }
}

@Composable
private fun TogglePill(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    selectedColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) selectedColor.copy(alpha = 0.2f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) selectedColor else MutedGray
            )
        )
    }
}

// Step multipliers: 1/12 .. 1/2, 1 .. 12
private val STEP_MULTIPLIERS = listOf(
    1f / 12f,
    1f / 11f,
    1f / 10f,
    1f / 9f,
    1f / 8f,
    1f / 7f,
    1f / 6f,
    1f / 5f,
    1f / 4f,
    1f / 3f,
    1f / 2f,
    1f,
    2f, 3f, 4f, 5f, 6f, 7f, 8f, 9f, 10f, 11f, 12f
)

private val STEP_DISPLAY_LABELS = listOf(
    "1/12", "1/11", "1/10", "1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
)

private const val DEFAULT_STEP_INDEX = 11 // index of "1"

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ParamControlRow(
    label: String,
    unit: String,
    storedProduct: Float,
    storedBase: Float?,
    storedStepIndex: Int,
    allowNegative: Boolean,
    onValueChange: (product: Float, base: Float, stepIndex: Int) -> Unit
) {
    val initialBase = storedBase ?: (storedProduct / STEP_MULTIPLIERS.getOrElse(storedStepIndex) { 1f })
    var stepIndex by remember(storedStepIndex) { mutableStateOf(storedStepIndex) }
    var baseValue by remember(initialBase) { mutableStateOf(initialBase) }

    fun applyUpdate(newBase: Float, newIndex: Int) {
        val clampedIndex = newIndex.coerceIn(0, STEP_MULTIPLIERS.lastIndex)
        stepIndex = clampedIndex
        baseValue = newBase
        val mult = STEP_MULTIPLIERS[clampedIndex]
        val finalVal = newBase * mult
        onValueChange(finalVal, newBase, clampedIndex)
    }

    val currentLabel = STEP_DISPLAY_LABELS.getOrElse(stepIndex) { "1" }
    val productVal = baseValue * STEP_MULTIPLIERS.getOrElse(stepIndex) { 1f }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(CanvasBg.copy(alpha = 0.6f))
            .border(1.dp, PanelEdge, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        // 1. Label and Unit (clean header without small right side value text)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.1.sp
                    ),
                    color = BrassGold
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "($unit)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MutedGray
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 2. [Base Input] × [- N + Stepper] = [Product Result Box]
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Base Value Input Box
            NumericInputField(
                value = baseValue,
                onValueChange = { newBase ->
                    applyUpdate(newBase, stepIndex)
                },
                width = 74.dp,
                minVal = if (allowNegative) -10000f else 0.001f,
                maxVal = 10000f,
                allowNegative = allowNegative,
                maxDecimals = 4
            )

            // Multiplication symbol
            Text(
                text = "×",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = BrassGold,
                    fontSize = 16.sp
                )
            )

            // [- N +] Stepper Box
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(PanelBgElevated)
                    .border(1.dp, PanelEdge, RoundedCornerShape(8.dp))
                    .padding(horizontal = 2.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                // Decrement Button (-)
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(CanvasBg)
                        .border(1.dp, PanelEdge, RoundedCornerShape(6.dp))
                        .clickable(enabled = stepIndex > 0) {
                            applyUpdate(baseValue, stepIndex - 1)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "−",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (stepIndex > 0) PaperWhite else MutedGray,
                            fontSize = 16.sp
                        )
                    )
                }

                // Current Stepper Value Display
                Box(
                    modifier = Modifier
                        .widthIn(min = 36.dp)
                        .padding(horizontal = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = currentLabel,
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (stepIndex != DEFAULT_STEP_INDEX) BrassGold else PaperWhite,
                            fontSize = 13.sp
                        )
                    )
                }

                // Increment Button (+)
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(CanvasBg)
                        .border(1.dp, PanelEdge, RoundedCornerShape(6.dp))
                        .clickable(enabled = stepIndex < STEP_MULTIPLIERS.lastIndex) {
                            applyUpdate(baseValue, stepIndex + 1)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "+",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (stepIndex < STEP_MULTIPLIERS.lastIndex) PaperWhite else MutedGray,
                            fontSize = 16.sp
                        )
                    )
                }
            }

            // Equals symbol
            Text(
                text = "=",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = TealAccent,
                    fontSize = 16.sp
                )
            )

            // Product Box (the active computed value passed to the gear engine)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(CanvasBg)
                    .border(1.dp, TealAccent.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Text(
                    text = "${formatDisplayNumber(productVal, 3)} $unit",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TealAccent,
                        fontSize = 13.sp
                    ),
                    maxLines = 1
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 3. Prominent Constant & Quick Modifier Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Golden Ratio φ (1.618)
            BigConstantButton(
                label = "φ",
                subtext = "1.618",
                onClick = { applyUpdate(1.618034f, stepIndex) },
                modifier = Modifier.weight(1f)
            )

            // Inverse Golden Ratio 1/φ (0.618)
            BigConstantButton(
                label = "1/φ",
                subtext = "0.618",
                onClick = { applyUpdate(0.618034f, stepIndex) },
                modifier = Modifier.weight(1f)
            )

            // Pi π (3.142)
            BigConstantButton(
                label = "π",
                subtext = "3.142",
                onClick = { applyUpdate(3.141593f, stepIndex) },
                modifier = Modifier.weight(1f)
            )

            // Negate button (if allowNegative)
            if (allowNegative) {
                BigConstantButton(
                    label = "±",
                    subtext = "Invert",
                    onClick = { applyUpdate(-baseValue, stepIndex) },
                    modifier = Modifier.weight(0.85f)
                )
            }
        }
    }
}

@Composable
private fun BigConstantButton(
    label: String,
    subtext: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .border(1.dp, BrassGold.copy(alpha = 0.45f), RoundedCornerShape(8.dp)),
        color = PanelBgElevated
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = BrassGold,
                    fontSize = 15.sp
                )
            )
            Text(
                text = subtext,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontSize = 9.sp,
                    color = MutedGray
                )
            )
        }
    }
}
