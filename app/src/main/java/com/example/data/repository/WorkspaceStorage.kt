package com.example.data.repository

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import com.example.data.model.GearCircle
import com.example.data.model.GearMode
import com.example.data.model.InkStroke
import com.example.data.model.StrokePoint
import com.example.ui.viewmodel.ActiveSheet
import com.example.ui.viewmodel.CompassInkUiState
import com.example.ui.viewmodel.ExportFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class WorkspaceStorage(private val context: Context) {
    private val prefs = context.getSharedPreferences("compass_ink_workspace", Context.MODE_PRIVATE)
    private val strokesFile = File(context.filesDir, "active_strokes.bin")

    suspend fun saveWorkspace(state: CompassInkUiState, strokes: List<InkStroke>) = withContext(Dispatchers.IO) {
        try {
            // 1. Serialize Circles JSON
            val circlesArray = JSONArray()
            for (c in state.circles) {
                val obj = JSONObject().apply {
                    put("id", c.id)
                    put("mode", c.mode.name)
                    put("radius", c.radius.toDouble())
                    put("radiusGlobal", c.radiusGlobal.toDouble())
                    put("radiusEngineMult", c.radiusEngineMult.toDouble())
                    put("radiusPrevMult", c.radiusPrevMult.toDouble())
                    put("speedDeg", c.speedDeg.toDouble())
                    put("speedGlobal", c.speedGlobal.toDouble())
                    put("speedEngineMult", c.speedEngineMult.toDouble())
                    put("speedPrevMult", c.speedPrevMult.toDouble())
                    put("angle", c.angle.toDouble())
                    put("initialAngle", c.initialAngle.toDouble())
                    put("isPen", c.isPen)
                    put("color", c.color.value.toLong())
                }
                circlesArray.put(obj)
            }

            val hiddenLayersStr = state.hiddenLayerIds.joinToString(",")

            prefs.edit()
                .putBoolean("has_saved_workspace", true)
                .putString("circles_json", circlesArray.toString())
                .putBoolean("is_playing", state.isPlaying)
                .putFloat("global_speed", state.globalSpeedMult)
                .putFloat("ink_weight", state.inkWeight)
                .putBoolean("show_guides", state.showGuides)
                .putBoolean("show_points", state.showPoints)
                .putFloat("pan_x", state.panX)
                .putFloat("pan_y", state.panY)
                .putFloat("zoom", state.zoom)
                .putString("preset_name", state.currentPresetName ?: "")
                .putString("hidden_layers", hiddenLayersStr)
                .apply()

            // 2. Save active strokes binary
            saveStrokesBinary(strokes)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun saveStrokesBinary(strokes: List<InkStroke>) {
        if (strokes.isEmpty()) {
            if (strokesFile.exists()) strokesFile.delete()
            return
        }
        val tempFile = File(context.filesDir, "active_strokes.bin.tmp")
        try {
            DataOutputStream(BufferedOutputStream(FileOutputStream(tempFile))).use { out ->
                // Write stroke count
                out.writeInt(strokes.size)
                for (s in strokes) {
                    out.writeLong(s.id)
                    out.writeLong(s.color.value.toLong())
                    out.writeFloat(s.weight)
                    val pts = s.points
                    out.writeInt(pts.size)
                    for (p in pts) {
                        out.writeFloat(p.x)
                        out.writeFloat(p.y)
                    }
                }
            }
            if (tempFile.exists()) {
                if (strokesFile.exists()) strokesFile.delete()
                tempFile.renameTo(strokesFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            tempFile.delete()
        }
    }

    suspend fun loadWorkspace(): Pair<CompassInkUiState?, List<InkStroke>> = withContext(Dispatchers.IO) {
        if (!prefs.getBoolean("has_saved_workspace", false)) {
            return@withContext Pair(null, emptyList())
        }

        try {
            val circlesJson = prefs.getString("circles_json", null) ?: return@withContext Pair(null, emptyList())
            val circlesArray = JSONArray(circlesJson)
            val circles = mutableListOf<GearCircle>()
            for (i in 0 until circlesArray.length()) {
                val obj = circlesArray.getJSONObject(i)
                val modeStr = obj.optString("mode", "GLOBAL")
                val mode = try { GearMode.valueOf(modeStr) } catch (_: Exception) { GearMode.GLOBAL }
                val colorVal = obj.optLong("color", 0xFFE39B3E)

                circles.add(
                    GearCircle(
                        id = obj.optLong("id", (i + 1).toLong()),
                        mode = mode,
                        radius = obj.optDouble("radius", 140.0).toFloat(),
                        radiusGlobal = obj.optDouble("radiusGlobal", 140.0).toFloat(),
                        radiusEngineMult = obj.optDouble("radiusEngineMult", 0.5).toFloat(),
                        radiusPrevMult = obj.optDouble("radiusPrevMult", 0.5).toFloat(),
                        speedDeg = obj.optDouble("speedDeg", 50.0).toFloat(),
                        speedGlobal = obj.optDouble("speedGlobal", 50.0).toFloat(),
                        speedEngineMult = obj.optDouble("speedEngineMult", 1.5).toFloat(),
                        speedPrevMult = obj.optDouble("speedPrevMult", -1.5).toFloat(),
                        angle = obj.optDouble("angle", -90.0).toFloat(),
                        initialAngle = obj.optDouble("initialAngle", -90.0).toFloat(),
                        isPen = obj.optBoolean("isPen", true),
                        color = Color(colorVal.toULong())
                    )
                )
            }

            if (circles.isEmpty()) {
                return@withContext Pair(null, emptyList())
            }

            val hiddenLayersStr = prefs.getString("hidden_layers", "") ?: ""
            val hiddenLayers = if (hiddenLayersStr.isNotBlank()) {
                hiddenLayersStr.split(",").mapNotNull { it.trim().toLongOrNull() }.toSet()
            } else {
                emptySet()
            }

            val strokes = loadStrokesBinary()

            val state = CompassInkUiState(
                circles = circles,
                isPlaying = prefs.getBoolean("is_playing", true),
                globalSpeedMult = prefs.getFloat("global_speed", 1.0f),
                inkWeight = prefs.getFloat("ink_weight", 2.0f),
                showGuides = prefs.getBoolean("show_guides", true),
                showPoints = prefs.getBoolean("show_points", true),
                panX = prefs.getFloat("pan_x", 0f),
                panY = prefs.getFloat("pan_y", 0f),
                zoom = prefs.getFloat("zoom", 1.6f),
                activeSheet = ActiveSheet.NONE,
                exportFormat = ExportFormat.LABELED,
                currentPresetName = prefs.getString("preset_name", "")?.takeIf { it.isNotBlank() },
                strokePointCount = strokes.sumOf { it.points.size },
                hiddenLayerIds = hiddenLayers,
                showLayersDashboard = false
            )

            return@withContext Pair(state, strokes)
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext Pair(null, emptyList())
        }
    }

    private fun loadStrokesBinary(): List<InkStroke> {
        if (!strokesFile.exists()) return emptyList()
        val result = mutableListOf<InkStroke>()
        try {
            DataInputStream(BufferedInputStream(FileInputStream(strokesFile))).use { input ->
                val strokeCount = input.readInt()
                for (sIdx in 0 until strokeCount) {
                    val id = input.readLong()
                    val colorVal = input.readLong()
                    val weight = input.readFloat()
                    val pointCount = input.readInt()
                    val pts = ArrayList<StrokePoint>(pointCount)
                    for (pIdx in 0 until pointCount) {
                        pts.add(StrokePoint(input.readFloat(), input.readFloat()))
                    }

                    // Rebuild compose path
                    val path = Path()
                    if (pts.isNotEmpty()) {
                        path.moveTo(pts[0].x, pts[0].y)
                        if (pts.size == 2) {
                            path.lineTo(pts[1].x, pts[1].y)
                        } else {
                            for (i in 1 until pts.size - 1) {
                                val p0 = pts[i]
                                val p1 = pts[i + 1]
                                val midX = (p0.x + p1.x) / 2f
                                val midY = (p0.y + p1.y) / 2f
                                path.quadraticBezierTo(p0.x, p0.y, midX, midY)
                            }
                            val last = pts.last()
                            path.lineTo(last.x, last.y)
                        }
                    }

                    result.add(
                        InkStroke(
                            id = id,
                            color = Color(colorVal.toULong()),
                            weight = weight,
                            points = pts.toMutableList(),
                            composePath = path
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return result
    }

    suspend fun clearWorkspaceStrokes() = withContext(Dispatchers.IO) {
        if (strokesFile.exists()) strokesFile.delete()
    }
}
