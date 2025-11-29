const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const gulp = require("gulp");
const zip = require("gulp-zip");
const webExt = require("web-ext");
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
[zipDir, chromeDir, firefoxDir].forEach((dir) =>
  fs.mkdirSync(dir, { recursive: true })
);

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

console.log("manifest.json write to: dist-chrome/、dist-firefox/、zip/ ");

(async () => {
  try {
    console.log("packing Firefox webExt...");
    await webExt.cmd.build({
      sourceDir: firefoxDir,
      artifactsDir: zipDir,
      filename: `${firefoxName}.zip`,
      overwriteDest: true,
    });

    console.log("packing Chrome extension...");
    await new Promise((resolve, reject) => {
      gulp
        .src(`${chromeDir}/**/*`, { dot: true })
        .pipe(zip(`${chromeName}.zip`))
        .pipe(gulp.dest(zipDir))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("build source code...");
    await new Promise((resolve, reject) => {
      const rootPath = path.resolve(__dirname, "..");
      gulp
        .src(
          [
            `${rootPath}/**`,
            `${rootPath}/.*`,
            `!${rootPath}/node_modules/**`,
            `!${rootPath}/dist/**`,
            `!${rootPath}/dist-chrome/**`,
            `!${rootPath}/dist-firefox/**`,
            `!${rootPath}/zip/**`,
            `!${rootPath}/.git/**`,
          ],
          { dot: true }
        )
        .pipe(zip(`${sourceName}.zip`))
        .pipe(gulp.dest(zipDir))
        .on("end", () => {
          console.log("source code zip build complete.");
          resolve();
        })
        .on("error", reject);
    });

    console.log("build finally publish package...");
    await new Promise((resolve, reject) => {
      gulp
        .src(`${zipDir}/*.zip`)
        .pipe(zip(`${publishName}.zip`))
        .pipe(gulp.dest(zipDir))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("updating dist(for chrome dev)...");
    const rootDist = path.resolve(__dirname, "../dist");
    if (fs.existsSync(rootDist)) {
      execSync(`rm -rf "${rootDist}"`);
    }
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
