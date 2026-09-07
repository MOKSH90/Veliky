package com.example.sentinel.widgets

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Router
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionHeader(isConnected: Boolean) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "System Connection",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Pair with local Sentinel Server",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        actions = {
            AssistChip(
                onClick = {},
                label = { Text(if (isConnected) "CONNECTED" else "OFFLINE") },
                leadingIcon = {
                    Icon(
                        imageVector = if (isConnected) Icons.Default.Wifi else Icons.Default.WifiOff,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp)
                    )
                }
            )
        },
        windowInsets = WindowInsets(0.dp),
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun OfflineInfoBanner() {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Default.Router,
                contentDescription = "Router",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Local Network Connection",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "No internet required. Connects directly to the system server on your local Wi-Fi / LAN network.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun QrScanCard(onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.QrCodeScanner,
                contentDescription = "Scan QR",
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = "Scan Web QR Code",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Scan code displayed on webpage to pair",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
fun ManualKeycodeForm(
    keycode: String,
    onKeycodeChange: (String) -> Unit,
    serverIp: String,
    onServerIpChange: (String) -> Unit,
    onConnectClick: () -> Unit
) {
    ElevatedCard(
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Manual Pairing",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            OutlinedTextField(
                value = keycode,
                onValueChange = onKeycodeChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Connection Keycode") },
                placeholder = { Text("e.g. SENTINEL-8F92") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Key,
                        contentDescription = "Key"
                    )
                },
                singleLine = true
            )

            OutlinedTextField(
                value = serverIp,
                onValueChange = onServerIpChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Server Local IP") },
                placeholder = { Text("e.g. 192.168.1.105:8000") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Router,
                        contentDescription = "IP"
                    )
                },
                singleLine = true
            )

            Button(
                onClick = onConnectClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Connect to Server")
            }
        }
    }
}

@Composable
fun ConnectionStatusCard(
    serverIp: String,
    onPingClick: () -> Unit
) {
    OutlinedCard(
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Connected",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Active Connection",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
                IconButton(onClick = onPingClick) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Ping Test"
                    )
                }
            }

            Text(
                text = "Server: http://$serverIp",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Latency: 4ms · Local Area Network",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
