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


const exportPlugin = `package ${packageName};

import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Base64;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.print.PrintJob;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
  @PluginMethod public void saveFile(PluginCall call) {
    String name=call.getString("name","DEEB-export.txt");
    String mime=call.getString("mimeType","application/octet-stream");
    String data=call.getString("base64","");
    try {
      byte[] bytes=Base64.decode(data,Base64.DEFAULT);
      ContentValues values=new ContentValues(); values.put(MediaStore.Downloads.DISPLAY_NAME,name); values.put(MediaStore.Downloads.MIME_TYPE,mime);
      if(Build.VERSION.SDK_INT>=29) values.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/DEEB");
      Uri uri=getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
      if(uri==null) throw new Exception("تعذر إنشاء الملف في التنزيلات");
      try(OutputStream out=getContext().getContentResolver().openOutputStream(uri)){ if(out==null) throw new Exception("تعذر فتح الملف للحفظ"); out.write(bytes); out.flush(); }
      JSObject result=new JSObject(); result.put("saved",true); result.put("name",name); call.resolve(result);
    } catch(Exception e){call.reject("تعذر حفظ الملف: "+e.getMessage(),e);}
  }
  @PluginMethod public void saveHtmlAsImages(PluginCall call) {
    final String html=call.getString("html","");
    final String requestedName=call.getString("name","DEEB-report");
    final String baseName=(requestedName==null||requestedName.trim().isEmpty()?"DEEB-report":requestedName.trim())
      .replace("/","_").replace("\\","_");
    if(html.trim().isEmpty()){call.reject("لا توجد بيانات لتحويلها إلى صور");return;}
    getActivity().runOnUiThread(()->{
      final WebView view=new WebView(getContext());
      final ViewGroup root=(ViewGroup)getActivity().getWindow().getDecorView();
      final Handler handler=new Handler(Looper.getMainLooper());
      final java.util.concurrent.atomic.AtomicBoolean finished=new java.util.concurrent.atomic.AtomicBoolean(false);
      final java.util.ArrayList<Uri> createdUris=new java.util.ArrayList<>();
      final Runnable cleanup=()->handler.post(()->{
        try{if(view.getParent() instanceof ViewGroup)((ViewGroup)view.getParent()).removeView(view);}catch(Exception ignored){}
        try{view.stopLoading();view.destroy();}catch(Exception ignored){}
      });
      final Runnable removePartialImages=()->{
        for(Uri uri:createdUris){try{getContext().getContentResolver().delete(uri,null,null);}catch(Exception ignored){}}
        createdUris.clear();
      };
      final class ImageExportFailure {
        void reject(String message){
          if(finished.compareAndSet(false,true)){
            handler.post(()->{removePartialImages.run();cleanup.run();call.reject(message);});
          }
        }
      }
      final ImageExportFailure fail=new ImageExportFailure();
      view.setBackgroundColor(Color.WHITE);
      view.setLayerType(View.LAYER_TYPE_SOFTWARE,null);
      view.setVerticalScrollBarEnabled(false);
      view.setHorizontalScrollBarEnabled(false);
      view.getSettings().setJavaScriptEnabled(true);
      root.addView(view,new FrameLayout.LayoutParams(794,1));
      view.setWebViewClient(new WebViewClient(){
        @Override public void onPageFinished(WebView v,String url){
          v.evaluateJavascript("(function(){function collectPrintRules(rules,out){for(var i=0;i<rules.length;i++){var rule=rules[i];if(rule.type===4&&/print/i.test(rule.conditionText||rule.media&&rule.media.mediaText||\"\")){collectPrintRules(rule.cssRules,out);}else if(rule.type===12&&rule.cssRules){collectPrintRules(rule.cssRules,out);}else if(rule.type!==6&&!rule.cssRules&&rule.cssText){out.push(rule.cssText);}}}var printRules=[];for(var s=0;s<document.styleSheets.length;s++){try{collectPrintRules(document.styleSheets[s].cssRules,printRules);}catch(e){}}if(printRules.length){var printStyle=document.createElement(\"style\");printStyle.setAttribute(\"data-deeb-print-rules\",\"true\");printStyle.textContent=printRules.join(\"\\n\");document.head.appendChild(printStyle);}return document.fonts&&document.fonts.ready?document.fonts.ready.then(function(){return Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);}):Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);})()",heightValue->{
            if(finished.get())return;
            try{
              String raw=heightValue==null?"":heightValue.replace("\"","").trim();
              int contentHeight=(int)Math.ceil(Double.parseDouble(raw));
              if(contentHeight<80)throw new Exception("تعذر قياس محتوى التقرير.");
              int pageCssHeight=(int)Math.round(794.0*297.0/210.0);
              int pageCount=(contentHeight+pageCssHeight-1)/pageCssHeight;
              if(pageCount<1)throw new Exception("التقرير لا يحتوي على صفحات.");
              if(pageCount>100)throw new Exception("التقرير يتجاوز 100 صفحة؛ قسّمه قبل حفظ الصور.");
              v.setLayoutParams(new FrameLayout.LayoutParams(794,contentHeight));
              v.measure(View.MeasureSpec.makeMeasureSpec(794,View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(contentHeight,View.MeasureSpec.EXACTLY));
              v.layout(0,0,794,contentHeight);
              int saved=0;
              for(int pageIndex=0;pageIndex<pageCount;pageIndex++){
                if(finished.get())return;
                int top=pageIndex*pageCssHeight;
                int width=1588,height=pageCssHeight*2;
                if(width<1||height<1||(long)width*height>12000000L)
                  throw new Exception("أبعاد صفحة التقرير أكبر من الحد الآمن للتحويل.");
                Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
                try{
                  bitmap.eraseColor(Color.WHITE);
                  Canvas canvas=new Canvas(bitmap);
                  canvas.scale(2f,2f);
                  canvas.translate(0,-top);
                  v.draw(canvas);
                  int nonWhite=0;
                  int stepX=Math.max(1,bitmap.getWidth()/256),stepY=Math.max(1,bitmap.getHeight()/256);
                  for(int y=0;y<bitmap.getHeight();y+=stepY){
                    for(int x=0;x<bitmap.getWidth();x+=stepX){
                      int pixel=bitmap.getPixel(x,y);
                      if(Color.red(pixel)<248||Color.green(pixel)<248||Color.blue(pixel)<248){nonWhite++;break;}
                    }
                    if(nonWhite>0)break;
                  }
                  if(nonWhite==0)throw new Exception("صفحة التقرير رقم "+(pageIndex+1)+" فارغة؛ تم إيقاف الحفظ.");
                  ContentValues values=new ContentValues();
                  values.put(MediaStore.Images.Media.DISPLAY_NAME,baseName+"-"+String.format(java.util.Locale.US,"%02d",pageIndex+1)+".png");
                  values.put(MediaStore.Images.Media.MIME_TYPE,"image/png");
                  if(Build.VERSION.SDK_INT>=29){
                    values.put(MediaStore.Images.Media.RELATIVE_PATH,Environment.DIRECTORY_PICTURES+"/DEEB");
                    values.put(MediaStore.Images.Media.IS_PENDING,1);
                  }
                  Uri uri=getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);
                  if(uri==null)throw new Exception("تعذر إنشاء صورة التقرير رقم "+(pageIndex+1));
                  createdUris.add(uri);
                  try(OutputStream imageOut=getContext().getContentResolver().openOutputStream(uri)){
                    if(imageOut==null||!bitmap.compress(Bitmap.CompressFormat.PNG,100,imageOut))
                      throw new Exception("تعذر كتابة صورة التقرير رقم "+(pageIndex+1));
                    imageOut.flush();
                  }catch(Exception writeError){
                    getContext().getContentResolver().delete(uri,null,null);
                    createdUris.remove(uri);
                    throw writeError;
                  }
                  if(Build.VERSION.SDK_INT>=29){
                    ContentValues readyValues=new ContentValues();
                    readyValues.put(MediaStore.Images.Media.IS_PENDING,0);
                    getContext().getContentResolver().update(uri,readyValues,null,null);
                  }
                  saved++;
                }finally{if(!bitmap.isRecycled())bitmap.recycle();}
              }
              if(saved<1)throw new Exception("لم يتم إنشاء أي صورة للتقرير.");
              if(finished.compareAndSet(false,true)){
                handler.removeCallbacksAndMessages(null);
                cleanup.run();
                JSObject result=new JSObject();
                result.put("count",saved);
                result.put("saved",true);
                result.put("format","A4");
                result.put("source","Android WebView page rasterizer");
                call.resolve(result);
              }
            }catch(Exception error){fail.reject("تعذر تحويل صفحات التقرير إلى صور: "+error.getMessage());}
          });
        }
        @Override public void onReceivedError(WebView v,android.webkit.WebResourceRequest request,android.webkit.WebResourceError error){
          if(request.isForMainFrame())fail.reject("تعذر تحميل التقرير قبل تحويله إلى صور.");
        }
      });
      view.loadDataWithBaseURL("https://localhost/",html,"text/html","UTF-8",null);
      handler.postDelayed(()->{
        if(!finished.get())fail.reject("انتهت مهلة تجهيز صور التقرير بعد 90 ثانية. حاول مرة أخرى.");
      },90000);
    });
  }
  @PluginMethod public void printHtml(PluginCall call) {
    final String html=call.getString("html","");
    if(html.trim().isEmpty()){call.reject("لا توجد بيانات للطباعة");return;}
    getActivity().runOnUiThread(()->{
      final java.util.concurrent.atomic.AtomicBoolean settled=new java.util.concurrent.atomic.AtomicBoolean(false);
      final java.util.concurrent.atomic.AtomicBoolean pageReady=new java.util.concurrent.atomic.AtomicBoolean(false);
      final Handler handler=new Handler(Looper.getMainLooper());
      final FrameLayout root=(FrameLayout)getActivity().findViewById(android.R.id.content);
      if(root==null){call.reject("تعذر الوصول إلى نافذة التطبيق لبدء الطباعة");return;}
      final WebView view=new WebView(getContext());
      final Runnable dispose=()->{
        try{view.stopLoading();if(view.getParent() instanceof ViewGroup)((ViewGroup)view.getParent()).removeView(view);view.destroy();}catch(Exception ignored){}
      };
      try {
        view.setBackgroundColor(Color.WHITE);
        view.setAlpha(1f);
        view.setFocusable(false);
        // Run the report print hook that enables page numbers only for multi-page reports.
        view.getSettings().setJavaScriptEnabled(true);
        root.addView(view,new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.MATCH_PARENT));
        view.setWebViewClient(new WebViewClient(){
          @Override public void onPageFinished(WebView v,String url){
            if(!pageReady.compareAndSet(false,true))return;
            v.postDelayed(()->{
              if(settled.get())return;
              try{
                int width=Math.max(1,root.getWidth()),height=Math.max(1,root.getHeight());
                v.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.AT_MOST));
                v.layout(0,0,width,Math.max(height,v.getMeasuredHeight()));
                PrintManager pm=(PrintManager)getContext().getSystemService(Context.PRINT_SERVICE);
                if(pm==null)throw new Exception("خدمة الطباعة غير متاحة على الجهاز");
                String jobName="DEEB-"+System.currentTimeMillis();
                PrintAttributes attributes=new PrintAttributes.Builder()
                  .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asPortrait())
                  .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                  .setResolution(new PrintAttributes.Resolution("DEEB","DEEB",300,300))
                  .build();
                PrintJob job=pm.print(jobName,v.createPrintDocumentAdapter(jobName),attributes);
                if(job==null)throw new Exception("لم يستطع أندرويد إنشاء مهمة الطباعة");
                if(settled.compareAndSet(false,true)){
                  JSObject result=new JSObject();result.put("started",true);result.put("orientation","portrait");result.put("jobName",jobName);call.resolve(result);
                  Runnable cleanup=new Runnable(){@Override public void run(){
                    if(job.isCompleted()||job.isCancelled()||job.isFailed()){dispose.run();}
                    else handler.postDelayed(this,1500);
                  }};
                  handler.postDelayed(cleanup,1500);
                }
              }catch(Exception e){if(settled.compareAndSet(false,true)){dispose.run();call.reject("تعذرت تهيئة الطباعة: "+e.getClass().getSimpleName()+": "+e.getMessage(),e);}}
            },700);
          }
          @Override public void onReceivedError(WebView v,android.webkit.WebResourceRequest request,android.webkit.WebResourceError error){
            if(request.isForMainFrame()&&settled.compareAndSet(false,true)){dispose.run();call.reject("تعذر تجهيز التقرير للطباعة: "+error.getDescription());}
          }
        });
        view.loadDataWithBaseURL("https://localhost/",html,"text/html","UTF-8",null);
        handler.postDelayed(()->{if(settled.compareAndSet(false,true)){dispose.run();call.reject("انتهت مهلة تجهيز التقرير للطباعة بعد 60 ثانية. تحقق من خدمة الطباعة وحاول مرة أخرى.");}},60000);
      }catch(Exception e){if(settled.compareAndSet(false,true)){dispose.run();call.reject("تعذرت الطباعة: "+e.getClass().getSimpleName()+": "+e.getMessage(),e);}}
    });
  }
}
`;
fs.writeFileSync(path.join(javaDir, "FileExportPlugin.java"), exportPlugin);

