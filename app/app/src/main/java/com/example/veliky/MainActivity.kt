package com.example.veliky

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.example.veliky.ui.theme.VelikyTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VelikyTheme {
                HomePage()
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun HomePagePreview() {
    VelikyTheme {
        HomePage()
    }
}
