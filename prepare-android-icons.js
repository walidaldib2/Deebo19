const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = __dirname;
const svgPath = path.join(root, "icon.svg");
const androidRes = path.join(root, "android", "app", "src", "main", "res");
const svg = fs.readFileSync(svgPath);
const playStoreSvg = Buffer.from(svg.toString("utf8").replace('rx="28"', 'rx="0"'));

const densities = [
  ["mdpi", 1],
  ["hdpi", 1.5],
  ["xhdpi", 2],
  ["xxhdpi", 3],
  ["xxxhdpi", 4]
];

async function main() {
  if (!fs.existsSync(androidRes)) {
    throw new Error("Android resources not found. Run npx cap add android first.");
  }

  for (const [density, scale] of densities) {
    const directory = path.join(androidRes, "mipmap-" + density);
    fs.mkdirSync(directory, { recursive: true });

    const legacySize = Math.round(48 * scale);
    const legacy = await sharp(svg).resize(legacySize, legacySize).png().toBuffer();
    fs.writeFileSync(path.join(directory, "ic_launcher.png"), legacy);
    fs.writeFileSync(path.join(directory, "ic_launcher_round.png"), legacy);

    // Adaptive icons use a 108dp canvas and keep the foreground artwork inside
    // the central 72dp safe area so Android's circular/squircle masks do not crop it.
    const canvasSize = Math.round(108 * scale);
    const foregroundSize = Math.round(72 * scale);
    const foreground = await sharp(svg).resize(foregroundSize, foregroundSize).png().toBuffer();
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: foreground, gravity: "centre" }])
      .png()
      .toFile(path.join(directory, "ic_launcher_foreground.png"));
  }

  const values = path.join(androidRes, "values");
  fs.mkdirSync(values, { recursive: true });
  fs.writeFileSync(
    path.join(values, "ic_launcher_background.xml"),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#071326</color></resources>\n'
  );

  const listing = path.join(root, "play-store-assets");
  fs.mkdirSync(listing, { recursive: true });
  await sharp(playStoreSvg).resize(512, 512).png().toFile(path.join(listing, "icon-512.png"));
  console.log("Generated DEEB launcher icons and the 512x512 Google Play listing icon.");
}

main().catch(error => {
  console.error("Failed to generate DEEB Android icons:", error);
  process.exitCode = 1;
});
