package com.example.veliky

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object VelikyClient {
    private const val PREFS_NAME = "veliky_client_prefs"
    private const val KEY_SERVER_HOST = "server_host"

    // Default to current host local IP and model port
    var serverHost: String = "10.8.3.148:8000"

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        serverHost = prefs.getString(KEY_SERVER_HOST, "10.8.3.148:8000") ?: "10.8.3.148:8000"
    }

    fun saveServerHost(context: Context, host: String) {
        serverHost = host.trim()
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_SERVER_HOST, serverHost).apply()
    }

    /**
     * Test connection to server /health or /v1/models
     */
    suspend fun ping(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val cleanHost = serverHost.removePrefix("http://").removePrefix("https://").trimEnd('/')
            val endpoint = "http://$cleanHost/health"
            val url = URL(endpoint)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 3000
                readTimeout = 3000
                requestMethod = "GET"
            }
            val code = conn.responseCode
            if (code in 200..299) {
                Result.success("Connected ($code OK)")
            } else {
                // Try fallback to /v1/models
                val modelUrl = URL("http://$cleanHost/v1/models")
                val mConn = (modelUrl.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 3000
                    readTimeout = 3000
                    requestMethod = "GET"
                }
                val mCode = mConn.responseCode
                if (mCode in 200..299) {
                    Result.success("Connected to Model Server ($mCode OK)")
                } else {
                    Result.failure(Exception("HTTP $code from server"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Send user query to OpenAI-compatible /v1/chat/completions endpoint
     */
    suspend fun sendQuery(
        prompt: String,
        model: String = "Qwen/Qwen2.5-1.5B-Instruct"
    ): Result<String> = withContext(Dispatchers.IO) {
        var conn: HttpURLConnection? = null
        try {
            val cleanHost = serverHost.removePrefix("http://").removePrefix("https://").trimEnd('/')
            val endpoint = "http://$cleanHost/v1/chat/completions"
            val url = URL(endpoint)

            conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15000
                readTimeout = 180000 // 3 min timeout for local LLM inference
                doOutput = true
                doInput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            val body = JSONObject().apply {
                put("model", model)
                put("messages", JSONArray().apply {
                    put(JSONObject().apply {
                        put("role", "system")
                        put("content", "You are VELIKY Sovereign Agent, an industrial reliability and on-premise AI assistant. Provide high-signal, accurate, evidence-backed answers.")
                    })
                    put(JSONObject().apply {
                        put("role", "user")
                        put("content", prompt)
                    })
                })
                put("temperature", 0.2)
                put("max_tokens", 1024)
            }

            OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                writer.write(body.toString())
                writer.flush()
            }

            val responseCode = conn.responseCode
            val inputStream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
            val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
            val responseText = reader.use { it.readText() }

            if (responseCode in 200..299) {
                val json = JSONObject(responseText)
                val choices = json.getJSONArray("choices")
                if (choices.length() > 0) {
                    val message = choices.getJSONObject(0).getJSONObject("message")
                    val content = message.getString("content")
                    Result.success(content)
                } else {
                    Result.failure(Exception("Empty choices in response"))
                }
            } else {
                Result.failure(Exception("Server returned HTTP $responseCode: $responseText"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            conn?.disconnect()
        }
    }

    /**
     * Send full conversation history to OpenAI-compatible /v1/chat/completions endpoint
     */
    suspend fun sendChat(
        messages: List<AppChatMessage>,
        model: String = "Qwen/Qwen2.5-1.5B-Instruct"
    ): Result<String> = withContext(Dispatchers.IO) {
        var conn: HttpURLConnection? = null
        try {
            val cleanHost = serverHost.removePrefix("http://").removePrefix("https://").trimEnd('/')
            val endpoint = "http://$cleanHost/v1/chat/completions"
            val url = URL(endpoint)

            conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15000
                readTimeout = 180000 // 3 min timeout for local inference
                doOutput = true
                doInput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            val jsonMessages = JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "system")
                    put("content", "You are VELIKY Sovereign Agent, an industrial reliability and on-premise AI assistant. Provide high-signal, accurate, evidence-backed answers.")
                })
                for (m in messages) {
                    put(JSONObject().apply {
                        put("role", if (m.isUser) "user" else "assistant")
                        put("content", m.text)
                    })
                }
            }

            val body = JSONObject().apply {
                put("model", model)
                put("messages", jsonMessages)
                put("temperature", 0.2)
                put("max_tokens", 1024)
            }

            OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                writer.write(body.toString())
                writer.flush()
            }

            val responseCode = conn.responseCode
            val inputStream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
            val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
            val responseText = reader.use { it.readText() }

            if (responseCode in 200..299) {
                val json = JSONObject(responseText)
                val choices = json.getJSONArray("choices")
                if (choices.length() > 0) {
                    val message = choices.getJSONObject(0).getJSONObject("message")
                    val content = message.getString("content")
                    Result.success(content)
                } else {
                    Result.failure(Exception("Empty choices in response"))
                }
            } else {
                Result.failure(Exception("Server returned HTTP $responseCode: $responseText"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            conn?.disconnect()
        }
    }
}

data class AppChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val text: String,
    val isUser: Boolean,
    val timestamp: String = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
)
