package com.rantakit

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

/** The progress and done notifications, in the words Rust sends. */
object TaskNotices {
  const val PROGRESS_ID = 1
  const val DONE_ID = 2
  private const val RUNNING_CHANNEL = "running"
  private const val FINISHED_CHANNEL = "finished"

  /** Whether a Task is running; the service stops itself once it is not. */
  var running = false
  private var title = ""
  /** How far the Task is, out of 1000. */
  private var value = 0

  /**
   * Running Tasks are quiet; a finished one makes the phone's usual sound.
   * The names are what the phone's Settings list; creating a channel again
   * only renames it.
   */
  fun channels(context: Context, runningName: String, finishedName: String) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(
      NotificationChannel(RUNNING_CHANNEL, runningName, NotificationManager.IMPORTANCE_LOW)
    )
    manager.createNotificationChannel(
      NotificationChannel(FINISHED_CHANNEL, finishedName, NotificationManager.IMPORTANCE_DEFAULT)
    )
  }

  fun update(title: String, value: Int) {
    this.title = title
    this.value = value
  }

  /** "Kompres Foto · 3 dari 12 file", with a progress bar and no buttons. */
  fun progress(context: Context): Notification =
    NotificationCompat.Builder(context, RUNNING_CHANNEL)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(title)
      .setProgress(1000, value, false)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setContentIntent(openApp(context))
      .build()

  /** "Selesai · 12 file hasil di Download/Rantakit"; tapping it shows the Result. */
  fun done(context: Context, title: String): Notification =
    NotificationCompat.Builder(context, FINISHED_CHANNEL)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(title)
      .setAutoCancel(true)
      .setContentIntent(openApp(context))
      .build()

  /** Brings Rantakit back as it was left, on the Task's Tool page or Result. */
  private fun openApp(context: Context): PendingIntent {
    val intent = Intent(context, MainActivity::class.java)
      .setAction(Intent.ACTION_MAIN)
      .addCategory(Intent.CATEGORY_LAUNCHER)
    return PendingIntent.getActivity(
      context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }

  /** Posts a notification; without the permission Android hides it and the Task goes on. */
  fun post(context: Context, id: Int, notification: Notification) {
    context.getSystemService(NotificationManager::class.java).notify(id, notification)
  }

  fun cancel(context: Context, id: Int) {
    context.getSystemService(NotificationManager::class.java).cancel(id)
  }
}

@InvokeArg
class StartArgs {
  lateinit var title: String
  var value: Int = 0
  lateinit var runningChannel: String
  lateinit var finishedChannel: String
}

@InvokeArg
class ProgressArgs {
  lateinit var title: String
  var value: Int = 0
}

@InvokeArg
class FinishArgs {
  lateinit var title: String
}

/**
 * Runs each Task in [TaskService] with a progress notification, and asks for
 * the notification permission. Rust calls it as the Task goes; every command
 * runs on the main thread, where the service's callbacks also run.
 */
@TauriPlugin(
  permissions = [
    Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications")
  ]
)
class TaskPlugin(private val activity: Activity) : Plugin(activity) {
  private val main = Handler(Looper.getMainLooper())
  private val prefs = activity.getSharedPreferences("tasks", Context.MODE_PRIVATE)

  /** Starts the service; Rust calls it while the app is on screen, as Android 12 and later require. */
  @Command
  fun start(invoke: Invoke) {
    val args = invoke.parseArgs(StartArgs::class.java)
    main.post {
      TaskNotices.channels(activity, args.runningChannel, args.finishedChannel)
      TaskNotices.cancel(activity, TaskNotices.DONE_ID)
      TaskNotices.running = true
      TaskNotices.update(args.title, args.value)
      if (TaskService.instance != null) {
        TaskNotices.post(activity, TaskNotices.PROGRESS_ID, TaskNotices.progress(activity))
      } else {
        ContextCompat.startForegroundService(activity, Intent(activity, TaskService::class.java))
      }
      invoke.resolve()
    }
  }

  @Command
  fun progress(invoke: Invoke) {
    val args = invoke.parseArgs(ProgressArgs::class.java)
    main.post {
      if (TaskNotices.running) {
        TaskNotices.update(args.title, args.value)
        if (TaskService.instance != null) {
          TaskNotices.post(activity, TaskNotices.PROGRESS_ID, TaskNotices.progress(activity))
        }
      }
      invoke.resolve()
    }
  }

  /** Stops the service. If Rantakit is out of sight, "Selesai" is posted in its place. */
  @Command
  fun finish(invoke: Invoke) {
    val args = invoke.parseArgs(FinishArgs::class.java)
    main.post {
      TaskNotices.running = false
      TaskService.instance?.stop()
      val onScreen = ProcessLifecycleOwner.get().lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)
      if (!onScreen) {
        TaskNotices.post(activity, TaskNotices.DONE_ID, TaskNotices.done(activity, args.title))
      }
      invoke.resolve()
    }
  }

  /** Coming back to Rantakit shows the Result, so "Selesai" has done its job. */
  override fun onResume(activity: AppCompatActivity) {
    TaskNotices.cancel(activity, TaskNotices.DONE_ID)
  }

  /**
   * "granted", "ask", or "refused". Android 12 and earlier need no permission;
   * later versions are asked once, at the first Task.
   */
  @Command
  fun notificationPermission(invoke: Invoke) {
    val state = when {
      Build.VERSION.SDK_INT < 33 -> "granted"
      getPermissionState("notifications") == PermissionState.GRANTED -> "granted"
      prefs.getBoolean(ASKED, false) -> "refused"
      else -> "ask"
    }
    invoke.resolve(JSObject().apply { put("state", state) })
  }

  /** Shows Android's prompt, once; resolves with `granted`. */
  @Command
  fun askNotificationPermission(invoke: Invoke) {
    prefs.edit().putBoolean(ASKED, true).apply()
    requestPermissionForAlias("notifications", invoke, "notificationPermissionAnswered")
  }

  @PermissionCallback
  private fun notificationPermissionAnswered(invoke: Invoke) {
    val granted = getPermissionState("notifications") == PermissionState.GRANTED
    invoke.resolve(JSObject().apply { put("granted", granted) })
  }

  private companion object {
    const val ASKED = "notificationPermissionAsked"
  }
}
