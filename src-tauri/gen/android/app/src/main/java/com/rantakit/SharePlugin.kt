package com.rantakit

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.core.content.IntentCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Channel
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class ListenArgs {
  lateinit var handler: Channel
}

/**
 * Photos and PDFs shared to Rantakit from another app's share sheet. Their
 * `content://` addresses wait here until the frontend takes them, so a share
 * that opens the app is not lost before the page has loaded. The sharing app
 * grants reading them for as long as Rantakit's task lives.
 */
@TauriPlugin
class SharePlugin(private val activity: Activity) : Plugin(activity) {
  private val waiting = mutableListOf<String>()
  private var listener: Channel? = null

  /** A share that started the app. */
  override fun load(webView: WebView) {
    receive(activity.intent)
  }

  /** A share while the app was already running. */
  override fun onNewIntent(intent: Intent) {
    receive(intent)
  }

  private fun receive(intent: Intent?) {
    val uris = when (intent?.action) {
      Intent.ACTION_SEND ->
        listOfNotNull(IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java))
      Intent.ACTION_SEND_MULTIPLE ->
        IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri::class.java).orEmpty()
      else -> emptyList()
    }
    if (uris.isEmpty()) return
    // Taken once: the same intent is not shared again later.
    intent?.action = Intent.ACTION_MAIN
    synchronized(waiting) { waiting += uris.map { it.toString() } }
    listener?.send(JSObject())
  }

  /** Rust's channel, told each time files arrive. */
  @Command
  fun listen(invoke: Invoke) {
    listener = invoke.parseArgs(ListenArgs::class.java).handler
    invoke.resolve()
  }

  /** The files shared since the last call, as `content://` addresses. */
  @Command
  fun take(invoke: Invoke) {
    val uris = synchronized(waiting) { waiting.toList().also { waiting.clear() } }
    invoke.resolve(JSObject().apply { put("uris", JSArray(uris)) })
  }
}
