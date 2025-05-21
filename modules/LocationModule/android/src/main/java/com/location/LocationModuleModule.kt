package com.location

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener


@ReactModule(name = LocationModule.NAME)
class LocationModule(private val reactContext: ReactApplicationContext) :
  NativeLocationModuleSpec(reactContext) {

  private val locationManager: LocationManager by lazy {
    reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
  }

  private var locationPromise: Promise? = null
  private var permissionPromise: Promise? = null
  private val PERMISSION_REQUEST_CODE = 10001

  private val locationListener = object : LocationListener {
    override fun onLocationChanged(location: Location) {
      locationPromise?.let { promise ->
        val result = WritableNativeMap()
        result.putDouble("latitude", location.latitude)
        result.putDouble("longitude", location.longitude)
        result.putDouble("accuracy", location.accuracy.toDouble())
        result.putDouble("timestamp", location.time.toDouble())

        promise.resolve(result)
        locationPromise = null

        // Detener las actualizaciones de ubicación
        locationManager.removeUpdates(this)
      }
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {
      locationPromise?.let { promise ->
        promise.reject("PROVIDER_DISABLED", "Location provider is disabled")
        locationPromise = null
      }
    }
  }

  init {
    reactContext.addActivityEventListener(object : com.facebook.react.bridge.ActivityEventListener {
      override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: android.content.Intent?
      ) {}

      override fun onNewIntent(intent: android.content.Intent?) {}
    })
  }


  override fun getName(): String {
    return NAME
  }

  override fun requestLocationPermission(promise: Promise) {
    permissionPromise = promise

    val activity = reactContext.currentActivity

    if (activity == null) {
      promise.reject("ACTIVITY_NULL", "Activity doesn't exist")
      return
    }

    if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve("granted")
      return
    }

    if (activity is PermissionAwareActivity) {
      val permissionListener = PermissionListener { requestCode, permissions, grantResults ->
        if (requestCode == PERMISSION_REQUEST_CODE) {
          checkPermissionResult()
          true
        } else {
          false
        }
      }

      activity.requestPermissions(
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
        PERMISSION_REQUEST_CODE,
        permissionListener
      )
    } else {
      promise.reject("INVALID_ACTIVITY", "Activity is not PermissionAwareActivity")
    }
  }



  @SuppressLint("MissingPermission")
  override fun getCurrentLocation(promise: Promise) {
    if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("PERMISSION_DENIED", "Location permission not granted")
      return
    }

    locationPromise = promise

    val isGPSEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
    val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

    if (!isGPSEnabled && !isNetworkEnabled) {
      promise.reject("PROVIDER_DISABLED", "Location providers are disabled")
      return
    }

    // Intentar obtener la última ubicación conocida primero
    val lastKnownLocation = if (isGPSEnabled) {
      locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
    } else {
      locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
    }

    if (lastKnownLocation != null) {
      val result = WritableNativeMap()
      result.putDouble("latitude", lastKnownLocation.latitude)
      result.putDouble("longitude", lastKnownLocation.longitude)
      result.putDouble("accuracy", lastKnownLocation.accuracy.toDouble())
      result.putDouble("timestamp", lastKnownLocation.time.toDouble())

      promise.resolve(result)
      return
    }

    // Si no hay última ubicación conocida, solicitar actualizaciones
    if (isGPSEnabled) {
      locationManager.requestLocationUpdates(
        LocationManager.GPS_PROVIDER,
        0,
        0f,
        locationListener
      )
    } else if (isNetworkEnabled) {
      locationManager.requestLocationUpdates(
        LocationManager.NETWORK_PROVIDER,
        0,
        0f,
        locationListener
      )
    }
  }

  private fun checkPermissionResult() {
    permissionPromise?.let { promise ->
      when {
        ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED -> {
          promise.resolve("granted")
        }
        ActivityCompat.shouldShowRequestPermissionRationale(reactContext.currentActivity!!, Manifest.permission.ACCESS_FINE_LOCATION) -> {
          promise.resolve("denied")
        }
        else -> {
          promise.resolve("never_ask_again")
        }
      }
      permissionPromise = null
    }
  }

  companion object {
    const val NAME = "LocationModule"
  }
}
