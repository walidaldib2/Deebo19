const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "www");
const assets = [
  "index.html",
  "app.js",
  "scanner.js",
  "db.js",
  "qrcode.js",
  "biometric.bundle.js",
  "native-plugins.bundle.js",
  "style.css",
  "preferences.css",
  "preferences.js",
  "sw.js",
  "manifest.json",
  "icon.svg"
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of assets) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) throw new Error("Missing Android web asset: " + name);
  fs.copyFileSync(source, path.join(output, name));
}
console.log("Prepared " + assets.length + " DEEBO web assets in www/.");
