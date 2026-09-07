package com.example.sentinel.widgets

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

// Agent State Data Model
data class AgentItem(
    val id: String,
    val name: String,
    val role: String,
    val model: String,
    val status: AgentStatus,
    val capabilities: List<String>,
    val systemPrompt: String,
    val temperature: Float = 0.7f,
    val tokensUsed: String = "0"
)

enum class AgentStatus {
    RUNNING, IDLE, PAUSED, ERRORED
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentStudioHeader(
    totalAgents: Int,
    activeCount: Int
) {
    TopAppBar(
        windowInsets = WindowInsets(0.dp),
        title = {
            Column {
                Text(
                    text = "Agent Studio",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "$activeCount active • $totalAgents total subagents",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        actions = {
            IconButton(onClick = { /* Refresh */ }) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refresh Agents",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun AgentFilterBar(
    selectedFilter: String,
    onFilterSelected: (String) -> Unit
) {
    val filters = listOf("All", "Running", "Idle", "Paused")
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        filters.forEach { filter ->
            val selected = filter.equals(selectedFilter, ignoreCase = true)
            FilterChip(
                selected = selected,
                onClick = { onFilterSelected(filter) },
                label = { Text(filter) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    }
}

@Composable
fun AgentCard(
    agent: AgentItem,
    onStatusToggle: () -> Unit,
    onEditClick: () -> Unit
) {
    var isExpanded by remember { mutableStateOf(false) }

    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { isExpanded = !isExpanded },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Top Row: Icon + Title + Status Chip
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Agent Avatar Icon
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = getAgentIcon(agent.role),
                        contentDescription = agent.name,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Title & Model
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = agent.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${agent.role} • ${agent.model}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Status Badge
                StatusBadge(status = agent.status)
            }

            // Capabilities Tags
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                agent.capabilities.forEach { cap ->
                    SuggestionChip(
                        onClick = { },
                        label = {
                            Text(
                                text = cap,
                                style = MaterialTheme.typography.labelSmall
                            )
                        },
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            // Expanded Details Section
            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    Text(
                        text = "System Prompt Blueprint:",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceContainerHigh
                    ) {
                        Text(
                            text = agent.systemPrompt,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(10.dp),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Tokens Streamed: ${agent.tokensUsed}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Temp: ${agent.temperature}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Action Buttons Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = onEditClick,
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit",
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Configure")
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Button(
                            onClick = onStatusToggle,
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            colors = if (agent.status == AgentStatus.RUNNING) {
                                ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            } else {
                                ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            }
                        ) {
                            Icon(
                                imageVector = if (agent.status == AgentStatus.RUNNING) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = "Toggle",
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (agent.status == AgentStatus.RUNNING) "Pause" else "Run")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: AgentStatus) {
    val (bgColor, textColor, label) = when (status) {
        AgentStatus.RUNNING -> Triple(
            MaterialTheme.colorScheme.primaryContainer,
            MaterialTheme.colorScheme.onPrimaryContainer,
            "RUNNING"
        )
        AgentStatus.IDLE -> Triple(
            MaterialTheme.colorScheme.secondaryContainer,
            MaterialTheme.colorScheme.onSecondaryContainer,
            "IDLE"
        )
        AgentStatus.PAUSED -> Triple(
            MaterialTheme.colorScheme.surfaceContainerHigh,
            MaterialTheme.colorScheme.onSurfaceVariant,
            "PAUSED"
        )
        AgentStatus.ERRORED -> Triple(
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer,
            "ERROR"
        )
    }

    Surface(
        shape = RoundedCornerShape(50),
        color = bgColor
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(textColor)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
        }
    }
}

private fun getAgentIcon(role: String): ImageVector {
    return when {
        role.contains("Code", ignoreCase = true) -> Icons.Default.Edit
        role.contains("Database", ignoreCase = true) -> Icons.Default.List
        role.contains("Security", ignoreCase = true) -> Icons.Default.Lock
        role.contains("Search", ignoreCase = true) -> Icons.Default.Search
        else -> Icons.Default.Shield
    }
}
