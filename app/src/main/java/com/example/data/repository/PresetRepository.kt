package com.example.data.repository

import com.example.data.db.PresetDao
import com.example.data.db.SavedPresetEntity
import kotlinx.coroutines.flow.Flow

class PresetRepository(private val presetDao: PresetDao) {
    val allSavedPresets: Flow<List<SavedPresetEntity>> = presetDao.getAllPresets()

    suspend fun savePreset(preset: SavedPresetEntity): Long {
        return presetDao.insertPreset(preset)
    }

    suspend fun deletePreset(preset: SavedPresetEntity) {
        presetDao.deletePreset(preset)
    }

    suspend fun deletePresetById(id: Long) {
        presetDao.deletePresetById(id)
    }
}
