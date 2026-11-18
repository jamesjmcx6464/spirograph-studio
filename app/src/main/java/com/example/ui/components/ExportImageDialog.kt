package com.example.ui.components

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import com.example.data.model.InkStroke
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.MutedGray
import com.example.ui.theme.PanelBg
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max
import kotlin.math.min

@Composable
fun ExportImageDialog(
    strokes: List<InkStroke>,
    title: String?,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var previewBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var isGenerating by remember { mutableStateOf(true) }

    LaunchedEffect(strokes) {
        withContext(Dispatchers.Default) {
            val bmp = renderStrokesToBitmap(strokes, 2048, 2048)
            previewBitmap = bmp
            isGenerating = false
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            decorFitsSystemWindows = false
        ),
        containerColor = PanelBg,
        title = {
            HideNavigationBarsEffect()
            Text(
                text = "EXPORT ARTWORK",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = BrassGold
                )
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Ultra-high resolution 2048×2048 vector-smooth PNG rendering.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MutedGray
                )
                Spacer(modifier = Modifier.height(14.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(CanvasBg)
                        .border(1.dp, PanelEdge, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    if (isGenerating) {
                        CircularProgressIndicator(
                            color = BrassGold,
                            modifier = Modifier.size(32.dp),
                            strokeWidth = 3.dp
                        )
                    } else if (previewBitmap != null) {
                        Image(
                            bitmap = previewBitmap!!.asImageBitmap(),
                            contentDescription = "Artwork preview",
                            modifier = Modifier.matchParentSize()
                        )
                    } else {
                        Text("No artwork strokes to render", color = MutedGray)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    previewBitmap?.let { bmp ->
                        shareBitmap(context, bmp, title ?: "Compass & Ink Creation")
                    }
                },
                enabled = previewBitmap != null,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrassGold,
                    contentColor = CanvasBg
                )
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("SHARE IMAGE", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("CLOSE", color = MutedGray)
            }
        }
    )
}

private fun renderStrokesToBitmap(strokes: List<InkStroke>, width: Int, height: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    // Background color: #0A0D10
    canvas.drawColor(android.graphics.Color.parseColor("#0A0D10"))

    if (strokes.isEmpty()) return bitmap

    // Compute bounding box
    var minX = Float.MAX_VALUE
    var maxX = -Float.MAX_VALUE
    var minY = Float.MAX_VALUE
    var maxY = -Float.MAX_VALUE

    for (s in strokes) {
        for (p in s.points) {
            minX = min(minX, p.x)
            maxX = max(maxX, p.x)
            minY = min(minY, p.y)
            maxY = max(maxY, p.y)
        }
    }

    val padding = 80f
    val strokeWidthSpan = (maxX - minX).coerceAtLeast(10f)
    val strokeHeightSpan = (maxY - minY).coerceAtLeast(10f)
    val scale = min(
        (width - padding * 2) / strokeWidthSpan,
        (height - padding * 2) / strokeHeightSpan
    )

    val midX = (minX + maxX) / 2f
    val midY = (minY + maxY) / 2f

    canvas.save()
    canvas.translate(width / 2f, height / 2f)
    canvas.scale(scale, scale)
    canvas.translate(-midX, -midY)

    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.DITHER_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        isAntiAlias = true
        isDither = true
    }

    for (s in strokes) {
        val pts = s.points
        if (pts.size < 2) continue
        paint.color = s.color.toArgb()
        paint.strokeWidth = s.weight

        val path = Path()
        path.moveTo(pts[0].x, pts[0].y)
        if (pts.size == 2) {
            path.lineTo(pts[1].x, pts[1].y)
        } else {
            for (i in 1 until pts.size - 1) {
                val p0 = pts[i]
                val p1 = pts[i + 1]
                val midX = (p0.x + p1.x) / 2f
                val midY = (p0.y + p1.y) / 2f
                path.quadTo(p0.x, p0.y, midX, midY)
            }
            val last = pts.last()
            path.lineTo(last.x, last.y)
        }
        canvas.drawPath(path, paint)
    }

    canvas.restore()
    return bitmap
}

private fun shareBitmap(context: Context, bitmap: Bitmap, title: String) {
    try {
        val cachePath = File(context.cacheDir, "images")
        cachePath.mkdirs()
        val file = File(cachePath, "compass_ink_creation.png")
        val stream = FileOutputStream(file)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        stream.close()

        val contentUri: Uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, contentUri)
            putExtra(Intent.EXTRA_SUBJECT, title)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Artwork"))
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
