/**
 * Generates PNG icons and og-image from public/favicon.svg.
 * WhatsApp, iMessage, and iOS home screen require raster images (not SVG).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "..", "public");
const PAPER = { r: 240, g: 238, b: 233 }; // #f0eee9
const HEART = "#0f8148";

const HEART_PATH =
  "M50 88 C36 76 12 60 5 42 C-1 26 8 10 24 8 C34 6.6 44 11 50 19 C56 11 66 6.6 76 8 C92 10 101 26 95 42 C88 60 64 76 50 88 Z";

function heartSvg(size) {
  const h = Math.round(size * (94 / 100));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 94" width="${size}" height="${h}">
  <path d="${HEART_PATH}" fill="${HEART}"/>
</svg>`;
}

async function squareIcon(size, outName, heartScale = 0.62) {
  const heartSize = Math.round(size * heartScale);
  const heartBuf = await sharp(Buffer.from(heartSvg(heartSize))).png().toBuffer();
  const meta = await sharp(heartBuf).metadata();

  await sharp({
    create: { width: size, height: size, channels: 3, background: PAPER },
  })
    .composite([
      {
        input: heartBuf,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - meta.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(PUBLIC, outName));

  console.log(`  ${outName} (${size}×${size})`);
}

async function ogImage() {
  const w = 1200;
  const h = 630;
  const heartSize = 220;
  const heartBuf = await sharp(Buffer.from(heartSvg(heartSize))).png().toBuffer();
  const meta = await sharp(heartBuf).metadata();

  await sharp({
    create: { width: w, height: h, channels: 3, background: PAPER },
  })
    .composite([
      {
        input: heartBuf,
        left: Math.round((w - meta.width) / 2),
        top: Math.round((h - meta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "og-image.png"));

  console.log(`  og-image.png (${w}×${h})`);
}

async function main() {
  if (!fs.existsSync(path.join(PUBLIC, "favicon.svg"))) {
    console.error("Missing public/favicon.svg");
    process.exit(1);
  }

  console.log("Generating icons from green heart…");
  await squareIcon(180, "apple-touch-icon.png");
  await squareIcon(192, "icon-192.png");
  await squareIcon(512, "icon-512.png");
  await ogImage();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
