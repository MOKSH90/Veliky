package com.example.sentinel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.sentinel.widgets.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentStudioPage(
    onSpawnAgentClick: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("All") }

    // Mock initial agents list
    var agents by remember {
        mutableStateOf(
            listOf(
                AgentItem(
                    id = "1",
                    name = "Code Researcher",
                    role = "Code Search & AST Parser",
                    model = "Qwen-2.5-Coder",
                    status = AgentStatus.RUNNING,
                    capabilities = listOf("Terminal", "File Read", "Grep"),
                    systemPrompt = "Perform deep semantic searches across local repository codebase and trace symbol definitions.",
                    temperature = 0.2f,
                    tokensUsed = "14.2k"
                ),
                AgentItem(
                    id = "2",
                    name = "Database Optimizer",
                    role = "Database & Query Tuning",
                    model = "DeepSeek-R1",
                    status = AgentStatus.IDLE,
                    capabilities = listOf("File Write", "SQL Inspect", "Migration"),
                    systemPrompt = "Audit SQLite and PostgreSQL query plans to eliminate bottlenecks and N+1 query patterns.",
                    temperature = 0.5f,
                    tokensUsed = "8.1k"
                ),
                AgentItem(
                    id = "3",
                    name = "Security Auditor",
                    role = "Vulnerability & AST Scan",
                    model = "Llama-3.3-70B",
                    status = AgentStatus.RUNNING,
                    capabilities = listOf("Dependency Audit", "SAST", "Secret Scan"),
                    systemPrompt = "Scan local codebase for hardcoded API keys, exposed endpoints, and insecure dependency vulnerabilities.",
                    temperature = 0.1f,
                    tokensUsed = "3.8k"
                ),
                AgentItem(
                    id = "4",
                    name = "Compose UI Refactoring Agent",
                    role = "Android Layout Specialist",
                    model = "Qwen-2.5-Coder",
                    status = AgentStatus.PAUSED,
                    capabilities = listOf("Compose Layout", "Material 3", "Diff Apply"),
                    systemPrompt = "Refactor Jetpack Compose composables to follow strict Material 3 design guidelines and eliminate recomposition overhead.",
                    temperature = 0.4f,
                    tokensUsed = "0"
                )
            )
        )
    }

    val filteredAgents = remember(selectedFilter, agents) {
        when (selectedFilter.lowercase()) {
            "running" -> agents.filter { it.status == AgentStatus.RUNNING }
            "idle" -> agents.filter { it.status == AgentStatus.IDLE }
            "paused" -> agents.filter { it.status == AgentStatus.PAUSED }
            else -> agents
        }
    }

    val activeCount = remember(agents) {
        agents.count { it.status == AgentStatus.RUNNING }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            AgentStudioHeader(
                totalAgents = agents.size,
                activeCount = activeCount
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onSpawnAgentClick,
                icon = { Icon(Icons.Default.Add, contentDescription = "Spawn Agent") },
                text = { Text("Spawn Agent") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 80.dp)
        ) {
            // Filter Bar
            item {
                AgentFilterBar(
                    selectedFilter = selectedFilter,
                    onFilterSelected = { selectedFilter = it }
                )
            }

            // Agents List Title
            item {
                Text(
                    text = "Subagent Personas (${filteredAgents.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // List of Agent Cards
            items(filteredAgents, key = { it.id }) { agent ->
                AgentCard(
                    agent = agent,
                    onStatusToggle = {
                        agents = agents.map { item ->
                            if (item.id == agent.id) {
                                val nextStatus = if (item.status == AgentStatus.RUNNING) AgentStatus.PAUSED else AgentStatus.RUNNING
                                item.copy(status = nextStatus)
                            } else item
                        }
                    },
                    onEditClick = {
                        // Open configuration dialog
                    }
                )
            }
        }
    }
}
