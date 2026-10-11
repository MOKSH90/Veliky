package com.example.veliky

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.veliky.widgets.*

@Composable
fun HomePage(
    userName: String = "Moksh",
    onCameraClick: () -> Unit = {},
    onVoiceClick: () -> Unit = {},
    onAssetClick: (String) -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }

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
            // 1. Header (VELIKY • ON-PREMISE)
            item {
                VelikyHeader(userName = userName)
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

            // 4. Active Plant Assets Section
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
                            statusText = "Nominal",
                            isWarning = false,
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
}
