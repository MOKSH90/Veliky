package com.example.sentinel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sentinel.widgets.*

@Composable
fun HomePage(
    userName: String = "Moksh",
    onCameraClick: () -> Unit = {},
    onVoiceClick: () -> Unit = {},
    onAlertClick: (String) -> Unit = {},
    onAssetClick: (String) -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F14))
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp)
        ) {
            // 1. Header (SENTINEL • ON-PREMISE)
            item {
                SentinelHeader(userName = userName)
            }

            // 2. Search / Ask Bar
            item {
                SearchGoalBar(
                    query = searchQuery,
                    onQueryChange = { searchQuery = it }
                )
            }

            // 3. Quick Field Actions
            item {
                Column {
                    Text(
                        text = "QUICK FIELD ACTIONS",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF64748B),
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
                            iconBgColor = Color(0xFF0E3A43),
                            iconTint = Color(0xFF00E5FF),
                            title = "Snap Asset",
                            subtitle = "Nameplate & OCR",
                            onClick = onCameraClick
                        )
                        ActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Mic,
                            iconBgColor = Color(0xFF3B2F10),
                            iconTint = Color(0xFFFFB800),
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
                        color = Color(0xFF64748B),
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
                            color = Color(0xFF64748B),
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "3 Online",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00E5FF)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
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

            // 6. Connected Hardware Telemetry
            item {
                Column {
                    Text(
                        text = "CONNECTED WORKSTATION TELEMETRY",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF64748B),
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
