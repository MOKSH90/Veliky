package com.example.sentinel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.sentinel.widgets.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomePage(
    userName: String = "Moksh",
    onCameraClick: () -> Unit = {},
    onVoiceClick: () -> Unit = {},
    onAlertClick: (String) -> Unit = {},
    onAssetClick: (String) -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            SentinelHeader(userName = userName)
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
            // 1. Search / Goal Bar
            item {
                SearchGoalBar(
                    query = searchQuery,
                    onQueryChange = { searchQuery = it }
                )
            }

            // 2. Connected Hardware Telemetry
            item {
                Text(
                    text = "Connected Workstation",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                ConnectedHardwareCard()
            }

            // 3. Quick Actions
            item {
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.CameraAlt,
                        title = "Snap Tag",
                        subtitle = "Nameplate OCR",
                        onClick = onCameraClick
                    )
                    ActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Mic,
                        title = "Voice Note",
                        subtitle = "Record Fix",
                        onClick = onVoiceClick
                    )
                }
            }

            // 3. Proactive Sensor Alert Banner
            item {
                AlertBanner(
                    assetName = "Pump P-204",
                    issue = "Vibration Spike Detected (8.4 mm/s)",
                    limit = "Limit: < 7.1 mm/s",
                    onClick = { onAlertClick("P-204") }
                )
            }

            // 4. Shift Handover Briefing Banner
            item {
                ShiftHandoverCard(onClick = {})
            }

            // 5. Active Assets Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Active Equipment",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "3 Assets",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssetCard(
                        name = "Pump P-204",
                        location = "Unit 4 · Sector B",
                        statusText = "Attention Needed",
                        isWarning = true,
                        onClick = { onAssetClick("P-204") }
                    )
                    AssetCard(
                        name = "Compressor C-104",
                        location = "Unit 4 · Sector A",
                        statusText = "Nominal",
                        isWarning = false,
                        onClick = { onAssetClick("C-104") }
                    )
                    AssetCard(
                        name = "Heat Exchanger E-12",
                        location = "Unit 2 · Sector C",
                        statusText = "Nominal",
                        isWarning = false,
                        onClick = { onAssetClick("E-12") }
                    )
                }
            }
        }
    }
}

@Composable
fun homeScreen() {
    HomePage()
}
