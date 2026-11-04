package com.rantakit

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.ServiceCompat

/**
 * Keeps Rantakit running while a Task works, so it finishes when the user
 * switches apps. The Task itself runs in Rust; this service only holds the
 * progress notification that [TaskPlugin] keeps up to date. Every call runs
 * on the main thread.
 */
class TaskService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Android 15 and later have a type for processing media files; before
    // that, data sync is the type for processing local files.
    val type = when {
      Build.VERSION.SDK_INT >= 35 -> ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING
      Build.VERSION.SDK_INT >= 29 -> ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
      else -> 0
    }
    // A service started in the foreground must show its notification, even
    // when the Task has already finished. Called directly: `ServiceCompat`
    // drops the media processing type, which is newer than it.
    val notification = TaskNotices.progress(this)
    if (Build.VERSION.SDK_INT >= 29) {
      startForeground(TaskNotices.PROGRESS_ID, notification, type)
    } else {
      startForeground(TaskNotices.PROGRESS_ID, notification)
    }
    instance = this
    if (!TaskNotices.running) stop()
    // A Task cut short by Android is not started again.
    return START_NOT_STICKY
  }

  /** Android 15 and later stop a long-running service after some hours. */
  override fun onTimeout(startId: Int, fgsType: Int) = stop()

  fun stop() {
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    stopSelf()
    instance = null
  }

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  companion object {
    /** The running service, once it has shown its notification. */
    var instance: TaskService? = null
  }
}
