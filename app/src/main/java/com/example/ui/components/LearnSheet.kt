package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrassDim
import com.example.ui.theme.BrassGold
import com.example.ui.theme.BrassGlow
import com.example.ui.theme.CanvasBg
import com.example.ui.theme.MutedGray
import com.example.ui.theme.PanelBg
import com.example.ui.theme.PanelBgElevated
import com.example.ui.theme.PanelEdge
import com.example.ui.theme.PaperWhite
import com.example.ui.theme.TealAccent

data class LessonItem(
    val id: String,
    val number: String,
    val title: String,
    val summary: String,
    val placeholderContent: String,
    val tag: String = "Tutorial"
)

data class TutorialCategory(
    val id: String,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val accentColor: Color,
    val lessons: List<LessonItem>
)

private val TUTORIAL_CATEGORIES = listOf(
    TutorialCategory(
        id = "basics",
        title = "Basics",
        subtitle = "Core mechanics, base engines & gear harmonics",
        icon = Icons.Default.School,
        accentColor = BrassGold,
        lessons = listOf(
            LessonItem(
                id = "basics_1",
                number = "01",
                title = "The Base Engine & Global Speed",
                summary = "Master Circle 0 as the central pivot of all planetary motion.",
                placeholderContent = "Lesson 1 details placeholder.\n\nLearn how the root engine radius defines the primary orbiting arm, and how adjusting Global Speed accelerates mathematical curve tracing in real-time."
            ),
            LessonItem(
                id = "basics_2",
                number = "02",
                title = "Adding Child Gears & Harmonic Linkages",
                summary = "Chain secondary and tertiary arms to generate compound geometric curves.",
                placeholderContent = "Lesson 2 details placeholder.\n\nUnderstand how each attached circle inherits the origin tip of its parent gear to construct intricate epitrochoid and hypotrochoid trajectories."
            ),
            LessonItem(
                id = "basics_3",
                number = "03",
                title = "Relative vs. Global Mode Coordinate Systems",
                summary = "Compare global angular rotation against relative gear ratios.",
                placeholderContent = "Lesson 3 details placeholder.\n\nDiscover how Relative Engine and Relative Previous multiplier modes automatically scale harmonic frequencies when modifying upstream gear parameters."
            ),
            LessonItem(
                id = "basics_4",
                number = "04",
                title = "Pen Placement, Nib Inking & Color Palettes",
                summary = "Enable pen tracing on specific joints and choose custom ink colors.",
                placeholderContent = "Lesson 4 details placeholder.\n\nConfigure active pens across one or multiple gears simultaneously to generate multi-colored interlocking geometric art."
            )
        )
    ),
    TutorialCategory(
        id = "complex_machines",
        title = "Complex Machines",
        subtitle = "Multi-arm assemblies, counter-rotations & symmetry nodes",
        icon = Icons.Default.Settings,
        accentColor = TealAccent,
        lessons = listOf(
            LessonItem(
                id = "complex_1",
                number = "01",
                title = "Multi-Arm Planetary Configurations",
                summary = "Construct 4-gear and 5-gear harmonic linkages with balanced radius ratios.",
                placeholderContent = "Lesson 1 details placeholder.\n\nExplore high-order linkage configurations where decaying radius lengths produce delicate fractal lace patterns and star rosettes."
            ),
            LessonItem(
                id = "complex_2",
                number = "02",
                title = "Counter-Rotational Symmetries & Node Cusp Formations",
                summary = "Harness negative gear speeds to create sharp star points and loops.",
                placeholderContent = "Lesson 2 details placeholder.\n\nLearn the mathematical relationship between positive and negative rotational frequencies in determining the exact number of cusps (petals) in a rosette."
            ),
            LessonItem(
                id = "complex_3",
                number = "03",
                title = "Multi-Pen Layering & Switchboard Control",
                summary = "Isolate and manage individual gear inks with the Layers switchboard.",
                placeholderContent = "Lesson 3 details placeholder.\n\nMaster the top-right Layers dashboard to independently toggle visibility, clear specific stroke paths, and compose multi-layer blueprints."
            ),
            LessonItem(
                id = "complex_4",
                number = "04",
                title = "Resonant Speed Ratios & Closed Curve Loops",
                summary = "Calculate rational fraction ratios that produce clean closed-loop curves.",
                placeholderContent = "Lesson 4 details placeholder.\n\nUnderstand greatest common divisors (GCD) and integer speed ratios that allow drawings to loop perfectly back into their starting position."
            )
        )
    ),
    TutorialCategory(
        id = "golden_ratio",
        title = "The Golden Ratio",
        subtitle = "Divine proportions, Fibonacci sequences & irrational spirals",
        icon = Icons.Default.AutoAwesome,
        accentColor = Color(0xFFFFB74D),
        lessons = listOf(
            LessonItem(
                id = "golden_1",
                number = "01",
                title = "The Divine Proportion (φ ≈ 1.618033...)",
                summary = "Incorporate the golden ratio into arm radius steps and angular velocities.",
                placeholderContent = "Lesson 1 details placeholder.\n\nDiscover how setting radius ratios to 1.618 and 0.618 produces organic, nature-inspired spiraling geometries that mirror sunflowers and nautilus shells."
            ),
            LessonItem(
                id = "golden_2",
                number = "02",
                title = "Fibonacci Harmonic Speed Ratios",
                summary = "Employ Fibonacci integers (1, 2, 3, 5, 8, 13, 21...) for natural phyllotaxis.",
                placeholderContent = "Lesson 2 details placeholder.\n\nLearn how successive Fibonacci gear speed combinations generate balanced, non-overlapping petal distributions with maximum visual harmony."
            ),
            LessonItem(
                id = "golden_3",
                number = "03",
                title = "Golden Spiral Leaf & Petal Packing",
                summary = "Balance radial expansion against rotation to simulate biological growth.",
                placeholderContent = "Lesson 3 details placeholder.\n\nExplore the golden angle (137.5°) and how continuous micro-stepping creates dense, mesmerizing sacred geometry mandalas."
            ),
            LessonItem(
                id = "golden_4",
                number = "04",
                title = "Irrational Stepping & Aperiodic Flow",
                summary = "Generate quasi-periodic non-repeating curves that never trace the same path.",
                placeholderContent = "Lesson 4 details placeholder.\n\nExperiment with irrational speed multipliers to produce infinite non-repeating spirographic tapestries."
            )
        )
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LearnSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit
) {
    // Track which category sections are expanded (default first one open)
    val expandedCategories = remember {
        mutableStateMapOf<String, Boolean>().apply {
            put("basics", true)
            put("complex_machines", false)
            put("golden_ratio", false)
        }
    }

    // Track which individual lesson card is expanded for viewing
    var expandedLessonId by remember { mutableStateOf<String?>(null) }
    var showTutorialPlaceholderDialog by remember { mutableStateOf(false) }

    if (showTutorialPlaceholderDialog) {
        AlertDialog(
            onDismissRequest = { showTutorialPlaceholderDialog = false },
            containerColor = PanelBg,
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.MenuBook,
                        contentDescription = null,
                        tint = Color(0xFF64B5F6)
                    )
                    Text(
                        text = "Tutorial",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = PaperWhite
                        )
                    )
                }
            },
            text = {
                Text(
                    text = "Interactive guided tutorial is currently in development.\n\nStep-by-step walkthroughs for gear mechanics, harmonic ratio tuning, and multi-layer inking will be available soon.",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = MutedGray,
                        lineHeight = 20.sp
                    )
                )
            },
            confirmButton = {
                TextButton(
                    onClick = { showTutorialPlaceholderDialog = false }
                ) {
                    Text(
                        text = "GOT IT",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = BrassGold
                        )
                    )
                }
            }
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = PanelBg,
        contentColor = PaperWhite,
        scrimColor = Color.Black.copy(alpha = 0.55f),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .size(width = 36.dp, height = 4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(PanelEdge)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(bottom = 28.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(BrassGold.copy(alpha = 0.15f))
                            .border(1.dp, BrassGold.copy(alpha = 0.6f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.School,
                            contentDescription = null,
                            tint = BrassGold,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "LEARN",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.6.sp,
                                color = BrassGold
                            )
                        )
                        Text(
                            text = "Guides & mechanical geometry lessons",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MutedGray,
                                fontSize = 12.sp
                            )
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(36.dp)
                        .testTag("learn_sheet_close_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = MutedGray
                    )
                }
            }

            // Categories List
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Tutorial Button (standalone action, no description)
                item {
                    Surface(
                        onClick = { showTutorialPlaceholderDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(
                                BorderStroke(1.dp, Color(0xFF64B5F6).copy(alpha = 0.45f)),
                                RoundedCornerShape(14.dp)
                            )
                            .testTag("tutorial_button"),
                        color = PanelBgElevated
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(Color(0xFF64B5F6).copy(alpha = 0.15f))
                                        .border(
                                            1.dp,
                                            Color(0xFF64B5F6).copy(alpha = 0.4f),
                                            RoundedCornerShape(10.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MenuBook,
                                        contentDescription = null,
                                        tint = Color(0xFF64B5F6),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                Text(
                                    text = "Tutorial",
                                    style = MaterialTheme.typography.titleSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = PaperWhite,
                                        fontSize = 15.sp
                                    )
                                )
                            }

                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Open Tutorial",
                                tint = Color(0xFF64B5F6),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                items(TUTORIAL_CATEGORIES, key = { it.id }) { category ->
                    val isCategoryExpanded = expandedCategories[category.id] == true

                    CategoryCard(
                        category = category,
                        isExpanded = isCategoryExpanded,
                        expandedLessonId = expandedLessonId,
                        onToggleExpand = {
                            expandedCategories[category.id] = !isCategoryExpanded
                        },
                        onToggleLesson = { lessonId ->
                            expandedLessonId = if (expandedLessonId == lessonId) null else lessonId
                        }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CanvasBg.copy(alpha = 0.6f))
                            .border(BorderStroke(1.dp, PanelEdge), RoundedCornerShape(12.dp))
                            .padding(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lightbulb,
                                contentDescription = null,
                                tint = BrassDim,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Interactive lesson modules and step-by-step interactive demonstrations are in development.",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = MutedGray,
                                    fontSize = 11.5.sp,
                                    lineHeight = 16.sp
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryCard(
    category: TutorialCategory,
    isExpanded: Boolean,
    expandedLessonId: String?,
    onToggleExpand: () -> Unit,
    onToggleLesson: (String) -> Unit
) {
    val rotationAngle by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        animationSpec = tween(durationMillis = 250, easing = FastOutSlowInEasing),
        label = "arrow_rotation"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize()
            .clip(RoundedCornerShape(14.dp))
            .border(
                BorderStroke(
                    1.dp,
                    if (isExpanded) category.accentColor.copy(alpha = 0.6f) else PanelEdge
                ),
                RoundedCornerShape(14.dp)
            ),
        color = PanelBgElevated
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Category Header Clickable Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggleExpand() }
                    .padding(horizontal = 14.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(category.accentColor.copy(alpha = 0.15f))
                            .border(1.dp, category.accentColor.copy(alpha = 0.4f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = category.icon,
                            contentDescription = null,
                            tint = category.accentColor,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = category.title,
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = PaperWhite,
                                    fontSize = 15.sp
                                )
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(CanvasBg)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "${category.lessons.size} lessons",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = category.accentColor,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                )
                            }
                        }

                        Text(
                            text = category.subtitle,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MutedGray,
                                fontSize = 11.5.sp
                            )
                        )
                    }
                }

                Icon(
                    imageVector = Icons.Default.ExpandMore,
                    contentDescription = if (isExpanded) "Collapse" else "Expand",
                    tint = if (isExpanded) category.accentColor else MutedGray,
                    modifier = Modifier
                        .size(22.dp)
                        .rotate(rotationAngle)
                )
            }

            // Expandable Lessons List
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically(animationSpec = tween(250)) + fadeIn(),
                exit = shrinkVertically(animationSpec = tween(200)) + fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CanvasBg.copy(alpha = 0.4f))
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    category.lessons.forEach { lesson ->
                        val isLessonExpanded = expandedLessonId == lesson.id

                        LessonRowCard(
                            lesson = lesson,
                            accentColor = category.accentColor,
                            isExpanded = isLessonExpanded,
                            onToggle = { onToggleLesson(lesson.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LessonRowCard(
    lesson: LessonItem,
    accentColor: Color,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    val rotationAngle by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        label = "lesson_arrow"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .border(
                BorderStroke(
                    1.dp,
                    if (isExpanded) accentColor.copy(alpha = 0.45f) else PanelEdge.copy(alpha = 0.7f)
                ),
                RoundedCornerShape(10.dp)
            ),
        color = if (isExpanded) PanelBg.copy(alpha = 0.95f) else PanelBgElevated.copy(alpha = 0.85f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggle() }
                .padding(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(26.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(accentColor.copy(alpha = 0.12f))
                            .border(1.dp, accentColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = lesson.number,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = accentColor,
                                fontSize = 11.sp
                            )
                        )
                    }

                    Column {
                        Text(
                            text = lesson.title,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = PaperWhite,
                                fontSize = 13.sp
                            )
                        )
                        Text(
                            text = lesson.summary,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MutedGray,
                                fontSize = 11.sp
                            )
                        )
                    }
                }

                Icon(
                    imageVector = Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = if (isExpanded) accentColor else MutedGray,
                    modifier = Modifier
                        .size(18.dp)
                        .rotate(rotationAngle)
                )
            }

            // Expanded Lesson Placeholder Content
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(CanvasBg)
                        .border(1.dp, PanelEdge, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Text(
                        text = lesson.placeholderContent,
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = PaperWhite.copy(alpha = 0.85f),
                            fontSize = 12.sp,
                            lineHeight = 17.sp
                        )
                    )
                }
            }
        }
    }
}
