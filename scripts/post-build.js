const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const JSZip = require("jszip");
const pck = require("../package.json");
const deepmerge = require("deepmerge");

const ID = "1001";
const version = pck.version;
const baseName = pck.name;

const chromeName = `${baseName}-chrome-edge-${version}-${ID}`;
const firefoxName = `${baseName}-firefox-${version}-${ID}`;
const sourceName = `${baseName}-source-${version}-${ID}`;
const publishName = `${baseName}-${version}-${ID}`;

const zipDir = path.resolve(__dirname, "../zip");
const chromeDir = path.join(zipDir, chromeName);
const firefoxDir = path.join(zipDir, firefoxName);

// check zip exist
[zipDir, chromeDir, firefoxDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

console.log("copying to zip...");
execSync(`cp -r dist-chrome/* "${chromeDir}/"`);
execSync(`cp -r dist-firefox/* "${firefoxDir}/"`);

// write manifest.json
const baseManifest = require("../src/manifest/manifest.json");
const chromeManifestProps = require("../src/manifest/chrome.json");
const firefoxManifestProps = require("../src/manifest/firefox.json");

const chromeManifest = deepmerge(baseManifest, chromeManifestProps);
const firefoxManifest = deepmerge(baseManifest, firefoxManifestProps);

// write to zip folder（for build）
fs.writeFileSync(
  path.join(chromeDir, "manifest.json"),
  JSON.stringify(chromeManifest, null, 2)
);
fs.writeFileSync(
  path.join(firefoxDir, "manifest.json"),
  JSON.stringify(firefoxManifest, null, 2)
);

// write to dist folder（for unpacked debug)
fs.writeFileSync(
  path.join(__dirname, "../dist-chrome/manifest.json"),
  JSON.stringify(chromeManifest, null, 2)
);
fs.writeFileSync(
  path.join(__dirname, "../dist-firefox/manifest.json"),
  JSON.stringify(firefoxManifest, null, 2)
);

// exclude file/folder
const EXCLUDED_DIR_NAMES = [
  "node_modules",
  "dist",
  "dist-chrome",
  "dist-firefox",
  "zip",
  ".git",
];

/**
 * check exclude
 */
function shouldExclude(itemName, isDirectory) {
  if (!isDirectory) return false;
  return EXCLUDED_DIR_NAMES.includes(itemName);
}

function addFilesToZip(zip, dir, zipPathPrefix = "") {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativeInZip = zipPathPrefix
      ? path.join(zipPathPrefix, item.name)
      : item.name;

    if (shouldExclude(item.name, item.isDirectory())) {
      console.log(`excluded: ${relativeInZip}`);
      continue;
    }

    if (item.isDirectory()) {
      addFilesToZip(zip, fullPath, relativeInZip);
    } else {
      zip.file(relativeInZip, fs.readFileSync(fullPath), {
        binary: true,
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
        date: fs.statSync(fullPath).mtime,
      });
    }
  }
}

async function packExtension(sourceDir, zipName) {
  console.log(`packing ${zipName}...`);
  const zip = new JSZip();
  addFilesToZip(zip, sourceDir);
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const outputPath = path.join(zipDir, zipName);
  fs.writeFileSync(outputPath, buffer);
  console.log(`${zipName} → ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

(async () => {
  try {
    await packExtension(firefoxDir, `${firefoxName}.zip`);
    await packExtension(chromeDir, `${chromeName}.zip`);

    console.log("build source code...");
    const rootPath = path.resolve(__dirname, "..");
    const sourceZip = new JSZip();
    addFilesToZip(sourceZip, rootPath);

    const sourceBuffer = await sourceZip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    const sourceOutput = path.join(zipDir, `${sourceName}.zip`);
    fs.writeFileSync(sourceOutput, sourceBuffer);
    console.log(
      `source code zip → ${(sourceBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    console.log("build finally publish package...");
    const publishZip = new JSZip();
    fs.readdirSync(zipDir)
      .filter((f) => f.endsWith(".zip"))
      .forEach((file) => {
        publishZip.file(file, fs.readFileSync(path.join(zipDir, file)));
      });
    const publishBuffer = await publishZip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    fs.writeFileSync(path.join(zipDir, `${publishName}.zip`), publishBuffer);

    console.log("updating dist(for chrome dev)...");
    const rootDist = path.resolve(__dirname, "../dist");
    if (fs.existsSync(rootDist)) execSync(`rm -rf "${rootDist}"`);
    fs.mkdirSync(rootDist, { recursive: true });
    execSync(`cp -r "${chromeDir}"/* "${rootDist}/"`);

    console.log("dist updated for chrome dev.");

    console.log("\nall done!");
    console.log(
      "  dist-chrome/    → Load as unpacked extension (Chrome debugging)"
    );
    console.log(
      "  dist-firefox/   → Load as unpacked extension (Firefox debugging)"
    );
    console.log(
      "  dist/           → Identical to the final Chrome release build (for debugging)"
    );
    console.log(
      "  zip/            → 6 standard files ready for store submission"
    );
  } catch (err) {
    console.error("build failed:", err);
    process.exit(1);
  }
})();
