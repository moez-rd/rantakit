package com.rantakit

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import org.json.JSONObject

@InvokeArg
class LatestArgs {
  lateinit var url: String
}

/**
 * "Versi baru" for the APK from GitHub: reads the version in the latest
 * release's `latest.json`. The request carries nothing about the user or
 * their files (ADR 0001), and Rantakit never downloads the APK itself.
 */
@TauriPlugin
class UpdatePlugin(activity: Activity) : Plugin(activity) {
  /** Off the main thread, where Android forbids network calls. */
  @Command
  fun latestVersion(invoke: Invoke) {
    val url = invoke.parseArgs(LatestArgs::class.java).url
    thread {
      try {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 10_000
        connection.readTimeout = 10_000
        // Android's own would name the phone's model and Android version.
        connection.setRequestProperty("User-Agent", "Rantakit")
        try {
          if (connection.responseCode != HttpURLConnection.HTTP_OK) {
            throw IOException("HTTP ${connection.responseCode}")
          }
          val text = connection.inputStream.bufferedReader().use { it.readText() }
          invoke.resolve(JSObject().apply { put("version", JSONObject(text).getString("version")) })
        } finally {
          connection.disconnect()
        }
      } catch (e: Exception) {
        invoke.reject(e.message ?: "update check failed")
      }
    }
  }
}
