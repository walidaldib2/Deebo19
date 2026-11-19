const fs = require("fs");
const path = require("path");

const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
const packageName = config.appId;
if (!packageName || !/^[A-Za-z0-9_.]+$/.test(packageName)) {
  throw new Error("Invalid appId in capacitor.config.json");
}
const packagePath = packageName.split(".").join(path.sep);
const javaDir = path.join(root, "android", "app", "src", "main", "java", packagePath);
const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
if (!fs.existsSync(manifestPath)) throw new Error("AndroidManifest.xml not found. Run cap add and cap sync first.");
fs.mkdirSync(javaDir, { recursive: true });

const plugin = `package ${packageName};

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShareIntent")
public class ShareIntentPlugin extends Plugin {
    @PluginMethod
    public void getInitialShare(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("deboo16_share", Context.MODE_PRIVATE);
        String text = prefs.getString("pending_text", "");
        prefs.edit().remove("pending_text").apply();
        JSObject result = new JSObject();
        result.put("text", text);
        call.resolve(result);
    }
}
`;
fs.writeFileSync(path.join(javaDir, "ShareIntentPlugin.java"), plugin);

const locationPlugin = `package ${packageName};

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "CurrentLocation", permissions = {
    @Permission(alias = "location", strings = {
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    })
})
public class CurrentLocationPlugin extends Plugin {
    @PluginMethod
    public void getCurrentLocation(PluginCall call) {
        if (!hasPermission("location")) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }
        locate(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (!hasPermission("location")) {
            call.reject("لم يتم منح إذن الوصول إلى الموقع.");
            return;
        }
        locate(call);
    }

    @SuppressWarnings("MissingPermission")
    private void locate(PluginCall call) {
        LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        String provider = null;
        try {
            if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) provider = LocationManager.GPS_PROVIDER;
            else if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) provider = LocationManager.NETWORK_PROVIDER;
        } catch (Exception ignored) {}
        if (provider == null) {
            call.reject("فعّل خدمة الموقع GPS من إعدادات الجهاز.");
            return;
        }

        final String selectedProvider = provider;
        final Handler handler = new Handler(Looper.getMainLooper());
        final LocationListener[] holder = new LocationListener[1];
        final boolean[] finished = {false};
        Runnable timeout = () -> {
            if (finished[0]) return;
            finished[0] = true;
            if (holder[0] != null) manager.removeUpdates(holder[0]);
            call.reject("انتهت مهلة تحديد الموقع. حاول مرة أخرى في مكان مفتوح.");
        };
        holder[0] = new LocationListener() {
            @Override public void onLocationChanged(Location location) {
                if (finished[0]) return;
                finished[0] = true;
                handler.removeCallbacks(timeout);
                manager.removeUpdates(this);
                JSObject result = new JSObject();
                result.put("latitude", location.getLatitude());
                result.put("longitude", location.getLongitude());
                result.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : 0);
                call.resolve(result);
            }
            @Override public void onProviderEnabled(String name) {}
            @Override public void onProviderDisabled(String name) {}
            @Override public void onStatusChanged(String providerName, int status, Bundle extras) {}
        };
        try {
            manager.requestSingleUpdate(selectedProvider, holder[0], Looper.getMainLooper());
            handler.postDelayed(timeout, 20000);
        } catch (Exception error) {
            finished[0] = true;
            call.reject("تعذر بدء تحديد الموقع: " + error.getMessage());
        }
    }
}
`;
fs.writeFileSync(path.join(javaDir, "CurrentLocationPlugin.java"), locationPlugin);

const activity = `package ${packageName};

import android.content.Intent;
import android.os.Bundle;
import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareIntentPlugin.class);
        registerPlugin(CurrentLocationPlugin.class);
        super.onCreate(savedInstanceState);
        captureSharedText(getIntent(), false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureSharedText(intent, true);
    }

    private void captureSharedText(Intent intent, boolean dispatchToWeb) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null) {
            CharSequence value = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (value != null) text = value.toString();
        }
        if (text == null || text.trim().isEmpty()) {
            CharSequence subject = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
            if (subject != null) text = subject.toString();
        }
        if (text == null || text.trim().isEmpty()) return;

        SharedPreferences prefs = getSharedPreferences("deboo16_share", Context.MODE_PRIVATE);
        prefs.edit().putString("pending_text", text).apply();

        if (dispatchToWeb && getBridge() != null && getBridge().getWebView() != null) {
            String js = "window.dispatchEvent(new CustomEvent('deboo-share-intent',{detail:{text:"
                + JSONObject.quote(text) + "}}));";
            getBridge().getWebView().evaluateJavascript(js, null);
        }
    }
}
`;
fs.writeFileSync(path.join(javaDir, "MainActivity.java"), activity);

let manifest = fs.readFileSync(manifestPath, "utf8");
for (const permission of ['android.permission.ACCESS_COARSE_LOCATION','android.permission.ACCESS_FINE_LOCATION']) {
  if (!manifest.includes('android:name="' + permission + '"')) {
    manifest = manifest.replace(/(<manifest\\b[^>]*>)/, '$1\\n    <uses-permission android:name="' + permission + '" />');
  }
}

const activityPattern = /(<activity\b(?=[^>]*android:name="[^"]*MainActivity")[\s\S]*?)(<\/activity>)/;
if (!activityPattern.test(manifest)) throw new Error("Could not find the Capacitor MainActivity in AndroidManifest.xml");
const block = manifest.match(activityPattern)[0];
if (!block.includes('android.intent.action.SEND')) {
  manifest = manifest.replace(activityPattern, (whole, openAndBody, close) =>
    openAndBody + `
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>
        ` + close
  );
}
fs.writeFileSync(manifestPath, manifest);
console.log("Configured DEBOO16 Android WhatsApp sharing and runtime current-location access.");
