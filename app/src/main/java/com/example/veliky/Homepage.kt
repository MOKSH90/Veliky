package com.example.veliky

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.example.veliky.widgets.*

@Composable
fun HomePage(
    userName: String = "Moksh",
    onCameraClick: () -> Unit = {},
    onVoiceClick: () -> Unit = {},
    onAlertClick: (String) -> Unit = {},
    onAssetClick: (String) -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var lastQuery by remember { mutableStateOf("") }
    var modelResponse by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun executeQuery(queryText: String) {
        val q = queryText.trim()
        if (q.isBlank()) return
        lastQuery = q
        searchQuery = ""
        isLoading = true
        errorMessage = null
        modelResponse = null

        coroutineScope.launch {
            val result = VelikyClient.sendQuery(q)
            isLoading = false
            if (result.isSuccess) {
                modelResponse = result.getOrNull()
            } else {
                errorMessage = result.exceptionOrNull()?.localizedMessage ?: "Failed to connect to model server"
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp)
        ) {
            // 1. Header (VELIKY • ON-PREMISE with Logo)
            item {
                VelikyHeader(userName = userName)
            }

            // 2. Search / Ask Bar
            item {
                SearchGoalBar(
                    query = searchQuery,
                    onQueryChange = { searchQuery = it },
                    isLoading = isLoading,
                    onSearchSubmit = { executeQuery(searchQuery) }
                )
            }

            // 2b. Live Model Response Card
            if (isLoading || modelResponse != null || errorMessage != null) {
                item {
                    ElevatedCard(
                        modifier = Modifier.fillMaxWidth(),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = CardDefaults.elevatedCardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Shield,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "MODEL RESPONSE",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                if (isLoading) {
                                    Text(
                                        text = "Connecting to laptop...",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                } else {
                                    Text(
                                        text = "Connected (${VelikyClient.serverHost})",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            if (lastQuery.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "“$lastQuery”",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            if (isLoading) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 12.dp)
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        strokeWidth = 2.dp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = "Processing query on sovereign model server...",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            } else if (modelResponse != null) {
                                Text(
                                    text = modelResponse ?: "",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            } else if (errorMessage != null) {
                                Text(
                                    text = "Error: $errorMessage\n\nEnsure laptop model server is running and IP matches in Connect tab (Current: ${VelikyClient.serverHost})",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }

            // 3. Quick Field Actions
            item {
                Column {
                    Text(
                        text = "QUICK FIELD ACTIONS",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.CameraAlt,
                            iconBgColor = MaterialTheme.colorScheme.primaryContainer,
                            iconTint = MaterialTheme.colorScheme.primary,
                            title = "Snap Asset",
                            subtitle = "Nameplate & OCR",
                            onClick = onCameraClick
                        )
                        ActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Mic,
                            iconBgColor = MaterialTheme.colorScheme.tertiaryContainer,
                            iconTint = MaterialTheme.colorScheme.tertiary,
                            title = "Voice Note",
                            subtitle = "Record Field Fix",
                            onClick = onVoiceClick
                        )
                    }
                }
            }

            // 4. Unprompted Sensor Alert Section
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "UNPROMPTED SENSOR ALERT",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    CriticalSensorAlertCard(
                        assetName = "Pump P-204",
                        issue = "Vibration Spike Detected",
                        detail = "Current: 8.4 mm/s (Limit: < 7.1 mm/s)",
                        onClick = { onAlertClick("P-204") }
                    )
                    ShiftHandoverCard(onClick = {})
                }
            }

            // 5. Active Plant Assets Section
            item {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ACTIVE PLANT ASSETS",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "3 Online",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        AssetCard(
                            name = "Pump P-204",
                            location = "Unit 4 · Sector B",
                            statusText = "Attention Needed",
                            isWarning = true,
                            onClick = { onAlertClick("P-204") }
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

            // 6. Connected Hardware Telemetry
            item {
                Column {
                    Text(
                        text = "CONNECTED WORKSTATION TELEMETRY",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    ConnectedHardwareCard()
                }
            }
        }
    }
}

@Composable
fun homeScreen() {
    HomePage()
}
