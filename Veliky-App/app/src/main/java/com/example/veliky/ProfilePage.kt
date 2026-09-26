package com.example.veliky

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.veliky.widgets.ProfileHeader
import com.example.veliky.widgets.ProfileHeroCard
import com.example.veliky.widgets.ProfileSettingRow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfilePage(
    userName: String = "Moksh",
    userRole: String = "Field Engineer Specialist",
    userUnit: String = "Refinery Unit 4 · Sector B"
) {
    var offlineSyncEnabled by remember { mutableStateOf(true) }
    var autoModelRouting by remember { mutableStateOf(true) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            ProfileHeader()
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp)
        ) {
            // 1. User Profile Hero Card
            item {
                ProfileHeroCard(
                    userName = userName,
                    userRole = userRole,
                    userUnit = userUnit
                )
            }

            // 2. Sovereignty & Offline Storage Status Card
            item {
                Text(
                    text = "SOVEREIGNTY & STORAGE",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                ElevatedCard(
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ProfileSettingRow(
                            icon = Icons.Default.CloudOff,
                            title = "Local Offline Cache",
                            subtitle = "14 incident logs & local documents synced"
                        )
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        ProfileSettingRow(
                            icon = Icons.Default.Security,
                            title = "Data Boundary Promise",
                            subtitle = "Zero external API calls · 100% On-Premise LAN"
                        )
                    }
                }
            }

            // 3. System Preferences Card
            item {
                Text(
                    text = "SYSTEM PREFERENCES",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                ElevatedCard(
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Offline Priority Sync",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Pre-cache active plant asset documents for offline work",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = offlineSyncEnabled,
                                onCheckedChange = { offlineSyncEnabled = it }
                            )
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Auto Model Routing",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Automatically dispatch Vision & Code tasks to Ollama models",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = autoModelRouting,
                                onCheckedChange = { autoModelRouting = it }
                            )
                        }
                    }
                }
            }

            // 4. Session Action
            item {
                OutlinedButton(
                    onClick = { /* Clear local cache */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Clear Local Field Cache")
                }
            }
        }
    }
}
