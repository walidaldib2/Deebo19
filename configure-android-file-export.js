const fs = require("fs");
const path = require("path");

const androidRoot = path.join(__dirname, "android");
const javaRoot = path.join(androidRoot, "app", "src", "main", "java");

function findMainActivity(dir) {
  if (!fs.existsSync(dir)) throw new Error("Android Java source directory is missing: " + dir);
  const found = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "MainActivity.java") found.push(full);
    }
  }
  walk(dir);
  if (found.length !== 1) throw new Error("Expected exactly one MainActivity.java, found " + found.length);
  return found[0];
}

const mainPath = findMainActivity(javaRoot);
const mainSource = fs.readFileSync(mainPath, "utf8");
const packageMatch = mainSource.match(/^\s*package\s+([A-Za-z0-9_.]+)\s*;/m);
if (!packageMatch) throw new Error("Could not determine Android application package.");
const packageName = packageMatch[1];
const packageDir = path.dirname(mainPath);
const pluginPath = path.join(packageDir, "FileExportPlugin.java");

const pluginSource = String.raw`package ${packageName};

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.pdf.PdfDocument;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.print.PrintJob;
import android.print.PageRange;
import android.provider.MediaStore;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FileExport", permissions = { @com.getcapacitor.annotation.Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) })
public class FileExportPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService exportExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void saveFile(PluginCall call) {
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
        String name = call.getString("name", "DEEB-export.txt");
        if (name == null || name.trim().isEmpty()) name = "DEEB-export.txt";
        name = name.replace("/", "_").replace(String.valueOf((char) 92), "_");
        String mime = call.getString("mimeType", "application/octet-stream");
        String data = call.getString("base64", "");
        Uri insertedUri = null;
        File legacyFile = null;
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DEEB");
                insertedUri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (insertedUri == null) throw new Exception("تعذر إنشاء الملف في التنزيلات");
                try (OutputStream out = getContext().getContentResolver().openOutputStream(insertedUri)) {
                    if (out == null) throw new Exception("تعذر فتح الملف للحفظ");
                    out.write(bytes);
                    out.flush();
                }
            } else {
                File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File directory = new File(downloads, "DEEB");
                if (!directory.exists() && !directory.mkdirs()) throw new Exception("تعذر إنشاء مجلد DEEB داخل التنزيلات");
                legacyFile = new File(directory, name);
                try (FileOutputStream out = new FileOutputStream(legacyFile)) {
                    out.write(bytes);
                    out.flush();
                }
            }
            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("name", name);
            result.put("location", Build.VERSION.SDK_INT >= 29 ? "Downloads/DEEB" : legacyFile.getAbsolutePath());
            call.resolve(result);
        } catch (Exception error) {
            if (insertedUri != null) {
                try { getContext().getContentResolver().delete(insertedUri, null, null); } catch (Exception ignored) {}
            }
            if (legacyFile != null && legacyFile.exists()) legacyFile.delete();
            call.reject("تعذر حفظ الملف: " + error.getMessage(), error);
        }
    }


    private PrintAttributes printAttributes() {
        return new PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setResolution(new PrintAttributes.Resolution("deeb", "DEEB", 300, 300))
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            .build();
    }

    private WebView createReportWebView(Activity activity, String html, String name, Runnable ready, boolean expandToContent) {
        WebView view = new WebView(activity);
        float density = activity.getResources().getDisplayMetrics().density;
        int width = (int) Math.ceil(794.0 * density);
        int pageHeight = (int) Math.ceil(1123.0 * density);
        FrameLayout root = (FrameLayout) activity.findViewById(android.R.id.content);
        if (root == null) throw new IllegalStateException("تعذر الوصول إلى نافذة التقرير.");
        view.setBackgroundColor(android.graphics.Color.WHITE);
        view.getSettings().setJavaScriptEnabled(true);
        view.getSettings().setDomStorageEnabled(true);
        view.getSettings().setUseWideViewPort(true);
        view.getSettings().setLoadWithOverviewMode(false);
        view.setInitialScale(100);
        root.addView(view, new FrameLayout.LayoutParams(width, pageHeight));
        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView webView, String url) {
                String waitForAssets = "(function(){var imgs=Array.prototype.slice.call(document.images).filter(function(i){return !!(i.currentSrc||i.src);});var waits=imgs.map(function(i){if(i.complete)return Promise.resolve(i.naturalWidth>0);return new Promise(function(resolve){var done=function(){resolve(i.naturalWidth>0);};i.addEventListener('load',done,{once:true});i.addEventListener('error',function(){resolve(false);},{once:true});setTimeout(function(){resolve(i.complete&&i.naturalWidth>0);},20000);});});var fonts=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();return Promise.all([fonts].concat(waits)).then(function(){return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(function(){resolve('ready');});});});});})()";
                webView.evaluateJavascript(waitForAssets, result -> {
                    if (result == null || !result.contains("ready")) {
                        handler.postDelayed(ready, 450);
                        return;
                    }
                    int cssHeight = expandToContent ? Math.max(1123, webView.getContentHeight()) : 1123;
                    int height = (int) Math.ceil(cssHeight * density);
                    webView.setLayoutParams(new FrameLayout.LayoutParams(width, height));
                    webView.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
                    webView.layout(0, 0, width, height);
                    handler.postDelayed(ready, 250);
                });
            }
        });
        String printHtml = html.replace("width=device-width,initial-scale=1", "width=794,initial-scale=1,maximum-scale=1,user-scalable=no")
            .replace("width=device-width, initial-scale=1", "width=794, initial-scale=1, maximum-scale=1, user-scalable=no");
        view.loadDataWithBaseURL("https://localhost/", printHtml, "text/html", "UTF-8", null);
        return view;
    }

    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        String name = call.getString("name", "DEEB-report");
        if (html == null || html.trim().isEmpty()) {
            call.reject("محتوى التقرير فارغ.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("تعذر الوصول إلى خدمة الطباعة على الجهاز.");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                final WebView[] holder = new WebView[1];
                holder[0] = createReportWebView(activity, html, name, () -> {
                    try {
                        PrintManager manager = (PrintManager) activity.getSystemService(Activity.PRINT_SERVICE);
                        if (manager == null) throw new IllegalStateException("خدمة الطباعة غير متاحة.");
                        PrintDocumentAdapter adapter = holder[0].createPrintDocumentAdapter(name);
                        PrintJob job = manager.print(name, adapter, printAttributes());
                        if (job == null) throw new IllegalStateException("لم يستطع أندرويد إنشاء مهمة الطباعة.");
                        JSObject result = new JSObject();
                        result.put("started", true);
                        call.resolve(result);
                        Runnable disposeWhenFinished = new Runnable() {
                            @Override public void run() {
                                if (job.isCompleted() || job.isCancelled() || job.isFailed()) cleanup(null, holder[0]);
                                else handler.postDelayed(this, 1500);
                            }
                        };
                        handler.postDelayed(disposeWhenFinished, 1500);
                    } catch (Exception error) {
                        call.reject("تعذرت تهيئة الطباعة: " + error.getMessage());
                        cleanup(null, holder[0]);
                    }
                }, true);
            } catch (Exception error) {
                call.reject("تعذر تجهيز التقرير للطباعة: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void saveHtmlAsImages(PluginCall call) {
        String html = call.getString("html");
        String baseName = call.getString("name", "DEEB-report");
        if (html == null || html.trim().isEmpty()) {
            call.reject("محتوى التقرير فارغ.");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("حفظ صور التقرير في المعرض يتطلب Android 10 أو أحدث.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("تعذر الوصول إلى مساحة حفظ الصور.");
            return;
        }
        activity.runOnUiThread(() -> {
            final WebView[] webViewHolder = new WebView[1];
            webViewHolder[0] = createReportWebView(activity, html, baseName, () -> {
                final WebView webView = webViewHolder[0];
                final File pdf = new File(activity.getCacheDir(), "deeb-export-" + System.currentTimeMillis() + ".pdf");
                try {
                    writeWebViewToPdf(webView, pdf, new PdfExportCallback() {
                        @Override public void onSuccess() {
                            exportExecutor.execute(() -> renderPdfPages(activity, pdf, baseName, webView, call));
                        }
                        @Override public void onError(Exception error) {
                            cleanup(pdf, webView);
                            call.reject("تعذر تجهيز صفحات التقرير للصور: " + error.getMessage());
                        }
                    });
                } catch (Exception error) {
                    cleanup(pdf, webView);
                    call.reject("تعذر تجهيز صفحات التقرير للصور: " + error.getMessage());
                }
            }, true);
        });
    }

    private interface PdfExportCallback {
        void onSuccess();
        void onError(Exception error);
    }

    private void writeWebViewToPdf(WebView webView, File pdfFile, PdfExportCallback callback) {
        if (webView == null || webView.getWidth() <= 0 || webView.getHeight() <= 0) {
            callback.onError(new IllegalStateException("أبعاد التقرير غير صالحة بعد تحميل المحتوى."));
            return;
        }
        try {
            if (pdfFile.exists() && !pdfFile.delete()) {
                throw new IllegalStateException("تعذر تجهيز ملف PDF مؤقت.");
            }
            PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter("DEEB-report-images");
            PrintAttributes attributes = printAttributes();
            CancellationSignal cancellation = new CancellationSignal();
            adapter.onLayout(null, attributes, cancellation, new PrintDocumentAdapter.LayoutResultCallback() {
                @Override
                public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                    ParcelFileDescriptor descriptor = null;
                    try {
                        descriptor = ParcelFileDescriptor.open(pdfFile,
                            ParcelFileDescriptor.MODE_CREATE |
                            ParcelFileDescriptor.MODE_TRUNCATE |
                            ParcelFileDescriptor.MODE_READ_WRITE);
                        ParcelFileDescriptor outputDescriptor = descriptor;
                        adapter.onWrite(new PageRange[] { PageRange.ALL_PAGES }, outputDescriptor,
                            new CancellationSignal(), new PrintDocumentAdapter.WriteResultCallback() {
                                @Override
                                public void onWriteFinished(PageRange[] pages) {
                                    try {
                                        outputDescriptor.close();
                                        if (!pdfFile.exists() || pdfFile.length() < 100) {
                                            throw new IllegalStateException("ملف PDF الناتج فارغ.");
                                        }
                                        callback.onSuccess();
                                    } catch (Exception error) {
                                        callback.onError(error);
                                    }
                                }

                                @Override
                                public void onWriteFailed(CharSequence error) {
                                    try { outputDescriptor.close(); } catch (Exception ignored) {}
                                    callback.onError(new IllegalStateException(
                                        error == null ? "فشل محرك أندرويد في إنشاء PDF." : error.toString()));
                                }

                                @Override
                                public void onWriteCancelled() {
                                    try { outputDescriptor.close(); } catch (Exception ignored) {}
                                    callback.onError(new IllegalStateException("تم إلغاء إنشاء PDF."));
                                }
                            });
                    } catch (Exception error) {
                        if (descriptor != null) {
                            try { descriptor.close(); } catch (Exception ignored) {}
                        }
                        callback.onError(error);
                    }
                }

                @Override
                public void onLayoutFailed(CharSequence error) {
                    callback.onError(new IllegalStateException(
                        error == null ? "فشل تجهيز صفحات التقرير للطباعة." : error.toString()));
                }

                @Override
                public void onLayoutCancelled() {
                    callback.onError(new IllegalStateException("تم إلغاء تجهيز صفحات التقرير."));
                }
            }, new Bundle());
        } catch (Exception error) {
            callback.onError(error);
        }
    }

    private void renderPdfPages(Activity activity, File pdf, String baseName, WebView webView, PluginCall call) {
        List<Uri> saved = new ArrayList<>();
        try (ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(pdf, ParcelFileDescriptor.MODE_READ_ONLY);
             PdfRenderer renderer = new PdfRenderer(descriptor)) {
            if (renderer.getPageCount() < 1 || renderer.getPageCount() > 100) throw new IllegalStateException("عدد صفحات التقرير غير صالح أو يتجاوز 100 صفحة.");
            for (int index = 0; index < renderer.getPageCount(); index++) {
                try (PdfRenderer.Page page = renderer.openPage(index)) {
                    Bitmap bitmap = Bitmap.createBitmap(page.getWidth() * 2, page.getHeight() * 2, Bitmap.Config.ARGB_8888);
                    bitmap.eraseColor(android.graphics.Color.WHITE);
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
                    int nonWhite = 0;
                    int stepX = Math.max(1, bitmap.getWidth() / 400);
                    int stepY = Math.max(1, bitmap.getHeight() / 400);
                    for (int y = 0; y < bitmap.getHeight() && nonWhite == 0; y += stepY) {
                        for (int x = 0; x < bitmap.getWidth(); x += stepX) {
                            int pixel = bitmap.getPixel(x, y);
                            if (android.graphics.Color.red(pixel) < 248 || android.graphics.Color.green(pixel) < 248 || android.graphics.Color.blue(pixel) < 248) {
                                nonWhite++;
                                break;
                            }
                        }
                    }
                    if (nonWhite == 0) throw new IllegalStateException("صفحة التقرير رقم " + (index + 1) + " فارغة؛ أوقفنا الحفظ حتى لا تظهر صور بيضاء.");
                    ContentValues values = new ContentValues();
                    String fileName = safeName(baseName) + "-" + String.format(java.util.Locale.US, "%02d", index + 1) + ".png";
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                    values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/DEEB");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                    Uri uri = activity.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) throw new IllegalStateException("تعذر إنشاء صورة الصفحة " + (index + 1));
                    saved.add(uri);
                    try (OutputStream output = activity.getContentResolver().openOutputStream(uri)) {
                        if (output == null || !bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)) {
                            throw new IllegalStateException("تعذر كتابة صورة الصفحة " + (index + 1));
                        }
                    } finally {
                        bitmap.recycle();
                    }
                    ContentValues ready = new ContentValues();
                    ready.put(MediaStore.Images.Media.IS_PENDING, 0);
                    activity.getContentResolver().update(uri, ready, null, null);
                }
            }
            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("count", saved.size());
            handler.post(() -> {
                cleanup(pdf, webView);
                call.resolve(result);
            });
        } catch (Exception error) {
            for (Uri uri : saved) {
                try { activity.getContentResolver().delete(uri, null, null); } catch (Exception ignored) {}
            }
            handler.post(() -> {
                cleanup(pdf, webView);
                call.reject("تعذر تحويل صفحات التقرير إلى صور: " + error.getMessage());
            });
        }
    }

    private String safeName(String value) {
        String result = value == null ? "DEEB-report" : value.replaceAll("[^A-Za-z0-9_-]", "-");
        return result.isEmpty() ? "DEEB-report" : result;
    }

    private void cleanup(File pdf, WebView webView) {
        try { if (pdf != null && pdf.exists()) pdf.delete(); } catch (Exception ignored) {}
        handler.post(() -> {
            try { if (webView.getParent() instanceof ViewGroup) ((ViewGroup) webView.getParent()).removeView(webView); webView.stopLoading(); webView.destroy(); } catch (Exception ignored) {}
        });
    }
}
`;

fs.writeFileSync(pluginPath, pluginSource, "utf8");
const registeredActivity = fs.readFileSync(mainPath, "utf8");
if (!registeredActivity.includes("registerPlugin(FileExportPlugin.class)")) {
  throw new Error("FileExportPlugin must be registered by the Android integration setup before installing the exporter.");
}
console.log("Installed native FileExport plugin without replacing the existing Android activity.");
console.log("Installed native FileExport Capacitor plugin and registered it in " + path.relative(androidRoot, mainPath));
