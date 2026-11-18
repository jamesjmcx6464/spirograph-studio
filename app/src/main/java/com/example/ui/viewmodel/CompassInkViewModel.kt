package com.example.ui.viewmodel

import android.app.Application
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.db.AppDatabase
import com.example.data.db.SavedPresetEntity
import com.example.data.model.CuratedPreset
import com.example.data.model.GearCircle
import com.example.data.model.GearMode
import com.example.data.model.InkPalette
import com.example.data.model.InkStroke
import com.example.data.model.PresetLibrary
import com.example.data.model.ResolvedLink
import com.example.data.model.StrokePoint
import com.example.data.model.parseHexColor
import com.example.data.model.toHexString
import com.example.data.repository.PresetRepository
import com.example.data.repository.WorkspaceStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

enum class ActiveSheet {
    NONE,
    GEARS,
    SETTINGS,
    PRESETS,
    LOAD,
    LEARN
}

enum class ExportFormat {
    LABELED,
    ARRAY,
    EQUATION
}

data class CompassInkUiState(
    val circles: List<GearCircle> = listOf(
        GearCircle(id = 1, radius = 20f, radiusGlobal = 20f, speedDeg = 50f, angle = -90f, initialAngle = -90f, isPen = false, color = InkPalette[0]),
        GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 4.9f, speedPrevMult = -0.2f, angle = -90f, initialAngle = -90f, isPen = false, color = InkPalette[0]),
        GearCircle(id = 3, mode = GearMode.PREVIOUS, radiusPrevMult = 0.7f, speedPrevMult = -1.5f, angle = -90f, initialAngle = -90f, isPen = false, color = InkPalette[0]),
        GearCircle(id = 4, mode = GearMode.PREVIOUS, radiusPrevMult = 0.3f, speedPrevMult = 7.0f, angle = -90f, initialAngle = -90f, isPen = true, color = InkPalette[0])
    ),
    val isPlaying: Boolean = true,
    val globalSpeedMult: Float = 1.0f,
    val inkWeight: Float = 2.0f,
    val showGuides: Boolean = true,
    val showPoints: Boolean = true,
    val panX: Float = 0f,
    val panY: Float = 0f,
    val zoom: Float = 1.6f,
    val activeSheet: ActiveSheet = ActiveSheet.NONE,
    val exportFormat: ExportFormat = ExportFormat.LABELED,
    val exportedCode: String = "",
    val codeMessage: String? = null,
    val isSuccessMessage: Boolean = true,
    val savedPresets: List<SavedPresetEntity> = emptyList(),
    val currentPresetName: String? = "Character Silhouette",
    val showSaveDialog: Boolean = false,
    val showExportDialog: Boolean = false,
    val strokePointCount: Int = 0,
    val hiddenLayerIds: Set<Long> = emptySet(),
    val showLayersDashboard: Boolean = false
)

class CompassInkViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: PresetRepository
    private val workspaceStorage = WorkspaceStorage(application)
    private val _uiState = MutableStateFlow(CompassInkUiState())
    val uiState: StateFlow<CompassInkUiState> = _uiState.asStateFlow()

    // High performance in-memory stroke buffers
    private val strokesList = mutableListOf<InkStroke>()
    private val currentActiveStrokes = mutableMapOf<Long, InkStroke>()
    private var nextGearId: Long = 100L
    private var saveJob: Job? = null
    private var lastSaveTimestamp = 0L

    init {
        val database = AppDatabase.getDatabase(application)
        repository = PresetRepository(database.presetDao())

        val initialMax = _uiState.value.circles.maxOfOrNull { it.id } ?: 0L
        nextGearId = maxOf(nextGearId, initialMax + 1L)

        // Load saved presets from Room
        viewModelScope.launch {
            repository.allSavedPresets.collect { savedList ->
                _uiState.update { it.copy(savedPresets = savedList) }
            }
        }

        // Restore active workspace & strokes if available
        viewModelScope.launch {
            val (savedState, savedStrokes) = workspaceStorage.loadWorkspace()
            if (savedState != null) {
                synchronized(strokesList) {
                    strokesList.clear()
                    strokesList.addAll(savedStrokes)
                    currentActiveStrokes.clear()
                }
                val maxId = savedState.circles.maxOfOrNull { it.id } ?: 0L
                nextGearId = maxOf(nextGearId, maxId + 1L)
                _uiState.update { current ->
                    savedState.copy(
                        savedPresets = current.savedPresets,
                        strokePointCount = savedStrokes.sumOf { it.points.size }
                    )
                }
            }
            updateExportedCode()
        }
    }

    fun scheduleWorkspaceSave(immediate: Boolean = false) {
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            if (!immediate) {
                delay(800)
            }
            val state = _uiState.value
            val strokes = getStrokes()
            workspaceStorage.saveWorkspace(state, strokes)
            lastSaveTimestamp = System.currentTimeMillis()
        }
    }

    private fun generateUniqueGearId(existing: List<GearCircle>): Long {
        val maxExisting = existing.maxOfOrNull { it.id } ?: 0L
        nextGearId = maxOf(nextGearId, maxExisting + 1L)
        return nextGearId++
    }

    fun getStrokes(): List<InkStroke> {
        return synchronized(strokesList) {
            strokesList.toList()
        }
    }

    fun computeChain(circles: List<GearCircle> = _uiState.value.circles): List<ResolvedLink> {
        val resolved = mutableListOf<ResolvedLink>()
        var cx = 0f
        var cy = 0f
        for (i in circles.indices) {
            val c = circles[i]
            val radius: Float
            val speedDeg: Float

            if (i == 0) {
                radius = c.radius
                speedDeg = c.speedDeg
            } else {
                when (c.mode) {
                    GearMode.GLOBAL -> {
                        radius = c.radiusGlobal
                        speedDeg = c.speedGlobal
                    }
                    GearMode.ENGINE -> {
                        radius = c.radiusEngineMult * (resolved.firstOrNull()?.radius ?: 140f)
                        speedDeg = c.speedEngineMult * (resolved.firstOrNull()?.speedDeg ?: 50f)
                    }
                    GearMode.PREVIOUS -> {
                        val prev = resolved.getOrNull(i - 1)
                        if (prev != null) {
                            radius = c.radiusPrevMult * prev.radius
                            speedDeg = c.speedPrevMult * prev.speedDeg
                        } else {
                            radius = c.radiusPrevMult * 140f
                            speedDeg = c.speedPrevMult * 50f
                        }
                    }
                }
            }

            val rad = Math.toRadians(c.angle.toDouble())
            val px = cx + (cos(rad) * radius).toFloat()
            val py = cy + (sin(rad) * radius).toFloat()

            resolved.add(
                ResolvedLink(
                    id = c.id,
                    radius = radius,
                    speedDeg = speedDeg,
                    cx = cx,
                    cy = cy,
                    px = px,
                    py = py,
                    isPen = c.isPen,
                    color = c.color
                )
            )
            cx = px
            cy = py
        }
        return resolved
    }

    // Called on each frame tick with delta time in seconds
    fun onSimulationTick(dt: Float) {
        val state = _uiState.value
        if (!state.isPlaying || dt <= 0f) return

        val currentCircles = state.circles.toMutableList()
        val speedMult = state.globalSpeedMult
        val weight = state.inkWeight

        val initialChain = computeChain(currentCircles)
        val maxSpeed = initialChain.maxOfOrNull { kotlin.math.abs(it.speedDeg) } ?: 20f
        val maxEffectiveSpeed = (maxSpeed * speedMult).coerceAtLeast(10f)

        // Sub-stepping captures fine angular increments (0.35 deg / step is silky smooth for spirographs)
        val targetStepAngle = 0.35f
        val calculatedSteps = ((maxEffectiveSpeed * dt) / targetStepAngle).toInt()
        val subSteps = calculatedSteps.coerceIn(2, 24)
        val subDt = dt / subSteps

        synchronized(strokesList) {
            for (step in 0 until subSteps) {
                val chain = computeChain(currentCircles)
                for (i in currentCircles.indices) {
                    val updatedAngle = (currentCircles[i].angle + chain[i].speedDeg * speedMult * subDt) % 360f
                    currentCircles[i] = currentCircles[i].copy(angle = updatedAngle)
                }

                val newChain = computeChain(currentCircles)
                for (link in newChain) {
                    if (!link.isPen) continue

                    val existingStroke = currentActiveStrokes[link.id]
                    if (existingStroke == null ||
                        existingStroke.color != link.color ||
                        existingStroke.weight != weight ||
                        existingStroke.points.size >= 25000
                    ) {
                        val newStroke = InkStroke(
                            id = link.id,
                            color = link.color,
                            weight = weight,
                            points = mutableListOf(StrokePoint(link.px, link.py))
                        )
                        newStroke.composePath.moveTo(link.px, link.py)
                        currentActiveStrokes[link.id] = newStroke
                        strokesList.add(newStroke)
                    } else {
                        val last = existingStroke.points.last()
                        val dx = link.px - last.x
                        val dy = link.py - last.y
                        val distSq = dx * dx + dy * dy
                        // Minimum distance filter: 1.5px (squared = 2.25)
                        if (distSq >= 2.25f) {
                            existingStroke.points.add(StrokePoint(link.px, link.py))
                            existingStroke.composePath.lineTo(link.px, link.py)
                        }
                    }
                }
            }
        }

        _uiState.update {
            it.copy(
                circles = currentCircles,
                strokePointCount = strokesList.sumOf { stroke -> stroke.points.size }
            )
        }

        if (System.currentTimeMillis() - lastSaveTimestamp > 4000L) {
            scheduleWorkspaceSave()
        }
    }

    private fun resetStrokeContinuity() {
        synchronized(strokesList) {
            currentActiveStrokes.clear()
        }
    }

    fun togglePlayPause() {
        val playing = !_uiState.value.isPlaying
        _uiState.update { it.copy(isPlaying = playing) }
        if (playing) resetStrokeContinuity()
        scheduleWorkspaceSave()
    }

    fun clearDrawing() {
        synchronized(strokesList) {
            strokesList.clear()
            resetStrokeContinuity()
        }
        _uiState.update { it.copy(strokePointCount = 0) }
        viewModelScope.launch {
            workspaceStorage.clearWorkspaceStrokes()
        }
        scheduleWorkspaceSave()
    }

    fun zeroAngles() {
        _uiState.update { state ->
            state.copy(
                circles = state.circles.map { it.copy(angle = it.initialAngle) }
            )
        }
        resetStrokeContinuity()
        scheduleWorkspaceSave()
    }

    fun resetDrawing() {
        zeroAngles()
        clearDrawing()
    }

    fun setGlobalSpeed(speed: Float) {
        val clamped = speed.coerceIn(0.01f, 100f)
        _uiState.update { it.copy(globalSpeedMult = clamped) }
        updateExportedCode()
    }

    fun setInkWeight(weight: Float) {
        val clamped = weight.coerceIn(0.01f, 200f)
        _uiState.update { it.copy(inkWeight = clamped) }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun toggleGuides() {
        _uiState.update { it.copy(showGuides = !it.showGuides) }
    }

    fun togglePoints() {
        _uiState.update { it.copy(showPoints = !it.showPoints) }
    }

    fun toggleLayersDashboard() {
        _uiState.update { it.copy(showLayersDashboard = !it.showLayersDashboard) }
    }

    fun setShowLayersDashboard(show: Boolean) {
        _uiState.update { it.copy(showLayersDashboard = show) }
    }

    fun toggleLayerVisibility(gearId: Long) {
        _uiState.update { state ->
            val hidden = state.hiddenLayerIds.toMutableSet()
            if (hidden.contains(gearId)) {
                hidden.remove(gearId)
            } else {
                hidden.add(gearId)
            }
            state.copy(hiddenLayerIds = hidden)
        }
    }

    fun setLayerVisibility(gearId: Long, isVisible: Boolean) {
        _uiState.update { state ->
            val hidden = state.hiddenLayerIds.toMutableSet()
            if (isVisible) {
                hidden.remove(gearId)
            } else {
                hidden.add(gearId)
            }
            state.copy(hiddenLayerIds = hidden)
        }
    }

    fun showAllLayers() {
        _uiState.update { it.copy(hiddenLayerIds = emptySet()) }
    }

    fun hideAllLayers() {
        _uiState.update { state ->
            state.copy(hiddenLayerIds = state.circles.map { it.id }.toSet())
        }
    }

    fun clearLayerStrokes(gearId: Long) {
        synchronized(strokesList) {
            strokesList.removeAll { it.id == gearId }
            currentActiveStrokes.remove(gearId)
        }
        _uiState.update { it.copy(strokePointCount = strokesList.sumOf { s -> s.points.size }) }
    }

    fun setActiveSheet(sheet: ActiveSheet) {
        _uiState.update {
            val target = if (it.activeSheet == sheet) ActiveSheet.NONE else sheet
            it.copy(activeSheet = target)
        }
        if (_uiState.value.activeSheet == ActiveSheet.SETTINGS) {
            updateExportedCode()
        }
    }

    fun setExportFormat(format: ExportFormat) {
        _uiState.update { it.copy(exportFormat = format) }
        updateExportedCode()
    }

    // Gear Manipulation
    fun addCircle() {
        val state = _uiState.value
        if (state.circles.isEmpty()) {
            val defaultCircle = GearCircle(
                id = 1L,
                mode = GearMode.GLOBAL,
                radius = 140f,
                speedDeg = 50f,
                angle = -90f,
                initialAngle = -90f,
                isPen = true,
                color = InkPalette[0]
            )
            _uiState.update { it.copy(circles = listOf(defaultCircle)) }
            resetStrokeContinuity()
            updateExportedCode()
            return
        }

        val chain = computeChain(state.circles)
        val parent = chain.lastOrNull() ?: return
        val engine = chain.firstOrNull() ?: parent

        val updated = state.circles.mapIndexed { idx, c ->
            if (idx == state.circles.lastIndex) c.copy(isPen = false) else c
        }.toMutableList()

        val newRadius = (parent.radius * 0.5f).coerceIn(8f, 500f)
        val newSpeed = (if (parent.speedDeg >= 0) -1f else 1f) * (Math.abs(parent.speedDeg) * 1.5f).coerceIn(15f, 360f)
        val newColor = InkPalette[updated.size % InkPalette.size]

        val safeEngineRadius = if (engine.radius != 0f) engine.radius else 1f
        val safeEngineSpeed = if (engine.speedDeg != 0f) engine.speedDeg else 1f

        val newCircleId = generateUniqueGearId(updated)

        val newCircle = GearCircle(
            id = newCircleId,
            mode = GearMode.PREVIOUS,
            radiusGlobal = Math.round(newRadius).toFloat(),
            radiusEngineMult = 1f,
            radiusPrevMult = 1f,
            radiusBase = 1f,
            radiusStepIndex = 11,
            speedGlobal = Math.round(newSpeed).toFloat(),
            speedEngineMult = 1f,
            speedPrevMult = 1f,
            speedBase = 1f,
            speedStepIndex = 11,
            angle = -90f,
            initialAngle = -90f,
            isPen = true,
            color = newColor
        )
        updated.add(newCircle)

        _uiState.update { it.copy(circles = updated) }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun layerCircle() {
        val state = _uiState.value
        if (state.circles.isEmpty()) {
            addCircle()
            return
        }

        val lastIndex = state.circles.lastIndex
        val lastCircle = state.circles[lastIndex]

        val updated = state.circles.mapIndexed { idx, c ->
            if (idx == lastIndex) c.copy(isPen = false) else c
        }.toMutableList()

        val lastRadius = when {
            lastIndex == 0 -> 1f
            lastCircle.mode == GearMode.GLOBAL -> lastCircle.radiusGlobal
            lastCircle.mode == GearMode.ENGINE -> lastCircle.radiusEngineMult
            else -> lastCircle.radiusPrevMult
        }
        val lastSpeed = when {
            lastIndex == 0 -> 1f
            lastCircle.mode == GearMode.GLOBAL -> lastCircle.speedGlobal
            lastCircle.mode == GearMode.ENGINE -> lastCircle.speedEngineMult
            else -> lastCircle.speedPrevMult
        }

        val newColor = InkPalette[updated.size % InkPalette.size]
        val newCircleId = generateUniqueGearId(updated)

        val targetMode = if (lastIndex == 0) GearMode.PREVIOUS else lastCircle.mode
        val newCircle = GearCircle(
            id = newCircleId,
            mode = targetMode,
            radiusGlobal = if (lastIndex == 0) lastCircle.radius else lastCircle.radiusGlobal,
            radiusEngineMult = lastRadius,
            radiusPrevMult = lastRadius,
            radiusBase = lastCircle.radiusBase ?: lastRadius,
            radiusStepIndex = lastCircle.radiusStepIndex,
            speedGlobal = if (lastIndex == 0) lastCircle.speedDeg else lastCircle.speedGlobal,
            speedEngineMult = lastSpeed,
            speedPrevMult = lastSpeed,
            speedBase = lastCircle.speedBase ?: lastSpeed,
            speedStepIndex = lastCircle.speedStepIndex,
            angle = -90f,
            initialAngle = -90f,
            isPen = true,
            color = newColor
        )
        updated.add(newCircle)

        _uiState.update { it.copy(circles = updated) }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun removeCircle(circleId: Long) {
        val state = _uiState.value
        if (state.circles.size <= 1) return
        val updated = state.circles.filterNot { it.id == circleId }
        synchronized(strokesList) {
            strokesList.removeAll { it.id == circleId }
            currentActiveStrokes.remove(circleId)
        }
        _uiState.update {
            it.copy(
                circles = updated,
                strokePointCount = strokesList.sumOf { s -> s.points.size }
            )
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun updateCircle(updatedCircle: GearCircle) {
        _uiState.update { state ->
            val list = state.circles.map { if (it.id == updatedCircle.id) updatedCircle else it }
            state.copy(circles = list)
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun setCircleMode(index: Int, mode: GearMode) {
        _uiState.update { state ->
            if (index !in state.circles.indices) return@update state
            val list = state.circles.toMutableList()
            val c = list[index]
            if (c.mode == mode) return@update state

            val activeRadius = when {
                index == 0 -> c.radius
                c.mode == GearMode.GLOBAL -> c.radiusGlobal
                c.mode == GearMode.ENGINE -> c.radiusEngineMult
                else -> c.radiusPrevMult
            }
            val activeSpeed = when {
                index == 0 -> c.speedDeg
                c.mode == GearMode.GLOBAL -> c.speedGlobal
                c.mode == GearMode.ENGINE -> c.speedEngineMult
                else -> c.speedPrevMult
            }

            // Keep radius and speed identical when switching between relative modes (ENGINE <-> PREVIOUS)
            val updated = c.copy(
                mode = mode,
                radiusEngineMult = if (mode == GearMode.ENGINE || c.mode == GearMode.PREVIOUS) activeRadius else c.radiusEngineMult,
                radiusPrevMult = if (mode == GearMode.PREVIOUS || c.mode == GearMode.ENGINE) activeRadius else c.radiusPrevMult,
                speedEngineMult = if (mode == GearMode.ENGINE || c.mode == GearMode.PREVIOUS) activeSpeed else c.speedEngineMult,
                speedPrevMult = if (mode == GearMode.PREVIOUS || c.mode == GearMode.ENGINE) activeSpeed else c.speedPrevMult,
                radiusBase = c.radiusBase ?: activeRadius,
                speedBase = c.speedBase ?: activeSpeed
            )
            list[index] = updated
            state.copy(circles = list)
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun setCirclePen(index: Int, isPen: Boolean) {
        _uiState.update { state ->
            if (index !in state.circles.indices) return@update state
            val list = state.circles.toMutableList()
            list[index] = list[index].copy(isPen = isPen)
            state.copy(circles = list)
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun setCircleColor(index: Int, color: Color) {
        _uiState.update { state ->
            if (index !in state.circles.indices) return@update state
            val list = state.circles.toMutableList()
            list[index] = list[index].copy(color = color)
            state.copy(circles = list)
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun setCircleRadius(index: Int, radiusProduct: Float, baseValue: Float? = null, stepIndex: Int = 11) {
        _uiState.update { state ->
            if (index !in state.circles.indices) return@update state
            val list = state.circles.toMutableList()
            val c = list[index]
            val updated = when {
                index == 0 -> c.copy(radius = radiusProduct)
                c.mode == GearMode.GLOBAL -> c.copy(radiusGlobal = radiusProduct)
                c.mode == GearMode.ENGINE -> c.copy(radiusEngineMult = radiusProduct)
                else -> c.copy(radiusPrevMult = radiusProduct)
            }
            list[index] = updated.copy(
                radiusBase = baseValue ?: radiusProduct,
                radiusStepIndex = stepIndex
            )
            state.copy(circles = list)
        }
        resetStrokeContinuity()
        updateExportedCode()
    }

    fun setCircleSpeed(index: Int, speedProduct: Float, baseValue: Float? = null, stepIndex: Int = 11) {
        _uiState.update { state ->
            if (index !in state.circles.indices) return@update state
            val list = state.circles.toMutableList()
            val c = list[index]
            val updated = when {
                index == 0 -> c.copy(speedDeg = speedProduct)
                c.mode == GearMode.GLOBAL -> c.copy(speedGlobal = speedProduct)
                c.mode == GearMode.ENGINE -> c.copy(speedEngineMult = speedProduct)
                else -> c.copy(speedPrevMult = speedProduct)
            }
            list[index] = updated.copy(
                speedBase = baseValue ?: speedProduct,
                speedStepIndex = stepIndex
            )
            state.copy(circles = list)
        }
        updateExportedCode()
    }

    // View Transformation Controls
    fun onPan(dx: Float, dy: Float) {
        _uiState.update {
            it.copy(
                panX = it.panX + dx,
                panY = it.panY + dy
            )
        }
    }

    fun onZoom(scaleFactor: Float, pivotX: Float, pivotY: Float, viewWidth: Float, viewHeight: Float) {
        _uiState.update { current ->
            val oldZoom = current.zoom
            val newZoom = (oldZoom * scaleFactor).coerceIn(0.02f, 10f)
            if (newZoom == oldZoom) return@update current

            val wx = (pivotX - viewWidth / 2f - current.panX) / oldZoom
            val wy = (pivotY - viewHeight / 2f - current.panY) / oldZoom

            val newPanX = pivotX - viewWidth / 2f - wx * newZoom
            val newPanY = pivotY - viewHeight / 2f - wy * newZoom

            current.copy(zoom = newZoom, panX = newPanX, panY = newPanY)
        }
    }

    fun zoomIn() {
        _uiState.update { it.copy(zoom = (it.zoom * 1.25f).coerceIn(0.02f, 10f)) }
    }

    fun zoomOut() {
        _uiState.update { it.copy(zoom = (it.zoom / 1.25f).coerceIn(0.02f, 10f)) }
    }

    fun resetView() {
        _uiState.update { it.copy(panX = 0f, panY = 0f, zoom = 0.28f) }
    }

    // Presets Loading
    fun loadCuratedPreset(preset: CuratedPreset) {
        val newCircles = preset.circles.mapIndexed { idx, c ->
            c.copy(id = (idx + 1).toLong())
        }
        val maxId = newCircles.maxOfOrNull { it.id } ?: 0L
        nextGearId = maxOf(nextGearId, maxId + 1L)

        val chain = computeChain(newCircles)
        val totalReach = chain.sumOf { it.radius.toDouble() }.toFloat()
        val idealZoom = if (totalReach > 0f) (360f / totalReach).coerceIn(0.18f, 2.5f) else 0.28f

        _uiState.update {
            it.copy(
                circles = newCircles,
                globalSpeedMult = preset.speedMult,
                inkWeight = preset.weight,
                currentPresetName = preset.title,
                panX = 0f,
                panY = 0f,
                zoom = idealZoom,
                activeSheet = ActiveSheet.NONE
            )
        }
        resetDrawing()
        updateExportedCode()
    }

    fun loadSavedPreset(saved: SavedPresetEntity) {
        try {
            val code = saved.encodedData.trim()
            val parsed = if (code.startsWith("[")) parseFlatArray(code) else parseLabeled(code)
            val maxId = parsed.circles.maxOfOrNull { it.id } ?: 0L
            nextGearId = maxOf(nextGearId, maxId + 1L)

            val chain = computeChain(parsed.circles)
            val totalReach = chain.sumOf { it.radius.toDouble() }.toFloat()
            val idealZoom = if (totalReach > 0f) (360f / totalReach).coerceIn(0.18f, 2.5f) else 0.28f

            _uiState.update {
                it.copy(
                    circles = parsed.circles,
                    globalSpeedMult = parsed.speedMult,
                    inkWeight = parsed.weight,
                    currentPresetName = saved.title,
                    panX = 0f,
                    panY = 0f,
                    zoom = idealZoom,
                    activeSheet = ActiveSheet.NONE
                )
            }
            resetDrawing()
            updateExportedCode()
            showCodeMessage("Loaded \"${saved.title}\"", true)
        } catch (e: Exception) {
            showCodeMessage("Failed to load preset: ${e.message}", false)
        }
    }

    // Save Preset to Room DB
    fun saveCurrentDesign(title: String, description: String = "") {
        val state = _uiState.value
        val encoded = exportFlatArray()
        val colorsHex = state.circles.filter { it.isPen }.joinToString(",") { it.color.toHexString() }

        viewModelScope.launch(Dispatchers.IO) {
            repository.savePreset(
                SavedPresetEntity(
                    title = title.ifBlank { "Creation #${(100..999).random()}" },
                    description = description,
                    encodedData = encoded,
                    circleCount = state.circles.size,
                    previewColors = colorsHex
                )
            )
        }
        _uiState.update { it.copy(showSaveDialog = false, currentPresetName = title) }
        showCodeMessage("Design saved to presets!", true)
    }

    fun deleteSavedPreset(preset: SavedPresetEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deletePreset(preset)
        }
    }

    fun setShowSaveDialog(show: Boolean) {
        _uiState.update { it.copy(showSaveDialog = show) }
    }

    fun setShowExportDialog(show: Boolean) {
        _uiState.update { it.copy(showExportDialog = show) }
    }

    // Setup Code Export & Import
    private fun updateExportedCode() {
        val state = _uiState.value
        val code = when (state.exportFormat) {
            ExportFormat.LABELED -> exportLabeled()
            ExportFormat.ARRAY -> exportFlatArray()
            ExportFormat.EQUATION -> exportEquation()
        }
        _uiState.update { it.copy(exportedCode = code) }
        scheduleWorkspaceSave()
    }

    fun exportLabeled(): String {
        val state = _uiState.value
        val sb = StringBuilder()
        sb.append(String.format(Locale.US, "speed=%.2f, weight=%.2f\n", state.globalSpeedMult, state.inkWeight))
        state.circles.forEachIndexed { i, c ->
            if (i == 0) {
                val penStr = if (c.isPen) "pen ${c.color.toHexString()}" else "bolt"
                sb.append(String.format(Locale.US, "C1: engine  r=%.2f  s=%.2f  %s\n", c.radius, c.speedDeg, penStr))
            } else {
                val modeLabel = when (c.mode) {
                    GearMode.PREVIOUS -> "prev"
                    GearMode.ENGINE -> "engine"
                    GearMode.GLOBAL -> "global"
                }
                val rStr = when (c.mode) {
                    GearMode.GLOBAL -> String.format(Locale.US, "%.2f", c.radiusGlobal)
                    GearMode.ENGINE -> String.format(Locale.US, "%.2fx", c.radiusEngineMult)
                    GearMode.PREVIOUS -> String.format(Locale.US, "%.2fx", c.radiusPrevMult)
                }
                val sStr = when (c.mode) {
                    GearMode.GLOBAL -> String.format(Locale.US, "%.2f", c.speedGlobal)
                    GearMode.ENGINE -> String.format(Locale.US, "%.2fx", c.speedEngineMult)
                    GearMode.PREVIOUS -> String.format(Locale.US, "%.2fx", c.speedPrevMult)
                }
                val penStr = if (c.isPen) "pen ${c.color.toHexString()}" else "bolt"
                sb.append(String.format(Locale.US, "C%d: %s  r=%s  s=%s  %s\n", i + 1, modeLabel, rStr, sStr, penStr))
            }
        }
        return sb.toString().trimEnd()
    }

    fun exportFlatArray(): String {
        val state = _uiState.value
        val items = mutableListOf<String>()
        items.add(String.format(Locale.US, "%.3f", state.globalSpeedMult))
        items.add(String.format(Locale.US, "%.3f", state.inkWeight))
        items.add("${state.circles.size}")

        state.circles.forEachIndexed { i, c ->
            val modeNum = when {
                i == 0 || c.mode == GearMode.GLOBAL -> 0
                c.mode == GearMode.ENGINE -> 1
                else -> 2
            }
            val (r, s) = when {
                i == 0 -> Pair(c.radius, c.speedDeg)
                c.mode == GearMode.GLOBAL -> Pair(c.radiusGlobal, c.speedGlobal)
                c.mode == GearMode.ENGINE -> Pair(c.radiusEngineMult, c.speedEngineMult)
                else -> Pair(c.radiusPrevMult, c.speedPrevMult)
            }
            var colorIdx = InkPalette.indexOf(c.color)
            if (colorIdx < 0) colorIdx = 0
            items.add("$modeNum")
            items.add(String.format(Locale.US, "%.3f", r))
            items.add(String.format(Locale.US, "%.3f", s))
            items.add(if (c.isPen) "1" else "0")
            items.add("$colorIdx")
        }
        return "[" + items.joinToString(",") + "]"
    }

    fun exportEquation(): String {
        val state = _uiState.value
        val chain = computeChain(state.circles)
        val g = state.globalSpeedMult
        val sb = StringBuilder()
        sb.append("// t in seconds, angles in degrees (multiply by π/180 for radians)\n")
        sb.append(String.format(Locale.US, "// global speed ×%.2f is folded into omega below\n", g))
        sb.append("// each pen is the partial sum of every circle up to it\n\n")

        var anyPen = false
        chain.forEachIndexed { k, link ->
            if (link.isPen) {
                anyPen = true
                val xTerms = mutableListOf<String>()
                val yTerms = mutableListOf<String>()
                for (i in 0..k) {
                    val r = String.format(Locale.US, "%.2f", chain[i].radius)
                    val w = String.format(Locale.US, "%.2f", chain[i].speedDeg * g)
                    xTerms.add("$r·sin(${w}t)")
                    yTerms.add("$r·cos(${w}t)")
                }
                sb.append("Pen at Circle ${k + 1} (${link.color.toHexString()}):\n")
                sb.append("x(t) = ${xTerms.joinToString(" + ")}\n")
                sb.append("y(t) = ${yTerms.joinToString(" + ")}\n\n")
            }
        }
        if (!anyPen) {
            sb.append("(no active pens — enable 'Pen' on at least one circle)")
        }
        return sb.toString().trimEnd()
    }

    data class ParsedSetup(
        val speedMult: Float,
        val weight: Float,
        val circles: List<GearCircle>
    )

    fun importSetupCode(text: String) {
        val trimmed = text.trim()
        if (trimmed.isBlank()) {
            showCodeMessage("Please paste a setup code first", false)
            return
        }
        try {
            val parsed = if (trimmed.startsWith("[")) parseFlatArray(trimmed) else parseLabeled(trimmed)
            if (parsed.circles.isEmpty()) throw IllegalArgumentException("No valid circles found")

            val maxId = parsed.circles.maxOfOrNull { it.id } ?: 0L
            nextGearId = maxOf(nextGearId, maxId + 1L)

            val chain = computeChain(parsed.circles)
            val totalReach = chain.sumOf { it.radius.toDouble() }.toFloat()
            val idealZoom = if (totalReach > 0f) (360f / totalReach).coerceIn(0.18f, 2.5f) else 0.28f

            _uiState.update {
                it.copy(
                    circles = parsed.circles,
                    globalSpeedMult = parsed.speedMult,
                    inkWeight = parsed.weight,
                    currentPresetName = "Custom Imported Setup",
                    panX = 0f,
                    panY = 0f,
                    zoom = idealZoom
                )
            }
            resetDrawing()
            updateExportedCode()
            showCodeMessage("Setup loaded successfully ✓", true)
        } catch (e: Exception) {
            showCodeMessage("Could not parse setup: ${e.localizedMessage ?: "Invalid format"}", false)
        }
    }

    private fun parseFlatArray(text: String): ParsedSetup {
        val clean = text.removePrefix("[").removeSuffix("]").trim()
        val tokens = clean.split(",").map { it.trim() }
        if (tokens.size < 3) throw IllegalArgumentException("Invalid array length")

        val speedMult = tokens[0].toFloatOrNull() ?: 1.0f
        val weight = tokens[1].toFloatOrNull() ?: 2.0f
        val count = tokens[2].toIntOrNull() ?: throw IllegalArgumentException("Invalid circle count")

        var idx = 3
        val circles = mutableListOf<GearCircle>()
        for (i in 0 until count) {
            if (idx + 4 >= tokens.size) throw IllegalArgumentException("Incomplete circle parameters")
            val modeNum = tokens[idx++].toIntOrNull() ?: 0
            val r = tokens[idx++].toFloatOrNull() ?: 100f
            val s = tokens[idx++].toFloatOrNull() ?: 50f
            val isPen = tokens[idx++].toIntOrNull() == 1
            val colorIdx = tokens[idx++].toIntOrNull() ?: 0
            val color = InkPalette.getOrElse(colorIdx % InkPalette.size) { InkPalette[0] }

            val mode = when (modeNum) {
                1 -> GearMode.ENGINE
                2 -> GearMode.PREVIOUS
                else -> GearMode.GLOBAL
            }

            circles.add(
                buildCircle(i, mode, r, s, isPen, color)
            )
        }
        return ParsedSetup(speedMult, weight, circles)
    }

    private fun parseLabeled(text: String): ParsedSetup {
        val lines = text.lines().map { it.trim() }.filter { it.isNotEmpty() }
        var speedMult = 1.0f
        var weight = 2.0f

        val header = lines.firstOrNull { it.contains("speed", ignoreCase = true) }
        if (header != null) {
            val speedMatch = Regex("""speed\s*=\s*(-?[\d.]+)""", RegexOption.IGNORE_CASE).find(header)
            val weightMatch = Regex("""weight\s*=\s*(-?[\d.]+)""", RegexOption.IGNORE_CASE).find(header)
            speedMatch?.groupValues?.get(1)?.toFloatOrNull()?.let { speedMult = it }
            weightMatch?.groupValues?.get(1)?.toFloatOrNull()?.let { weight = it }
        }

        val circleLines = lines.filter { it.matches(Regex("""^C\d+\s*:.*""", RegexOption.IGNORE_CASE)) }
        if (circleLines.isEmpty()) throw IllegalArgumentException("No circle lines found (expected C1: ...)")

        val circles = circleLines.mapIndexed { i, line ->
            val mode = when {
                i == 0 -> GearMode.GLOBAL
                line.contains("engine", ignoreCase = true) -> GearMode.ENGINE
                line.contains("prev", ignoreCase = true) -> GearMode.PREVIOUS
                else -> GearMode.GLOBAL
            }
            val rMatch = Regex("""r=(-?[\d.]+)""", RegexOption.IGNORE_CASE).find(line)
            val sMatch = Regex("""s=(-?[\d.]+)""", RegexOption.IGNORE_CASE).find(line)
            val r = rMatch?.groupValues?.get(1)?.toFloatOrNull() ?: 100f
            val s = sMatch?.groupValues?.get(1)?.toFloatOrNull() ?: 50f
            val isPen = line.contains("pen", ignoreCase = true)
            val hexMatch = Regex("""#([0-9A-Fa-f]{6})""").find(line)
            val color = if (hexMatch != null) parseHexColor(hexMatch.value) else InkPalette[i % InkPalette.size]

            buildCircle(i, mode, r, s, isPen, color)
        }
        return ParsedSetup(speedMult, weight, circles)
    }

    private fun buildCircle(index: Int, mode: GearMode, r: Float, s: Float, isPen: Boolean, color: Color): GearCircle {
        val circleId = (index + 1).toLong()
        nextGearId = maxOf(nextGearId, circleId + 1L)
        return if (index == 0) {
            GearCircle(
                id = circleId,
                mode = GearMode.GLOBAL,
                radius = r,
                speedDeg = s,
                angle = -90f,
                initialAngle = -90f,
                isPen = isPen,
                color = color
            )
        } else {
            GearCircle(
                id = circleId,
                mode = mode,
                angle = -90f,
                initialAngle = -90f,
                isPen = isPen,
                color = color,
                radiusGlobal = if (mode == GearMode.GLOBAL) r else 140f,
                radiusEngineMult = if (mode == GearMode.ENGINE) r else 0.5f,
                radiusPrevMult = if (mode == GearMode.PREVIOUS) r else 0.5f,
                speedGlobal = if (mode == GearMode.GLOBAL) s else 50f,
                speedEngineMult = if (mode == GearMode.ENGINE) s else 1.5f,
                speedPrevMult = if (mode == GearMode.PREVIOUS) s else -1.5f
            )
        }
    }

    private fun showCodeMessage(msg: String, isSuccess: Boolean) {
        _uiState.update { it.copy(codeMessage = msg, isSuccessMessage = isSuccess) }
    }

    fun clearCodeMessage() {
        _uiState.update { it.copy(codeMessage = null) }
    }
}
