package com.example

import android.app.Application
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.PresetLibrary
import com.example.ui.viewmodel.CompassInkViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("Spirograph Studio", appName)
  }

  @Test
  fun `adding gears maintains unique IDs and updates simulation chain`() {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val viewModel = CompassInkViewModel(app)

    val initialCount = viewModel.uiState.value.circles.size
    assertEquals(4, initialCount)

    // Add 5 more gears in sequence
    for (i in 1..5) {
      viewModel.addCircle()
    }

    val finalCircles = viewModel.uiState.value.circles
    assertEquals(initialCount + 5, finalCircles.size)

    // Verify all circle IDs are strictly unique
    val ids = finalCircles.map { it.id }
    assertEquals(finalCircles.size, ids.toSet().size)

    // Verify chain computes without errors
    val chain = viewModel.computeChain()
    assertEquals(finalCircles.size, chain.size)
  }

  @Test
  fun `loading presets and adding gears does not produce duplicate IDs`() {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val viewModel = CompassInkViewModel(app)

    for (preset in PresetLibrary.presets) {
      viewModel.loadCuratedPreset(preset)
      viewModel.addCircle()
      viewModel.addCircle()

      val circles = viewModel.uiState.value.circles
      val ids = circles.map { it.id }
      assertEquals("Preset ${preset.title} produced duplicate IDs", circles.size, ids.toSet().size)
    }
  }

  @Test
  fun `exportEquation generates right-side-up Cartesian y coordinates`() {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val viewModel = CompassInkViewModel(app)

    val equation = viewModel.exportEquation()
    assertTrue(equation.contains("x(t) ="))
    assertTrue(equation.contains("y(t) ="))
    // Ensure y(t) is not inverted with -() so it graphs right-side-up
    assertTrue(!equation.contains("y(t) = -("))
  }
}