const locationPlugin = `package ${packageName};

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
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
    private boolean hasAnyLocationPermission() {
        return getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || getContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasPreciseLocationPermission() {
        return getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void getCurrentLocation(PluginCall call) {
        if (!hasAnyLocationPermission()) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }
        locate(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (!hasAnyLocationPermission()) {
            call.reject("إذن الموقع غير مفعّل. اختر السماح أثناء استخدام التطبيق من إعدادات الأذونات.");
            return;
        }
        locate(call);
    }

    @SuppressWarnings("MissingPermission")
    private void locate(PluginCall call) {
        LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        String provider = null;
        try {
            if (hasPreciseLocationPermission() && manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) provider = LocationManager.GPS_PROVIDER;
            else if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) provider = LocationManager.NETWORK_PROVIDER;
            else if (hasPreciseLocationPermission() && manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) provider = LocationManager.GPS_PROVIDER;
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
import org.json.JSONTokener;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareIntentPlugin.class);
        registerPlugin(CurrentLocationPlugin.class);
        registerPlugin(FileExportPlugin.class);
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
const applicationPattern = /<application[^>]*>/;
const applicationTag = manifest.match(applicationPattern)?.[0];
if (!applicationTag) throw new Error("Could not find Android application manifest element.");
for (const [attribute, value] of [["android:allowBackup", "false"], ["android:usesCleartextTraffic", "false"]]) {
  const attributePattern = new RegExp(attribute + '="[^"]*"');
  if (attributePattern.test(applicationTag)) {
    manifest = manifest.replace(applicationPattern, tag => tag.replace(attributePattern, attribute + '="' + value + '"'));
  } else {
    manifest = manifest.replace(applicationPattern, tag => tag.replace(/>$/, ' ' + attribute + '="' + value + '">'));
  }
}
for (const permission of ['android.permission.ACCESS_COARSE_LOCATION','android.permission.ACCESS_FINE_LOCATION']) {
  if (!manifest.includes('android:name="' + permission + '"')) {
    manifest = manifest.replace(/(<manifest\b[^>]*>)/, '$1\n    <uses-permission android:name="' + permission + '" />');
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
console.log("Configured DEEBO Android WhatsApp sharing and runtime current-location access.");
