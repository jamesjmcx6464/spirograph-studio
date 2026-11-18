package com.example.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_presets")
data class SavedPresetEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val encodedData: String, // Compact array or labeled code representation
    val circleCount: Int,
    val previewColors: String, // Comma-separated hex colors
    val createdAt: Long = System.currentTimeMillis()
)
