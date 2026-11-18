package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale
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
import com.example.ui.viewmodel.ExportFormat
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    sheetState: SheetState,
    globalSpeed: Float,
    inkWeight: Float,
    showGuides: Boolean,
    showPoints: Boolean,
    onDismiss: () -> Unit,
    onSpeedChange: (Float) -> Unit,
    onWeightChange: (Float) -> Unit,
    onToggleGuides: () -> Unit,
    onTogglePoints: () -> Unit,
    onClearDrawing: () -> Unit,
    onZeroAngles: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = PanelBg,
        contentColor = PaperWhite,
        scrimColor = Color.Black.copy(alpha = 0.55f),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .size(width = 36.dp, height = 4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(PanelEdge)
            )
        }
    ) {
        HideNavigationBarsEffect()

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SETTINGS & CONTROLS",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                        color = BrassGold
                    )
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close sheet",
                        tint = MutedGray
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Global Speed Section with Slider + Manual Numeric Input
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = PanelBgElevated,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, PanelEdge)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "GLOBAL SPEED MULTIPLIER",
                                style = MaterialTheme.typography.labelMedium,
                                color = MutedGray
                            )
                            Text(
                                text = "Drag or type exact rate (0.01× - 100×)",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = MutedGray.copy(alpha = 0.7f)
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            NumericInputField(
                                value = globalSpeed,
                                onValueChange = onSpeedChange,
                                width = 76.dp,
                                minVal = 0.01f,
                                maxVal = 100f,
                                allowNegative = false,
                                maxDecimals = 2,
                                tag = "global_speed_manual_input",
                                textStyle = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = TealAccent,
                                    textAlign = TextAlign.Center
                                )
                            )
                            Text(
                                text = "×",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = TealAccent
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Slider(
                        value = globalSpeed.coerceIn(0.01f, maxOf(10.0f, globalSpeed.coerceAtMost(100f))),
                        onValueChange = { newVal ->
                            onSpeedChange(newVal)
                        },
                        valueRange = 0.01f..maxOf(10.0f, globalSpeed.coerceAtMost(100f)),
                        colors = SliderDefaults.colors(
                            thumbColor = TealAccent,
                            activeTrackColor = TealAccent,
                            inactiveTrackColor = PanelEdge
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Ink Weight Section with Slider + Manual Numeric Input
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = PanelBgElevated,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, PanelEdge)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "INK STROKE WEIGHT",
                                style = MaterialTheme.typography.labelMedium,
                                color = MutedGray
                            )
                            Text(
                                text = "Drag or type exact thickness (0.01 - 200)",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = MutedGray.copy(alpha = 0.7f)
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            NumericInputField(
                                value = inkWeight,
                                onValueChange = onWeightChange,
                                width = 76.dp,
                                minVal = 0.01f,
                                maxVal = 200f,
                                allowNegative = false,
                                maxDecimals = 2,
                                tag = "ink_weight_manual_input",
                                textStyle = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = BrassGold,
                                    textAlign = TextAlign.Center
                                )
                            )
                            Text(
                                text = "px",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = BrassGold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Slider(
                        value = inkWeight.coerceIn(0.01f, maxOf(20.0f, inkWeight.coerceAtMost(200f))),
                        onValueChange = { newVal ->
                            onWeightChange(newVal)
                        },
                        valueRange = 0.01f..maxOf(20.0f, inkWeight.coerceAtMost(200f)),
                        colors = SliderDefaults.colors(
                            thumbColor = BrassGold,
                            activeTrackColor = BrassGold,
                            inactiveTrackColor = PanelEdge
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Visual Guides Toggles Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onToggleGuides,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("toggle_guides_button"),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (showGuides) TealAccent.copy(alpha = 0.12f) else Color.Transparent,
                        contentColor = if (showGuides) TealAccent else MutedGray
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (showGuides) TealAccent else PanelEdge
                        )
                    )
                ) {
                    Text(
                        text = if (showGuides) "GUIDES: ON" else "GUIDES: OFF",
                        style = MaterialTheme.typography.labelMedium
                    )
                }

                OutlinedButton(
                    onClick = onTogglePoints,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("toggle_points_button"),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (showPoints) TealAccent.copy(alpha = 0.12f) else Color.Transparent,
                        contentColor = if (showPoints) TealAccent else MutedGray
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (showPoints) TealAccent else PanelEdge
                        )
                    )
                ) {
                    Text(
                        text = if (showPoints) "POINTS: ON" else "POINTS: OFF",
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Clear Canvas & Zero Angles Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onClearDrawing,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("clear_drawing_button"),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = DangerRed
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(PanelEdge)
                    )
                ) {
                    Text("CLEAR INK", style = MaterialTheme.typography.labelMedium)
                }

                OutlinedButton(
                    onClick = onZeroAngles,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("zero_angles_button"),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = BrassGold
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(PanelEdge)
                    )
                ) {
                    Text("ZERO ANGLES", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}
