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

import android.Manifest;
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
import android.print.PrintManager;\nimport android.print.PrintDocumentInfo;\nimport android.os.CancellationSignal;\nimport android.os.ParcelFileDescriptor;\nimport android.graphics.pdf.PdfRenderer;
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
import java.io.File;
import java.io.FileOutputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

@CapacitorPlugin(name = "FileExport", permissions = {
  @com.getcapacitor.annotation.Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
})
public class FileExportPlugin extends Plugin {
  @PluginMethod public void saveFile(PluginCall call) {
    if (Build.VERSION.SDK_INT < 29 &&
        getContext().checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
      requestPermissionForAlias("legacyStorage", call, "legacyStoragePermissionCallback");
      return;
    }
    saveFileInternal(call);
  }

  @com.getcapacitor.annotation.PermissionCallback
  private void legacyStoragePermissionCallback(PluginCall call) {
    if (Build.VERSION.SDK_INT < 29 &&
        getContext().checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
      call.reject("إذن التخزين مطلوب لحفظ الملف على إصدارات أندرويد القديمة.");
      return;
    }
    saveFileInternal(call);
  }

  private void saveFileInternal(PluginCall call) {
    String name=call.getString("name","DEEB-export.txt");
    if(name==null||name.trim().isEmpty()) name="DEEB-export.txt";
    name=name.replace("/","_").replace(String.valueOf((char)92),"_");
    String mime=call.getString("mimeType","application/octet-stream");
    String data=call.getString("base64","");
    Uri insertedUri=null;
    File legacyFile=null;
    try {
      byte[] bytes=Base64.decode(data,Base64.DEFAULT);
      if (Build.VERSION.SDK_INT >= 29) {
        ContentValues values=new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME,name);
        values.put(MediaStore.Downloads.MIME_TYPE,mime);
        values.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/DEEB");
        insertedUri=getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
        if(insertedUri==null) throw new Exception("تعذر إنشاء الملف في التنزيلات");
        try(OutputStream out=getContext().getContentResolver().openOutputStream(insertedUri)){
          if(out==null) throw new Exception("تعذر فتح الملف للحفظ");
          out.write(bytes); out.flush();
        }
      } else {
        File downloads=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File directory=new File(downloads,"DEEB");
        if(!directory.exists()&&!directory.mkdirs()) throw new Exception("تعذر إنشاء مجلد DEEB داخل التنزيلات");
        legacyFile=new File(directory,name);
        try(FileOutputStream out=new FileOutputStream(legacyFile)){out.write(bytes);out.flush();}
      }
      JSObject result=new JSObject(); result.put("saved",true); result.put("name",name);
      result.put("location",Build.VERSION.SDK_INT>=29?"Downloads/DEEB":legacyFile.getAbsolutePath());
      call.resolve(result);
    } catch(Exception e) {
      if(insertedUri!=null){try{getContext().getContentResolver().delete(insertedUri,null,null);}catch(Exception ignored){}}
      if(legacyFile!=null&&legacyFile.exists())legacyFile.delete();
      call.reject("تعذر حفظ الملف: "+e.getMessage(),e);
    }
  }
  @PluginMethod public void saveHtmlAsImages(PluginCall call) {
    final String html=call.getString("html","");
    final String requestedName=call.getString("name","DEEB-report");
    final String baseName=(requestedName==null||requestedName.trim().isEmpty()?"DEEB-report":requestedName.trim()).replace("/","_").replace(String.valueOf((char)92),"_");
    if(html.trim().isEmpty()){call.reject("لا توجد بيانات لتحويلها إلى صور");return;}
    getActivity().runOnUiThread(()->{
      final Handler handler=new Handler(Looper.getMainLooper());
      final float density=getContext().getResources().getDisplayMetrics().density;
      final int webWidth=(int)Math.ceil(794.0*density);
      final FrameLayout root=(FrameLayout)getActivity().getWindow().getDecorView().findViewById(android.R.id.content);
      if(root==null){call.reject("تعذر تجهيز صفحة التقرير");return;}
      final WebView view=new WebView(getContext());
      final java.util.concurrent.atomic.AtomicBoolean finished=new java.util.concurrent.atomic.AtomicBoolean(false);
      final java.util.ArrayList<Uri> createdUris=new java.util.ArrayList<>();
      final File tempPdf;
      try{tempPdf=File.createTempFile("deeb-report-",".pdf",getContext().getCacheDir());}
      catch(Exception e){view.destroy();call.reject("تعذر إنشاء ملف مؤقت لتحويل التقرير: "+e.getMessage());return;}
      final Runnable cleanup=()->handler.post(()->{
        try{if(view.getParent() instanceof ViewGroup)((ViewGroup)view.getParent()).removeView(view);}catch(Exception ignored){}
        try{view.stopLoading();view.destroy();}catch(Exception ignored){}
        try{if(tempPdf.exists())tempPdf.delete();}catch(Exception ignored){}
      });
      final Runnable removePartialImages=()->{
        for(Uri uri:createdUris){try{getContext().getContentResolver().delete(uri,null,null);}catch(Exception ignored){}}
        createdUris.clear();
      };
      final class ExportFailure{
        void reject(String message){
          if(finished.compareAndSet(false,true)){
            removePartialImages.run();
            cleanup.run();
            call.reject(message);
          }
        }
      }
      final ExportFailure fail=new ExportFailure();
      view.setBackgroundColor(Color.WHITE);
      view.setLayerType(View.LAYER_TYPE_HARDWARE,null);
      view.setVerticalScrollBarEnabled(false);
      view.setHorizontalScrollBarEnabled(false);
      view.getSettings().setJavaScriptEnabled(true);
      view.getSettings().setDomStorageEnabled(true);
      view.getSettings().setUseWideViewPort(true);
      view.getSettings().setLoadWithOverviewMode(false);
      view.setInitialScale(100);
      root.addView(view,new FrameLayout.LayoutParams(webWidth,(int)Math.ceil(1123*density)));
      view.setWebViewClient(new WebViewClient(){
        @Override public void onPageFinished(WebView v,String url){
          v.evaluateJavascript("(function(){var imgs=Array.prototype.slice.call(document.images);var wait=imgs.map(function(i){if(i.complete)return Promise.resolve();return new Promise(function(resolve){i.addEventListener('load',resolve,{once:true});i.addEventListener('error',resolve,{once:true});setTimeout(resolve,15000);});});var fonts=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();return Promise.all([fonts].concat(wait)).then(function(){return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve);});});}).then(function(){return 'ready';});})()",ready->{
            if(finished.get())return;
            String state=ready==null?"":ready.toString();
            if(!state.contains("ready")){handler.postDelayed(()->v.evaluateJavascript("document.readyState",x->{if(!finished.get())startPrintAdapter(v);}),250);return;}
            startPrintAdapter(v);
          });
        }
        private void startPrintAdapter(WebView v){
          if(finished.get())return;
          try{
            PrintAttributes attributes=new PrintAttributes.Builder()
              .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asPortrait())
              .setResolution(new PrintAttributes.Resolution("DEEB","DEEB",300,300))
              .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
              .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
              .build();
            PrintDocumentAdapter adapter=v.createPrintDocumentAdapter("DEEB-report-images");
            android.os.CancellationSignal cancellation=new android.os.CancellationSignal();
            adapter.onLayout(null,attributes,cancellation,new PrintDocumentAdapter.LayoutResultCallback(){
              @Override public void onLayoutFinished(android.print.PrintDocumentInfo info,boolean changed){
                if(finished.get())return;
                if(info==null||info.getPageCount()==0){fail.reject("محرك الطباعة لم يُنشئ صفحات للتقرير.");return;}
                if(info.getPageCount()>100){fail.reject("التقرير يتجاوز 100 صفحة؛ قسّمه قبل حفظ الصور.");return;}
                try{
                  android.os.ParcelFileDescriptor output=android.os.ParcelFileDescriptor.open(tempPdf,android.os.ParcelFileDescriptor.MODE_READ_WRITE|android.os.ParcelFileDescriptor.MODE_TRUNCATE);
                  adapter.onWrite(new android.print.PageRange[]{android.print.PageRange.ALL_PAGES},output,cancellation,new PrintDocumentAdapter.WriteResultCallback(){
                    @Override public void onWriteFinished(android.print.PageRange[] pages){
                      try{output.close();}catch(Exception ignored){}
                      if(finished.get())return;
                      new Thread(()->renderPdfPages()).start();
                    }
                    @Override public void onWriteFailed(CharSequence error){
                      try{output.close();}catch(Exception ignored){}
                      fail.reject("تعذر تجهيز صفحات التقرير للطباعة كصور: "+String.valueOf(error));
                    }
                    @Override public void onWriteCancelled(){
                      try{output.close();}catch(Exception ignored){}
                      fail.reject("تم إلغاء تحويل التقرير إلى صور.");
                    }
                  },null);
                }catch(Exception e){fail.reject("تعذر إنشاء PDF مؤقت للتقرير: "+e.getMessage());}
              }
              @Override public void onLayoutFailed(CharSequence error){fail.reject("تعذر ضبط صفحات التقرير على مقاس A4: "+String.valueOf(error));}
              @Override public void onLayoutCancelled(){fail.reject("تم إلغاء تجهيز صفحات التقرير.");}
            },null);
          }catch(Exception e){fail.reject("تعذر تشغيل محرك تجهيز الصفحات: "+e.getMessage());}
        }
        private void renderPdfPages(){
          android.os.ParcelFileDescriptor input=null;
          android.graphics.pdf.PdfRenderer renderer=null;
          try{
            input=android.os.ParcelFileDescriptor.open(tempPdf,android.os.ParcelFileDescriptor.MODE_READ_ONLY);
            renderer=new android.graphics.pdf.PdfRenderer(input);
            int pageCount=renderer.getPageCount();
            if(pageCount<1||pageCount>100)throw new Exception("عدد صفحات PDF الناتج غير صالح ("+pageCount+").");
            final int width=1588,height=2246;
            for(int index=0;index<pageCount;index++){
              if(finished.get())return;
              android.graphics.pdf.PdfRenderer.Page page=renderer.openPage(index);
              Bitmap bitmap=null;
              try{
                bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
                bitmap.eraseColor(Color.WHITE);
                page.render(bitmap,new android.graphics.Rect(0,0,width,height),null,android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
                int nonWhite=0;
                int stepX=Math.max(1,width/400),stepY=Math.max(1,height/400);
                for(int y=0;y<height&&nonWhite==0;y+=stepY)for(int x=0;x<width;x+=stepX){
                  int pixel=bitmap.getPixel(x,y);
                  if(Color.red(pixel)<248||Color.green(pixel)<248||Color.blue(pixel)<248){nonWhite++;break;}
                }
                if(nonWhite==0)throw new Exception("صفحة التقرير رقم "+(index+1)+" فارغة؛ تم إيقاف الحفظ.");
                if(pageCount>1){
                  Canvas canvas=new Canvas(bitmap);
                  android.graphics.Paint line=new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
                  line.setColor(Color.rgb(201,154,50));line.setStrokeWidth(2f);
                  canvas.drawLine(70,height-95,width-70,height-95,line);
                  android.graphics.Paint text=new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
                  text.setColor(Color.rgb(16,39,91));text.setTextSize(28);text.setTextAlign(android.graphics.Paint.Align.CENTER);
                  canvas.drawText("صفحة "+(index+1)+" من "+pageCount,width/2f,height-48,text);
                }
                ContentValues values=new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME,baseName+"-"+String.format(java.util.Locale.US,"%02d",index+1)+".png");
                values.put(MediaStore.Images.Media.MIME_TYPE,"image/png");
                if(Build.VERSION.SDK_INT>=29){
                  values.put(MediaStore.Images.Media.RELATIVE_PATH,Environment.DIRECTORY_PICTURES+"/DEEB");
                  values.put(MediaStore.Images.Media.IS_PENDING,1);
                }
                Uri uri=getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);
                if(uri==null)throw new Exception("تعذر إنشاء صورة التقرير رقم "+(index+1)+".");
                createdUris.add(uri);
                try(OutputStream out=getContext().getContentResolver().openOutputStream(uri)){
                  if(out==null||!bitmap.compress(Bitmap.CompressFormat.PNG,100,out))throw new Exception("تعذر كتابة صورة التقرير رقم "+(index+1)+".");
                  out.flush();
                }catch(Exception writeError){
                  getContext().getContentResolver().delete(uri,null,null);createdUris.remove(uri);throw writeError;
                }
                if(Build.VERSION.SDK_INT>=29){
                  ContentValues ready=new ContentValues();ready.put(MediaStore.Images.Media.IS_PENDING,0);
                  getContext().getContentResolver().update(uri,ready,null,null);
                }
              }finally{if(bitmap!=null&&!bitmap.isRecycled())bitmap.recycle();page.close();}
            }
            if(finished.compareAndSet(false,true)){
              cleanup.run();
              JSObject result=new JSObject();result.put("count",pageCount);result.put("saved",true);result.put("format","A4 PNG");result.put("source","Android PrintDocumentAdapter + PdfRenderer");
              call.resolve(result);
            }
          }catch(Exception e){fail.reject("تعذر تحويل صفحات التقرير إلى صور: "+e.getMessage());}
          finally{try{if(renderer!=null)renderer.close();}catch(Exception ignored){}try{if(input!=null)input.close();}catch(Exception ignored){}}
        }
      });
      String imageHtml=html.replace("width=device-width,initial-scale=1","width=794,initial-scale=1,maximum-scale=1,user-scalable=no").replace("width=device-width, initial-scale=1","width=794, initial-scale=1, maximum-scale=1, user-scalable=no");
      view.loadDataWithBaseURL("https://localhost/",imageHtml,"text/html","UTF-8",null);
      handler.postDelayed(()->{if(!finished.get())fail.reject("انتهت مهلة تجهيز صور التقرير بعد 120 ثانية. حاول مرة أخرى.");},120000);
    });
  }
  @PluginMethod public void printHtml(PluginCall call) {
    final String html=call.getString("html","");
    if(html.trim().isEmpty()){call.reject("لا توجد بيانات للطباعة");return;}
    getActivity().runOnUiThread(()->{
      final java.util.concurrent.atomic.AtomicBoolean settled=new java.util.concurrent.atomic.AtomicBoolean(false);
      final java.util.concurrent.atomic.AtomicBoolean pageReady=new java.util.concurrent.atomic.AtomicBoolean(false);
      final Handler handler=new Handler(Looper.getMainLooper());
      final float density=getContext().getResources().getDisplayMetrics().density;
      final int cssPageWidth=794;
      final int cssPageHeight=(int)Math.round(794.0*297.0/210.0);
      final int webWidth=(int)Math.ceil(cssPageWidth*density);
      final int webPageHeight=(int)Math.ceil(cssPageHeight*density);
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
        view.getSettings().setUseWideViewPort(true);
        view.getSettings().setLoadWithOverviewMode(false);
        view.setInitialScale(100);
        root.addView(view,new FrameLayout.LayoutParams(webWidth,webPageHeight));
        view.setWebViewClient(new WebViewClient(){
          @Override public void onPageFinished(WebView v,String url){
            if(!pageReady.compareAndSet(false,true))return;
            v.postDelayed(()->{
              if(settled.get())return;
              try{
                int width=webWidth;
                int contentCssHeight=Math.max(cssPageHeight,v.getContentHeight());
                int height=(int)Math.ceil(contentCssHeight*density);
                v.setLayoutParams(new FrameLayout.LayoutParams(width,height));
                v.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));
                v.layout(0,0,width,height);
                PrintManager pm=(PrintManager)getContext().getSystemService(Context.PRINT_SERVICE);
                if(pm==null)throw new Exception("خدمة الطباعة غير متاحة على الجهاز");
                String jobName="DEEB-"+System.currentTimeMillis();
                PrintAttributes attributes=new PrintAttributes.Builder()
                  .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asPortrait())
                  .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                  .setResolution(new PrintAttributes.Resolution("DEEB","DEEB",300,300))
                  .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
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
        String printHtml=html.replace("width=device-width,initial-scale=1","width=794,initial-scale=1,maximum-scale=1,user-scalable=no").replace("width=device-width, initial-scale=1","width=794, initial-scale=1, maximum-scale=1, user-scalable=no");
        view.loadDataWithBaseURL("https://localhost/",printHtml,"text/html","UTF-8",null);
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
// Android 9 and earlier require legacy public-storage permission; cap it at API 28.
if (!manifest.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
  manifest = manifest.replace(/(<manifest\b[^>]*>)/, '$1\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />');
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
