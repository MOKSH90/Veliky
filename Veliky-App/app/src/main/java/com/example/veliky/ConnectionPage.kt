package com.example.veliky

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.example.veliky.widgets.ConnectionHeader
import com.example.veliky.widgets.ConnectionStatusCard
import com.example.veliky.widgets.ManualKeycodeForm
import com.example.veliky.widgets.OfflineInfoBanner
import com.example.veliky.widgets.QrScanCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionPage(
    onScanQrClick: () -> Unit = {}
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var keycode by remember { mutableStateOf("") }
    var serverIp by remember { mutableStateOf(VelikyClient.serverHost) }
    var isConnected by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("Not connected yet") }

    LaunchedEffect(Unit) {
        val res = VelikyClient.ping()
        isConnected = res.isSuccess
        statusMessage = if (res.isSuccess) "Connected to server at $serverIp" else "Server unreachable: ${res.exceptionOrNull()?.localizedMessage}"
    }

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
                    onServerIpChange = {
                        serverIp = it
                        VelikyClient.saveServerHost(context, it)
                    },
                    onConnectClick = {
                        coroutineScope.launch {
                            VelikyClient.saveServerHost(context, serverIp)
                            val res = VelikyClient.ping()
                            isConnected = res.isSuccess
                            statusMessage = if (res.isSuccess) "Connected to server at $serverIp" else "Failed to connect: ${res.exceptionOrNull()?.localizedMessage}"
                        }
                    }
                )
            }

            // 4. Current Connection Status Card
            item {
                ConnectionStatusCard(
                    serverIp = serverIp,
                    onPingClick = {
                        coroutineScope.launch {
                            val res = VelikyClient.ping()
                            isConnected = res.isSuccess
                            statusMessage = if (res.isSuccess) "Ping successful! Server active." else "Ping failed: ${res.exceptionOrNull()?.localizedMessage}"
                        }
                    }
                )
            }
        }
    }
}
