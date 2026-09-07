package com.example.sentinel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.sentinel.widgets.ConnectionHeader
import com.example.sentinel.widgets.ConnectionStatusCard
import com.example.sentinel.widgets.ManualKeycodeForm
import com.example.sentinel.widgets.OfflineInfoBanner
import com.example.sentinel.widgets.QrScanCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionPage(
    onScanQrClick: () -> Unit = {}
) {
    var keycode by remember { mutableStateOf("") }
    var serverIp by remember { mutableStateOf("192.168.1.105:8000") }
    var isConnected by remember { mutableStateOf(false) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            ConnectionHeader(isConnected = isConnected)
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 12.dp, bottom = 32.dp)
        ) {
            // 1. Offline LAN Explanation Banner
            item {
                OfflineInfoBanner()
            }

            // 2. Scan Web QR Code Card
            item {
                QrScanCard(onClick = onScanQrClick)
            }

            // 3. Manual Pair Keycode & IP Section
            item {
                ManualKeycodeForm(
                    keycode = keycode,
                    onKeycodeChange = { keycode = it.uppercase() },
                    serverIp = serverIp,
                    onServerIpChange = { serverIp = it },
                    onConnectClick = { isConnected = true }
                )
            }

            // 4. Current Connection Status Card
            item {
                ConnectionStatusCard(
                    serverIp = serverIp,
                    onPingClick = { isConnected = true }
                )
            }
        }
    }
}
