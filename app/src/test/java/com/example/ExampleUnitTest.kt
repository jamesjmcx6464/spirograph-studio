package com.example

import com.example.data.model.GearCircle
import com.example.data.model.GearMode
import com.example.data.model.PresetLibrary
import com.example.ui.components.formatDisplayNumber
import com.example.ui.viewmodel.ActiveSheet
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun activeSheet_containsLearn() {
        assertTrue(ActiveSheet.values().contains(ActiveSheet.LEARN))
    }

    @Test
    fun presets_areValid() {
        assertTrue(PresetLibrary.presets.isNotEmpty())
        val first = PresetLibrary.presets.first()
        assertTrue(first.circles.isNotEmpty())
        assertTrue(first.circles.first().radius > 0f)
    }

    @Test
    fun gearChain_calculationLogic() {
        val c1 = GearCircle(id = 1, radius = 100f, speedDeg = 10f)
        val c2 = GearCircle(id = 2, mode = GearMode.PREVIOUS, radiusPrevMult = 0.5f, speedPrevMult = -2f)
        assertEquals(100f, c1.radius, 0.001f)
        assertEquals(0.5f, c2.radiusPrevMult, 0.001f)
    }

    @Test
    fun numberFormatting_formatsIntegersAndDecimalsCleanly() {
        assertEquals("20", formatDisplayNumber(20f, 2))
        assertEquals("0.25", formatDisplayNumber(0.25f, 2))
        assertEquals("-0.2", formatDisplayNumber(-0.2f, 2))
        assertEquals("4.9", formatDisplayNumber(4.9f, 2))
        assertEquals("-1.5", formatDisplayNumber(-1.5f, 2))
    }

    @Test
    fun numberParsing_handlesPartialAndNegativeInputs() {
        assertEquals(0.25f, ".25".toFloat(), 0.001f)
        assertEquals(0.2f, ".2".toFloat(), 0.001f)
        assertEquals(-0.3f, "-.3".toFloat(), 0.001f)
        assertEquals(-0.2f, "-0.2".toFloat(), 0.001f)
        assertEquals(7.0f, "7".toFloat(), 0.001f)
        assertEquals(-7.0f, "-7".toFloat(), 0.001f)
        assertEquals(13.5f, "13.5".toFloat(), 0.001f)
    }
}

