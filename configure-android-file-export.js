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

const pluginSource = String.raw\`package \${packageName};

import android.app.Activity;
import android.content.ContentValues;
import android.graphics.Bitmap;
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
import android.print.PageRange;
import android.provider.MediaStore;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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

@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService exportExecutor = Executors.newSingleThreadExecutor();

    private PrintAttributes printAttributes() {
        return new PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setResolution(new PrintAttributes.Resolution("deeb", "DEEB", 300, 300))
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            .build();
    }

    private WebView createReportWebView(Activity activity, String html, String name, Runnable ready) {
        WebView view = new WebView(activity);
        view.getSettings().setJavaScriptEnabled(false);
        view.setBackgroundColor(android.graphics.Color.WHITE);
        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView webView, String url) {
                handler.postDelayed(ready, 450);
            }
        });
        view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
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
                WebView webView = createReportWebView(activity, html, name, () -> {
                    try {
                        PrintManager manager = (PrintManager) activity.getSystemService(Activity.PRINT_SERVICE);
                        if (manager == null) throw new IllegalStateException("خدمة الطباعة غير متاحة.");
                        manager.print(name, webViewAdapterHolder[0], printAttributes());
                        JSObject result = new JSObject();
                        result.put("started", true);
                        call.resolve(result);
                        handler.postDelayed(() -> {
                            try { webViewHolder[0].destroy(); } catch (Exception ignored) {}
                        }, 300000);
                    } catch (Exception error) {
                        call.reject("تعذرت تهيئة الطباعة: " + error.getMessage());
                        try { webView.destroy(); } catch (Exception ignored) {}
                    }
                });
                webViewHolder[0] = webView;
                webViewAdapterHolder[0] = webView.createPrintDocumentAdapter(name);
            } catch (Exception error) {
                call.reject("تعذر تجهيز التقرير للطباعة: " + error.getMessage());
            }
        });
    }

    private final WebView[] webViewHolder = new WebView[1];
    private final PrintDocumentAdapter[] webViewAdapterHolder = new PrintDocumentAdapter[1];

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
            final WebView webView = createReportWebView(activity, html, baseName, () -> {
                final File pdf = new File(activity.getCacheDir(), "deeb-export-" + System.currentTimeMillis() + ".pdf");
                final PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(baseName);
                final PrintAttributes attributes = printAttributes();
                adapter.onLayout(null, attributes, new CancellationSignal(), new PrintDocumentAdapter.LayoutResultCallback() {
                    @Override
                    public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                        try {
                            ParcelFileDescriptor destination = ParcelFileDescriptor.open(pdf,
                                ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE | ParcelFileDescriptor.MODE_READ_WRITE);
                            adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, destination, new CancellationSignal(),
                                new PrintDocumentAdapter.WriteResultCallback() {
                                    @Override
                                    public void onWriteFinished(PageRange[] pages) {
                                        exportExecutor.execute(() -> renderPdfPages(activity, pdf, baseName, webView, call));
                                    }

                                    @Override
                                    public void onWriteFailed(CharSequence error) {
                                        cleanup(pdf, webView);
                                        call.reject("فشل إنشاء صفحات التقرير: " + error);
                                    }

                                    @Override
                                    public void onWriteCancelled() {
                                        cleanup(pdf, webView);
                                        call.reject("تم إلغاء تجهيز صور التقرير.");
                                    }
                                });
                        } catch (Exception error) {
                            cleanup(pdf, webView);
                            call.reject("تعذر إنشاء ملف التقرير المؤقت: " + error.getMessage());
                        }
                    }

                    @Override
                    public void onLayoutFailed(CharSequence error) {
                        cleanup(pdf, webView);
                        call.reject("تعذر تخطيط صفحات التقرير: " + error);
                    }
                }, new Bundle());
            });
        });
    }

    private void renderPdfPages(Activity activity, File pdf, String baseName, WebView webView, PluginCall call) {
        List<Uri> saved = new ArrayList<>();
        try (ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(pdf, ParcelFileDescriptor.MODE_READ_ONLY);
             PdfRenderer renderer = new PdfRenderer(descriptor)) {
            if (renderer.getPageCount() < 1) throw new IllegalStateException("ملف التقرير لا يحتوي على صفحات.");
            for (int index = 0; index < renderer.getPageCount(); index++) {
                try (PdfRenderer.Page page = renderer.openPage(index)) {
                    Bitmap bitmap = Bitmap.createBitmap(page.getWidth() * 2, page.getHeight() * 2, Bitmap.Config.ARGB_8888);
                    bitmap.eraseColor(android.graphics.Color.WHITE);
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
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
        try { if (pdf.exists()) pdf.delete(); } catch (Exception ignored) {}
        handler.post(() -> {
            try { webView.stopLoading(); webView.destroy(); } catch (Exception ignored) {}
        });
    }
}
\`;

fs.writeFileSync(pluginPath, pluginSource, "utf8");
const replacement = \`package \${packageName};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
\`;
fs.writeFileSync(mainPath, replacement, "utf8");
console.log("Installed native FileExport Capacitor plugin and registered it in " + path.relative(androidRoot, mainPath));
