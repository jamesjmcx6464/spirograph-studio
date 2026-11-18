package com.example.ui.components

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.view.ViewTreeObserver
import android.view.Window
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

fun hideSystemBarsForWindow(window: Window) {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    WindowCompat.getInsetsController(window, window.decorView).apply {
        hide(WindowInsetsCompat.Type.systemBars())
        systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
}

fun hideSystemNavigationForWindow(window: Window) = hideSystemBarsForWindow(window)

fun findActivity(view: View): Activity? {
    var context: Context = view.context
    while (context is ContextWrapper) {
        if (context is Activity) return context
        context = context.baseContext
    }
    return null
}

fun applyHideToAll(view: View) {
    // 1. Hide on Activity window
    findActivity(view)?.window?.let { actWindow ->
        hideSystemBarsForWindow(actWindow)
    }

    // 2. Hide on Dialog / BottomSheet window if inside one
    var parent = view.parent
    while (parent != null) {
        if (parent is DialogWindowProvider) {
            hideSystemBarsForWindow(parent.window)
            break
        }
        parent = parent.parent
    }
}

@Composable
fun HideNavigationBarsEffect() {
    val view = LocalView.current

    DisposableEffect(view) {
        val focusListener = ViewTreeObserver.OnWindowFocusChangeListener { hasFocus ->
            if (hasFocus) {
                applyHideToAll(view)
            }
        }
        val layoutListener = ViewTreeObserver.OnGlobalLayoutListener {
            applyHideToAll(view)
        }

        view.viewTreeObserver.addOnWindowFocusChangeListener(focusListener)
        view.viewTreeObserver.addOnGlobalLayoutListener(layoutListener)

        applyHideToAll(view)
        view.post { applyHideToAll(view) }

        onDispose {
            view.viewTreeObserver.removeOnWindowFocusChangeListener(focusListener)
            view.viewTreeObserver.removeOnGlobalLayoutListener(layoutListener)
            findActivity(view)?.window?.let { actWindow ->
                hideSystemNavigationForWindow(actWindow)
            }
        }
    }
}
