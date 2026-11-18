package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.GearCircle
import com.example.data.model.GearMode
import com.example.ui.theme.BoltGray
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.BrassGlow
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.DangerRed
import com.example.ui.theme.MutedGray
import com.example.ui.theme.PanelBg
import com.example.ui.theme.PanelBgElevated
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import com.example.ui.theme.TealAccent

@Composable
fun LayersSwitchboardOverlay(
    visible: Boolean,
    circles: List<GearCircle>,
    hiddenLayerIds: Set<Long>,
    onDismiss: () -> Unit,
    onToggleLayerVisibility: (Long) -> Unit,
    onSetLayerVisibility: (Long, Boolean) -> Unit,
    onShowAllLayers: () -> Unit,
    onHideAllLayers: () -> Unit,
    onClearLayerStrokes: (Long) -> Unit,
    onToggleGearPen: (Int, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(180)),
        exit = fadeOut(tween(150)),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onDismiss
                )
        ) {
            Card(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .statusBarsPadding()
                    .padding(top = 106.dp, end = 16.dp)
                    .width(340.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = { /* Consume click to avoid dismiss when tapping card */ }
                    )
                    .shadow(16.dp, RoundedCornerShape(16.dp), spotColor = BrassGold)
                    .testTag("layers_switchboard_card"),
                colors = CardDefaults.cardColors(containerColor = PanelBgElevated),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, BrassGold.copy(alpha = 0.6f))
            ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(BrassGlow)
                                .border(1.dp, BrassGold, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = "Layers Icon",
                                tint = BrassGold,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "PEN LAYERS",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.4.sp,
                                    color = PaperWhite
                                )
                            )
                            val penCount = circles.count { it.isPen }
                            val visiblePenCount = circles.count { it.isPen && it.id !in hiddenLayerIds }
                            Text(
                                text = "$visiblePenCount of $penCount lines active",
                                style = MaterialTheme.typography.labelSmall,
                                color = BrassGold.copy(alpha = 0.85f)
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(PanelBg)
                            .border(1.dp, PanelEdge, CircleShape)
                            .testTag("close_layers_switchboard")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close Layers Dashboard",
                            tint = MutedGray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Quick Batch Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onShowAllLayers,
                        modifier = Modifier
                            .weight(1f)
                            .height(34.dp)
                            .testTag("show_all_layers_button"),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = BrassGold),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BrassGold.copy(alpha = 0.4f)),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Visibility,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = BrassGold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Show All",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    OutlinedButton(
                        onClick = onHideAllLayers,
                        modifier = Modifier
                            .weight(1f)
                            .height(34.dp)
                            .testTag("hide_all_layers_button"),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MutedGray),
                        border = androidx.compose.foundation.BorderStroke(1.dp, PanelEdge),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.VisibilityOff,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = MutedGray
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Hide All",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Switchboard List of Layers
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 300.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    itemsIndexed(circles, key = { _, c -> c.id }) { index, gear ->
                        val isLineVisible = gear.id !in hiddenLayerIds

                        LayerSwitchItem(
                            gearIndex = index + 1,
                            gear = gear,
                            isLineVisible = isLineVisible,
                            onToggleVisibility = { onToggleLayerVisibility(gear.id) },
                            onClearStrokes = { onClearLayerStrokes(gear.id) },
                            onTogglePenMode = { enablePen -> onToggleGearPen(index, enablePen) }
                        )
                    }
                }
            }
        }
    }
}
}

@Composable
private fun LayerSwitchItem(
    gearIndex: Int,
    gear: GearCircle,
    isLineVisible: Boolean,
    onToggleVisibility: () -> Unit,
    onClearStrokes: () -> Unit,
    onTogglePenMode: (Boolean) -> Unit
) {
    val containerBg = if (gear.isPen) {
        if (isLineVisible) PanelBg else PanelBg.copy(alpha = 0.5f)
    } else {
        CanvasBg.copy(alpha = 0.5f)
    }

    val borderColor = if (gear.isPen && isLineVisible) {
        gear.color.copy(alpha = 0.5f)
    } else {
        PanelEdge
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(containerBg)
            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Color dot, Gear ID & Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Ink color swatch / indicator
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(if (gear.isPen) gear.color else BoltGray.copy(alpha = 0.3f))
                        .border(1.5.dp, if (gear.isPen) PaperWhite.copy(alpha = 0.8f) else PanelEdge, CircleShape)
                )

                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = if (gear.id == 1L) "Gear #$gearIndex (Engine)" else "Gear #$gearIndex",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (gear.isPen) PaperWhite else MutedGray
                        )
                        if (gear.isPen) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (isLineVisible) TealAccent.copy(alpha = 0.15f) else DangerRed.copy(alpha = 0.15f))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = if (isLineVisible) "LINE ON" else "LINE OFF",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = if (isLineVisible) TealAccent else DangerRed
                                )
                            }
                        } else {
                            Text(
                                text = "Guide Only",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = MutedGray
                            )
                        }
                    }

                    // Radius & Speed subtitle
                    val speedText = when (gear.mode) {
                        GearMode.GLOBAL -> "${gear.speedGlobal.toInt()}°/s"
                        GearMode.ENGINE -> "${gear.speedEngineMult}× Eng"
                        GearMode.PREVIOUS -> "${gear.speedPrevMult}× Prev"
                    }
                    Text(
                        text = "R: ${gear.radius.toInt()}px • Speed: $speedText",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                        color = MutedGray.copy(alpha = 0.75f)
                    )
                }
            }

            // Right: Switchboard Controls
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (gear.isPen) {
                    // Clear individual layer strokes
                    IconButton(
                        onClick = onClearStrokes,
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteOutline,
                            contentDescription = "Clear Pen #$gearIndex Strokes",
                            tint = MutedGray,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    // Line Visibility Switch
                    Switch(
                        checked = isLineVisible,
                        onCheckedChange = { onToggleVisibility() },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = BrassGold,
                            checkedTrackColor = BrassDim,
                            uncheckedThumbColor = MutedGray,
                            uncheckedTrackColor = PanelBgElevated,
                            uncheckedBorderColor = PanelEdge
                        ),
                        modifier = Modifier.testTag("layer_switch_gear_${gear.id}")
                    )
                } else {
                    // Convert guide to pen
                    FilledTonalButton(
                        onClick = { onTogglePenMode(true) },
                        modifier = Modifier
                            .height(28.dp)
                            .testTag("enable_pen_gear_${gear.id}"),
                        shape = RoundedCornerShape(6.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = BrassDim.copy(alpha = 0.4f),
                            contentColor = BrassGold
                        ),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "+ Add Pen",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }
            }
        }
    }
}


