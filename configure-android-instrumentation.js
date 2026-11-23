const fs = require("fs");
const path = require("path");

const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
const packageName = config.appId;
const javaDir = path.join(root, "android", "app", "src", "androidTest", "java", ...packageName.split("."));
const gradlePath = path.join(root, "android", "app", "build.gradle");
if (!fs.existsSync(gradlePath)) throw new Error("Android app Gradle file is missing.");
fs.mkdirSync(javaDir, { recursive: true });

// Capacitor generates a placeholder instrumentation test with a hard-coded sample package name.
// It is unrelated to DEEB and fails every run, so keep only the DEEB-specific export test.
fs.rmSync(path.join(root, "android", "app", "src", "androidTest", "java", "com", "getcapacitor", "myapp", "ExampleInstrumentedTest.java"), { force: true });

let gradle = fs.readFileSync(gradlePath, "utf8");
if (!gradle.includes("testInstrumentationRunner")) {
  const updated = gradle.replace(/(defaultConfig\s*\{)/, '$1\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"');
  if (updated === gradle) throw new Error("Could not configure Android instrumentation runner.");
  gradle = updated;
}
if (!gradle.includes("androidx.test:runner:")) {
  gradle = gradle.replace(/dependencies\s*\{/, '$&\n    androidTestImplementation "androidx.test:runner:1.6.2"\n    androidTestImplementation "androidx.test.ext:junit:1.2.1"\n    androidTestImplementation "androidx.test:core:1.6.1"');
}
fs.writeFileSync(gradlePath, gradle);

const test = `package ${packageName};

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.core.app.ActivityScenario;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class ReportImageExportTest {
    private static final String NAME = "DEEB-instrumentation-test";

    public static class Callback {
        final CountDownLatch latch = new CountDownLatch(1);
        volatile String result;
        @JavascriptInterface public void done(String value) { Log.i("DEEBTest", "JavaScript callback received: " + value); result = value; latch.countDown(); }
    }

    @Test public void exportsAllReportPagesAsNonBlankA4Pngs() throws Exception {
        Log.i("DEEBTest", "Instrumentation test started");
        android.content.Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        deleteTestImages(context);
        Log.i("DEEBTest", "Launching MainActivity");
        ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class);
        try {
            AtomicReference<WebView> webRef = new AtomicReference<>();
            scenario.onActivity(activity -> webRef.set(activity.getBridge().getWebView()));
            WebView web = webRef.get();
            Log.i("DEEBTest", "Activity launched; WebView available=" + (web != null));
            assertNotNull("Capacitor WebView was not created", web);

            boolean ready = false;
            for (int i = 0; i < 120; i++) {
                String state = evaluateJavascript(web, "!!(window.DEEBNativePlugins && window.DEEBNativePlugins.FileExport)");
                if ("true".equals(state)) { ready = true; break; }
                Thread.sleep(250);
            }
            Log.i("DEEBTest", "Native FileExport bridge ready=" + ready);
            assertTrue("Native FileExport bridge did not become ready", ready);

            String html = "<!doctype html><html><head><meta name='viewport' content='width=794,initial-scale=1'>"
                + "<style>html,body{margin:0;padding:0;width:794px} .page{height:900px;width:794px;box-sizing:border-box;"
                + "padding:32px;background:#eeeeee;border-bottom:8px solid #8b1e3f;font:32px sans-serif;color:#123456}"
                + ".page:nth-of-type(1){background:#ff0000}.page:nth-of-type(2){background:#00aa00}.page:nth-of-type(3){background:#0000ff}"
                + ".marker{width:180px;height:180px;background:#d4af37}</style></head><body>"
                + "<section class='page'><div class='marker'></div>PAGE_ONE_SENTINEL</section>"
                + "<section class='page'><div class='marker'></div>PAGE_TWO_SENTINEL</section>"
                + "<section class='page'><div class='marker'></div>PAGE_THREE_SENTINEL</section>"
                + "</body></html>";
            Callback callback = new Callback();
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.addJavascriptInterface(callback, "DEEBInstrumentation"));
            String js = "(function(){try{"
                + "var plugin=window.DEEBNativePlugins&&window.DEEBNativePlugins.FileExport;"
                + "if(!plugin||typeof plugin.saveHtmlAsImages!=='function'){"
                + "DEEBInstrumentation.done(JSON.stringify({ok:false,error:'bridge-method-unavailable'}));return;}"
                + "var promise=plugin.saveHtmlAsImages({html:" + JSONObject.quote(html)
                + ",name:" + JSONObject.quote(NAME) + "});"
                + "if(!promise||typeof promise.then!=='function'){"
                + "DEEBInstrumentation.done(JSON.stringify({ok:false,error:'plugin-did-not-return-promise'}));return;}"
                + "promise.then(function(r){DEEBInstrumentation.done(JSON.stringify({ok:true,result:r}));})"
                + ".catch(function(e){DEEBInstrumentation.done(JSON.stringify({ok:false,error:String(e),message:e&&e.message,code:e&&e.code}));});"
                + "}catch(e){DEEBInstrumentation.done(JSON.stringify({ok:false,error:'sync:'+String(e),stack:e&&e.stack}));}})();";
            Log.e("DEEBTest", "Invoking saveHtmlAsImages; htmlChars=" + html.length());
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.evaluateJavascript(js, null));
            Log.e("DEEBTest", "Waiting for native export callback");
            boolean callbackReceived = callback.latch.await(150, TimeUnit.SECONDS);
            Log.e("DEEBTest", "Native export callback received=" + callbackReceived + "; payload=" + callback.result);
            assertTrue("Native report image export timed out", callbackReceived);
            JSONObject response = new JSONObject(String.valueOf(new JSONTokener(callback.result).nextValue()));
            assertTrue("Native report image export failed: " + callback.result, response.optBoolean("ok"));
            JSONObject result = response.getJSONObject("result");
            assertTrue("Plugin did not confirm saved images: " + result, result.optBoolean("saved"));
            assertEquals("Expected exactly three A4 pages", 3, result.getInt("count"));

            Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
            String[] projection = { MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME };
            try (android.database.Cursor cursor = context.getContentResolver().query(
                    collection, projection, MediaStore.Images.Media.DISPLAY_NAME + " LIKE ?",
                    new String[]{NAME + "-%"}, MediaStore.Images.Media.DISPLAY_NAME + " ASC")) {
                assertNotNull(cursor);
                assertEquals("Expected one PNG for each report page", 3, cursor.getCount());
                Set<Long> pageFingerprints = new HashSet<>();
                int pageIndex = 0;
                int[] expectedPageColors = { 0x00ff0000, 0x0000aa00, 0x000000ff };
                while (cursor.moveToNext()) {
                    long id = cursor.getLong(0);
                    Uri imageUri = Uri.withAppendedPath(collection, Long.toString(id));
                    try (InputStream input = context.getContentResolver().openInputStream(imageUri)) {
                        assertNotNull(input);
                        Bitmap bitmap = BitmapFactory.decodeStream(input);
                        assertNotNull("Saved page could not be decoded", bitmap);
                        try {
                            assertEquals(1588, bitmap.getWidth());
                            assertEquals(2246, bitmap.getHeight());
                            assertTrue("Unexpected extra exported page", pageIndex < expectedPageColors.length);
                            int pageStartColor = bitmap.getPixel(700, 100) & 0x00ffffff;
                            assertEquals("Page " + (pageIndex + 1) + " starts inside the wrong report section (overlap or skipped content)",
                                expectedPageColors[pageIndex], pageStartColor);
                            pageIndex++;
                            boolean nonWhite = false;
                            for (int y = 80; y < bitmap.getHeight() && !nonWhite; y += 160) {
                                for (int x = 80; x < bitmap.getWidth(); x += 160) {
                                    if ((bitmap.getPixel(x, y) & 0x00ffffff) != 0x00ffffff) { nonWhite = true; break; }
                                }
                            }
                            assertTrue("A saved report page is blank: " + cursor.getString(1), nonWhite);
                            long fingerprint = 1125899906842597L;
                            for (int y = 37; y < bitmap.getHeight(); y += 37) {
                                for (int x = 37; x < bitmap.getWidth(); x += 37) {
                                    fingerprint = 31 * fingerprint + (bitmap.getPixel(x, y) & 0x00ffffff);
                                }
                            }
                            assertTrue("Two exported report pages contain identical sampled pixels", pageFingerprints.add(fingerprint));
                        } finally { bitmap.recycle(); }
                    }
                }
                assertEquals("All expected report sections must appear at their own page starts", 3, pageIndex);
            }
        } finally {
            scenario.close();
            deleteTestImages(context);
        }
    }

    private static String evaluateJavascript(WebView web, String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            web.evaluateJavascript(script, value -> { result.set(value); latch.countDown(); }));
        assertTrue("WebView JavaScript evaluation timed out", latch.await(5, TimeUnit.SECONDS));
        return result.get();
    }

    private static void deleteTestImages(android.content.Context context) {
        context.getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            MediaStore.Images.Media.DISPLAY_NAME + " LIKE ?", new String[]{NAME + "-%"});
    }
}
`;
fs.writeFileSync(path.join(javaDir, "ReportImageExportTest.java"), test);
console.log("Configured Android instrumentation test for the real FileExport plugin and saved A4 PNG pages.");
