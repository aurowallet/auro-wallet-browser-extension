const deepmerge = require("deepmerge");
const fs = require("fs");
const path = require("path");

const baseManifest = require("../src/manifest/manifest.json");
const chromeManifestProperties = require("../src/manifest/chrome.json");

const chromeManifest = deepmerge(baseManifest, chromeManifestProperties, {
  // arrayMerge: (_, source) => source,
});

async function writeManifestFile(targetPath, fileContent) {
  return new Promise((resolve) => {
    fs.writeFile(
      targetPath + "/manifest.json",
      JSON.stringify(fileContent, null, 2),
      (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        } else {
          console.log("write distManifest success !", targetPath);
          resolve();
        }
      }
    );
  });
}

(async () => {
  try {
    const distPath = path.resolve(__dirname, `../dist`);
    await writeManifestFile(distPath, chromeManifest);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
