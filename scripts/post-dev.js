const fs = require("fs");
const path = require("path");
const deepmerge = require("deepmerge");

const baseManifest = require("../src/manifest/manifest.json");
const chromeManifestProps = require("../src/manifest/chrome.json");
const firefoxManifestProps = require("../src/manifest/firefox.json");

// check browser environment
const browser = process.env.BROWSER || "chrome";
console.log(`post-dev.js: browser is → ${browser.toUpperCase()}`);

const targetManifest = browser === "firefox"
  ? deepmerge(baseManifest, firefoxManifestProps)
  : deepmerge(baseManifest, chromeManifestProps);

const distPath = browser === "firefox" ? "dist-firefox" : "dist";
// write manifest.json to dist
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

fs.writeFileSync(
  path.join(distPath, "manifest.json"),
  JSON.stringify(targetManifest, null, 2)
);

console.log("manifest.json is write to dist(for dev) successfully.");