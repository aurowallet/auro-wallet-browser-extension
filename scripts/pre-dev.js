const fs = require("fs");
const path = require("path");
const deepmerge = require("deepmerge");

const browser = process.env.BROWSER || "chrome";
const isFirefox = browser === "firefox";

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, isFirefox ? "dist-firefox" : "dist");

console.log(
  `[pre-dev] Preparing minimal dist/ for ${
    isFirefox ? "Firefox" : "Chrome"
  } dev...`
);

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const baseManifest = require("../src/manifest/manifest.json");
const chromeManifestProps = require("../src/manifest/chrome.json");
const firefoxManifestProps = require("../src/manifest/firefox.json");

const chromeManifest = deepmerge(baseManifest, chromeManifestProps);

const firefoxManifest = deepmerge(baseManifest, firefoxManifestProps);

const finalManifest = isFirefox ? firefoxManifest : chromeManifest;

fs.writeFileSync(
  path.join(distDir, "manifest.json"),
  JSON.stringify(finalManifest, null, 2)
);

console.log("[pre-dev] dist/ created");
console.log(
  `[pre-dev] manifest.json（${isFirefox ? "Firefox" : "Chrome"} write successfully）`
);
console.log("[pre-dev] ready → webpack will output all JS/CSS/file\n");
