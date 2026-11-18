package com.example.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmarks
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.components.CompassCanvas
import com.example.ui.components.ExportImageDialog
import com.example.ui.components.GearTrainSheet
import com.example.ui.components.HideNavigationBarsEffect
import com.example.ui.components.LayersSwitchboardOverlay
import com.example.ui.components.LearnSheet
import com.example.ui.components.LoadSheet
import com.example.ui.components.PresetsSheet
import com.example.ui.components.SavePresetDialog
import com.example.ui.components.SettingsSheet
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.BrassGlow
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.MutedGray
import com.example.ui.theme.PanelBg
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import com.example.ui.theme.TealAccent
import com.example.ui.viewmodel.ActiveSheet
import com.example.ui.viewmodel.CompassInkViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompassInkScreen(
    viewModel: CompassInkViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val strokes = viewModel.getStrokes()
    val chain = viewModel.computeChain()

    val gearListState = rememberLazyListState()
    val gearSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val loadSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val settingsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val presetsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val learnSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    HideNavigationBarsEffect()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasBg)
    ) {
        // 1. Fullscreen Simulation Canvas (Handles pan, pinch-zoom, and end-pen tap)
        CompassCanvas(
            uiState = uiState,
            chain = chain,
            strokes = strokes,
            onTick = { dt -> viewModel.onSimulationTick(dt) },
            onPan = { dx, dy -> viewModel.onPan(dx, dy) },
            onZoom = { scale, px, py, w, h -> viewModel.onZoom(scale, px, py, w, h) },
            onEndPenTapped = { viewModel.addCircle() },
            modifier = Modifier.fillMaxSize()
        )

        // 2. Top Header Bar with Play/Pause, Presets (Saves), Export, and Layers
        TopHeaderBar(
            isPlaying = uiState.isPlaying,
            isLayersOpen = uiState.showLayersDashboard,
            onTogglePlayPause = { viewModel.togglePlayPause() },
            onOpenPresets = { viewModel.setActiveSheet(ActiveSheet.PRESETS) },
            onOpenExport = { viewModel.setShowExportDialog(true) },
            onToggleLayers = { viewModel.toggleLayersDashboard() },
            onOpenLearn = { viewModel.setActiveSheet(ActiveSheet.LEARN) },
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .align(Alignment.TopCenter)
        )

        // 2.5 Layers Switchboard Overlay (Collapsable top-right floating dashboard with tap-outside dismiss)
        LayersSwitchboardOverlay(
            visible = uiState.showLayersDashboard,
            circles = uiState.circles,
            hiddenLayerIds = uiState.hiddenLayerIds,
            onDismiss = { viewModel.setShowLayersDashboard(false) },
            onToggleLayerVisibility = { gearId -> viewModel.toggleLayerVisibility(gearId) },
            onSetLayerVisibility = { gearId, isVis -> viewModel.setLayerVisibility(gearId, isVis) },
            onShowAllLayers = { viewModel.showAllLayers() },
            onHideAllLayers = { viewModel.hideAllLayers() },
            onClearLayerStrokes = { gearId -> viewModel.clearLayerStrokes(gearId) },
            onToggleGearPen = { idx, isPen -> viewModel.setCirclePen(idx, isPen) },
            modifier = Modifier.fillMaxSize()
        )

        // 3. Bottom Toolbar with single-line GEARS, LOAD, SETTINGS
        BottomToolbar(
            circleCount = uiState.circles.size,
            activeSheet = uiState.activeSheet,
            onOpenGears = { viewModel.setActiveSheet(ActiveSheet.GEARS) },
            onOpenLoad = { viewModel.setActiveSheet(ActiveSheet.LOAD) },
            onOpenSettings = { viewModel.setActiveSheet(ActiveSheet.SETTINGS) },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        )

        // 4. Modal Bottom Sheets
        if (uiState.activeSheet == ActiveSheet.GEARS) {
            GearTrainSheet(
                sheetState = gearSheetState,
                circles = uiState.circles,
                resolvedChain = chain,
                listState = gearListState,
                onDismiss = { viewModel.setActiveSheet(ActiveSheet.NONE) },
                onAddCircle = { viewModel.addCircle() },
                onLayerCircle = { viewModel.layerCircle() },
                onRemoveCircle = { id -> viewModel.removeCircle(id) },
                onSetMode = { idx, mode -> viewModel.setCircleMode(idx, mode) },
                onSetPen = { idx, pen -> viewModel.setCirclePen(idx, pen) },
                onSetColor = { idx, color -> viewModel.setCircleColor(idx, color) },
                onSetRadius = { idx, prod, base, step -> viewModel.setCircleRadius(idx, prod, base, step) },
                onSetSpeed = { idx, prod, base, step -> viewModel.setCircleSpeed(idx, prod, base, step) },
                onResetDrawing = { viewModel.resetDrawing() }
            )
        }

        if (uiState.activeSheet == ActiveSheet.LOAD) {
            LoadSheet(
                sheetState = loadSheetState,
                exportFormat = uiState.exportFormat,
                exportedCode = uiState.exportedCode,
                codeMessage = uiState.codeMessage,
                isSuccessMessage = uiState.isSuccessMessage,
                onDismiss = { viewModel.setActiveSheet(ActiveSheet.NONE) },
                onFormatChange = { fmt -> viewModel.setExportFormat(fmt) },
                onImportCode = { code -> viewModel.importSetupCode(code) },
                onClearCodeMessage = { viewModel.clearCodeMessage() },
                onOpenPresetsGallery = { viewModel.setActiveSheet(ActiveSheet.PRESETS) }
            )
        }

        if (uiState.activeSheet == ActiveSheet.SETTINGS) {
            SettingsSheet(
                sheetState = settingsSheetState,
                globalSpeed = uiState.globalSpeedMult,
                inkWeight = uiState.inkWeight,
                showGuides = uiState.showGuides,
                showPoints = uiState.showPoints,
                onDismiss = { viewModel.setActiveSheet(ActiveSheet.NONE) },
                onSpeedChange = { s -> viewModel.setGlobalSpeed(s) },
                onWeightChange = { w -> viewModel.setInkWeight(w) },
                onToggleGuides = { viewModel.toggleGuides() },
                onTogglePoints = { viewModel.togglePoints() },
                onClearDrawing = { viewModel.clearDrawing() },
                onZeroAngles = { viewModel.zeroAngles() }
            )
        }

        if (uiState.activeSheet == ActiveSheet.PRESETS) {
            PresetsSheet(
                sheetState = presetsSheetState,
                savedPresets = uiState.savedPresets,
                onDismiss = { viewModel.setActiveSheet(ActiveSheet.NONE) },
                onSelectCurated = { preset -> viewModel.loadCuratedPreset(preset) },
                onSelectSaved = { saved -> viewModel.loadSavedPreset(saved) },
                onDeleteSaved = { saved -> viewModel.deleteSavedPreset(saved) },
                onOpenSaveDialog = { viewModel.setShowSaveDialog(true) }
            )
        }

        if (uiState.activeSheet == ActiveSheet.LEARN) {
            LearnSheet(
                sheetState = learnSheetState,
                onDismiss = { viewModel.setActiveSheet(ActiveSheet.NONE) }
            )
        }

        // 5. Dialogs
        if (uiState.showSaveDialog) {
            SavePresetDialog(
                circleCount = uiState.circles.size,
                onDismiss = { viewModel.setShowSaveDialog(false) },
                onSave = { name, notes -> viewModel.saveCurrentDesign(name, notes) }
            )
        }

        if (uiState.showExportDialog) {
            val visibleStrokes = strokes.filter { it.id !in uiState.hiddenLayerIds }
            ExportImageDialog(
                strokes = visibleStrokes,
                title = uiState.currentPresetName,
                onDismiss = { viewModel.setShowExportDialog(false) }
            )
        }
    }
}

