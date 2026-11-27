const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "www");
const assets = [
  "index.html", "app.js", "db.js", "team-sync.js", "qrcode.js",
  "biometric.bundle.js", "native-plugins.bundle.js", "document-tools.js",
  "powerpoint-editor.js", "style.css", "preferences.css", "preferences.js",
  "sw.js", "manifest.json", "icon.svg"
];

async function download(url, destination) {
  const response = await fetch(url, { headers: { "User-Agent": "DEEB-Android-build" } });
  if (!response.ok) throw new Error("OCR asset download failed (" + response.status + "): " + url);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error("Downloaded OCR asset is empty: " + url);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
}

async function main() {
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const name of assets) {
    const source = path.join(root, name);
    if (!fs.existsSync(source)) throw new Error("Missing Android web asset: " + name);
    fs.copyFileSync(source, path.join(output, name));
  }

  const tesseractDir = path.join(root, "node_modules", "tesseract.js");
  const coreDir = path.join(root, "node_modules", "tesseract.js-core");
  const worker = path.join(tesseractDir, "dist", "worker.min.js");
  const api = path.join(tesseractDir, "dist", "tesseract.min.js");
  if (!fs.existsSync(worker) || !fs.existsSync(api) || !fs.existsSync(coreDir)) {
    throw new Error("Tesseract.js local runtime is missing. Run npm install before preparing Android.");
  }
  const ocrRoot = path.join(output, "ocr");
  fs.mkdirSync(path.join(ocrRoot, "core"), { recursive: true });
  fs.mkdirSync(path.join(ocrRoot, "lang"), { recursive: true });
  fs.copyFileSync(worker, path.join(ocrRoot, "worker.min.js"));
  fs.copyFileSync(api, path.join(ocrRoot, "tesseract.min.js"));
  for (const name of fs.readdirSync(coreDir)) {
    if (/^tesseract-core.*\\.(?:js|wasm)$/.test(name)) {
      fs.copyFileSync(path.join(coreDir, name), path.join(ocrRoot, "core", name));
    }
  }
  const requiredCore = [
    "tesseract-core.wasm.js", "tesseract-core-simd.wasm.js",
    "tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"
  ];
  for (const name of requiredCore) {
    if (!fs.existsSync(path.join(ocrRoot, "core", name))) throw new Error("Missing Tesseract core asset: " + name);
  }
  for (const language of ["ara", "eng"]) {
    await download(
      "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/" + language + ".traineddata",
      path.join(ocrRoot, "lang", language + ".traineddata")
    );
  }
  console.log("Prepared " + assets.length + " DEEB web assets and local Arabic/English OCR runtime in www/.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
