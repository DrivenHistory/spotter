import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const IOS_ASSETS = join(import.meta.dirname, "..", "ios", "App", "App", "Assets.xcassets");

// ── App Icon (1024x1024) ──
async function generateAppIcon() {
  const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#F06B60"/>
        <stop offset="100%" stop-color="#D14A40"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" rx="0"/>
    <g stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- Top-left bracket -->
      <path d="M260,420 L260,260 L420,260"/>
      <!-- Top-right bracket -->
      <path d="M604,260 L764,260 L764,420"/>
      <!-- Bottom-left bracket -->
      <path d="M260,604 L260,764 L420,764"/>
      <!-- Bottom-right bracket -->
      <path d="M604,764 L764,764 L764,604"/>
      <!-- Center circle -->
      <circle cx="512" cy="512" r="100"/>
    </g>
  </svg>`;

  const outPath = join(IOS_ASSETS, "AppIcon.appiconset", "AppIcon-512@2x.png");
  await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(outPath);
  console.log("✅ App icon:", outPath);
}

// ── Splash Screen (1290x2796) ──
async function generateSplash() {
  const w = 1290;
  const h = 2796;
  const cx = w / 2;
  const cy = h / 2 - 100;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#0B0B0E"/>

    <!-- Glow -->
    <defs>
      <radialGradient id="glow" cx="50%" cy="45%" r="20%">
        <stop offset="0%" stop-color="#E85A4F" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#E85A4F" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>

    <!-- Coral circle -->
    <circle cx="${cx}" cy="${cy}" r="110" fill="#E85A4F"/>

    <!-- Viewfinder on circle -->
    <g stroke="white" stroke-width="8" stroke-linecap="round" fill="none" transform="translate(${cx - 40}, ${cy - 40})">
      <path d="M0,28 L0,0 L28,0"/>
      <path d="M52,0 L80,0 L80,28"/>
      <path d="M0,52 L0,80 L28,80"/>
      <path d="M52,80 L80,80 L80,52"/>
      <circle cx="40" cy="40" r="14"/>
    </g>

    <!-- SPOTTER text -->
    <text x="${cx}" y="${cy + 200}" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="58" font-weight="600" letter-spacing="12" fill="#FAFAF9">
      SPOTTER
    </text>
  </svg>`;

  const dir = join(IOS_ASSETS, "Splash.imageset");
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "splash.png");
  await sharp(Buffer.from(svg)).png().toFile(outPath);

  writeFileSync(
    join(dir, "Contents.json"),
    JSON.stringify({
      images: [{ idiom: "universal", filename: "splash.png", scale: "3x" }],
      info: { author: "xcode", version: 1 },
    }, null, 2)
  );

  console.log("✅ Splash:", outPath);
}

await generateAppIcon();
await generateSplash();
console.log("Done!");