@Composable
private fun TopHeaderBar(
    isPlaying: Boolean,
    isLayersOpen: Boolean,
    onTogglePlayPause: () -> Unit,
    onOpenPresets: () -> Unit,
    onOpenExport: () -> Unit,
    onToggleLayers: () -> Unit,
    onOpenLearn: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Column(
            modifier = Modifier.padding(top = 4.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Column {
                Text(
                    text = "SPIROGRAPH",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.6.sp,
                        color = PaperWhite,
                        lineHeight = 20.sp
                    )
                )
                Text(
                    text = "STUDIO",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.6.sp,
                        color = BrassGold,
                        lineHeight = 20.sp
                    )
                )
            }

            // Learn Button right below the Spirograph Studio title
            Surface(
                onClick = onOpenLearn,
                shape = RoundedCornerShape(12.dp),
                color = BrassGold.copy(alpha = 0.14f),
                border = BorderStroke(1.dp, BrassGold.copy(alpha = 0.55f)),
                modifier = Modifier.testTag("learn_button")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = "Learn and Tutorials",
                        tint = BrassGold,
                        modifier = Modifier.size(13.dp)
                    )
                    Text(
                        text = "LEARN",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp,
                            color = PaperWhite,
                            fontSize = 11.sp
                        )
                    )
                }
            }
        }

        // 2x2 Button Grid
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.End
        ) {
            // Row 1: Layers and Photo (Export)
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Layers Switchboard Button
                IconButton(
                    onClick = onToggleLayers,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(if (isLayersOpen) BrassGold else PanelBg.copy(alpha = 0.85f))
                        .border(1.dp, if (isLayersOpen) PaperWhite else PanelEdge, CircleShape)
                        .testTag("header_layers_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Layers,
                        contentDescription = "Pen Layers Switchboard",
                        tint = if (isLayersOpen) CanvasBg else BrassGold,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // Export Image / Photo Button
                IconButton(
                    onClick = onOpenExport,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(PanelBg.copy(alpha = 0.85f))
                        .border(1.dp, PanelEdge, CircleShape)
                        .testTag("header_export_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Image,
                        contentDescription = "Export Artwork",
                        tint = TealAccent,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Row 2: Pause / Play and Bookmarks (Presets)
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Play / Pause Icon Button
                IconButton(
                    onClick = onTogglePlayPause,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(if (isPlaying) BrassDim else BrassGold)
                        .border(1.dp, BrassGold, CircleShape)
                        .testTag("play_pause_button")
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "Pause simulation" else "Play simulation",
                        tint = if (isPlaying) PaperWhite else CanvasBg,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Presets & Saves Storage (Bookmarks) Icon Button
                IconButton(
                    onClick = onOpenPresets,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(PanelBg.copy(alpha = 0.85f))
                        .border(1.dp, PanelEdge, CircleShape)
                        .testTag("header_presets_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Bookmarks,
                        contentDescription = "Presets & Storage Gallery",
                        tint = BrassGold,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BottomToolbar(
    circleCount: Int,
    activeSheet: ActiveSheet,
    onOpenGears: () -> Unit,
    onOpenLoad: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = PanelBg,
        border = androidx.compose.foundation.BorderStroke(1.dp, PanelEdge)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Gears Tab Button
            ToolbarButton(
                label = "GEARS",
                badge = "$circleCount",
                isActive = activeSheet == ActiveSheet.GEARS,
                onClick = onOpenGears,
                modifier = Modifier.weight(1f)
            )

            // Load Tab Button
            ToolbarButton(
                label = "LOAD",
                badge = null,
                isActive = activeSheet == ActiveSheet.LOAD,
                onClick = onOpenLoad,
                modifier = Modifier.weight(1f)
            )

            // Settings Tab Button
            ToolbarButton(
                label = "SETTINGS",
                badge = null,
                isActive = activeSheet == ActiveSheet.SETTINGS,
                onClick = onOpenSettings,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun ToolbarButton(
    label: String,
    badge: String?,
    isActive: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .height(44.dp)
            .testTag("toolbar_${label.lowercase()}"),
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (isActive) TealAccent.copy(alpha = 0.12f) else Color.Transparent,
            contentColor = if (isActive) TealAccent else PaperWhite
        ),
        border = ButtonDefaults.outlinedButtonBorder.copy(
            brush = androidx.compose.ui.graphics.SolidColor(
                if (isActive) TealAccent else PanelEdge
            )
        )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                    fontSize = 11.sp
                ),
                maxLines = 1
            )
            if (badge != null) {
                Spacer(modifier = Modifier.width(6.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(BrassGlow)
                        .padding(horizontal = 5.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = badge,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrassGold
                        )
                    )
                }
            }
        }
    }
}
