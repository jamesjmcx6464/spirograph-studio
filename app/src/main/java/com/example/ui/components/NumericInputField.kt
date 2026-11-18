package com.example.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextFieldColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import com.example.ui.theme.TealAccent
import java.util.Locale
import kotlin.math.abs

@Composable
fun NumericInputField(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    width: Dp = 76.dp,
    height: Dp? = null,
    minVal: Float? = null,
    maxVal: Float? = null,
    maxDecimals: Int = 2,
    allowNegative: Boolean = true,
    textStyle: TextStyle = MaterialTheme.typography.bodySmall.copy(
        color = PaperWhite,
        fontWeight = FontWeight.SemiBold,
        textAlign = TextAlign.Center
    ),
    colors: TextFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = TealAccent,
        unfocusedBorderColor = PanelEdge,
        focusedContainerColor = CanvasBg,
        unfocusedContainerColor = CanvasBg,
        cursorColor = TealAccent
    ),
    tag: String? = null
) {
    val focusManager = LocalFocusManager.current
    var isFocused by remember { mutableStateOf(false) }
    var isUserTyping by remember { mutableStateOf(false) }
    var lastParsedValue by remember { mutableStateOf<Float?>(value) }
    var textState by remember { mutableStateOf(formatDisplayNumber(value, maxDecimals)) }

    // Synchronize with external value changes (slider movement, preset loading) when not actively typing
    LaunchedEffect(value) {
        if (!isFocused || !isUserTyping) {
            textState = formatDisplayNumber(value, maxDecimals)
            lastParsedValue = value
        }
    }

    val baseModifier = modifier
        .width(width)
        .then(if (height != null) Modifier.height(height) else Modifier)
        .then(if (tag != null) Modifier.testTag(tag) else Modifier)
        .onFocusChanged { focusState ->
            val wasFocused = isFocused
            isFocused = focusState.isFocused
            if (wasFocused && !focusState.isFocused) {
                isUserTyping = false
                // Focus lost: canonicalize text
                val parsed = textState.toFloatOrNull()
                if (parsed != null && !parsed.isNaN() && !parsed.isInfinite()) {
                    val clamped = if (minVal != null && maxVal != null) {
                        parsed.coerceIn(minVal, maxVal)
                    } else if (minVal != null) {
                        parsed.coerceAtLeast(minVal)
                    } else if (maxVal != null) {
                        parsed.coerceAtMost(maxVal)
                    } else parsed
                    onValueChange(clamped)
                    textState = formatDisplayNumber(clamped, maxDecimals)
                    lastParsedValue = clamped
                } else {
                    // Invalid or empty input reverted to current valid value
                    textState = formatDisplayNumber(value, maxDecimals)
                    lastParsedValue = value
                }
            }
        }

    OutlinedTextField(
        value = textState,
        onValueChange = { input ->
            // Filter allowed characters
            val sanitized = sanitizeNumericInput(input, allowNegative)
            if (sanitized != null) {
                isUserTyping = true
                textState = sanitized
                val parsed = sanitized.toFloatOrNull()
                if (parsed != null && !parsed.isNaN() && !parsed.isInfinite()) {
                    val safeVal = parsed.coerceIn(-50000f, 50000f)
                    lastParsedValue = safeVal
                    onValueChange(safeVal)
                }
            }
        },
        modifier = baseModifier,
        textStyle = textStyle,
        singleLine = true,
        keyboardOptions = KeyboardOptions(
            keyboardType = if (allowNegative) KeyboardType.Text else KeyboardType.Decimal,
            imeAction = ImeAction.Done
        ),
        keyboardActions = KeyboardActions(
            onDone = {
                focusManager.clearFocus()
            }
        ),
        shape = RoundedCornerShape(8.dp),
        colors = colors
    )
}

private fun sanitizeNumericInput(input: String, allowNegative: Boolean): String? {
    if (input.isEmpty()) return ""
    val trimmed = input.trim()

    var hasDot = false
    val sb = StringBuilder()

    for (i in trimmed.indices) {
        val c = trimmed[i]
        if (c == '-') {
            if (i == 0 && allowNegative) {
                sb.append(c)
            } else {
                return null // Minus not allowed anywhere else
            }
        } else if (c == '.') {
            if (!hasDot) {
                hasDot = true
                sb.append(c)
            } else {
                return null // Multiple dots not allowed
            }
        } else if (c.isDigit()) {
            sb.append(c)
        } else {
            return null // Non-digit characters disallowed
        }
    }
    return sb.toString()
}

fun formatDisplayNumber(value: Float, maxDecimals: Int = 2): String {
    if (value.isNaN() || value.isInfinite()) return "0"
    if (value % 1.0f == 0.0f) {
        return value.toLong().toString()
    }
    val formatted = String.format(Locale.US, "%.${maxDecimals}f", value)
    return formatted.trimEnd('0').trimEnd('.')
}
