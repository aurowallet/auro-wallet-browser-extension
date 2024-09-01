const exec = require("child_process").exec;
const deepmerge = require("deepmerge");
const fs = require("fs");
const path = require("path");
const webExt = require("web-ext");
const gulp = require("gulp");
const zip = require("gulp-zip");

const pck = require("../package.json");

async function execShell(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
      });
    });
  });
}

const baseManifest = require("../src/manifest/manifest.json");
const firefoxManifestProperties = require("../src/manifest/firefox.json");
const chromeManifestProperties = require("../src/manifest/chrome.json");

const firefoxManifest = deepmerge(baseManifest, firefoxManifestProperties, {
  // arrayMerge: (_, source) => source,
});
const chromeManifest = deepmerge(baseManifest, chromeManifestProperties, {
  // arrayMerge: (_, source) => source,
});

async function copyFilesToMultipleFolders(sourceFolder, targetFolders) {
  for (const destFolder of targetFolders) {
    try {
      await execShell(`cp -r ${sourceFolder}/* ${destFolder}/`);
      console.log(`Files copied from ${sourceFolder} to ${destFolder}`);
    } catch (error) {
      console.error(`Error copying files to ${destFolder}:`, error);
    }
  }
}
async function simpleZipFolder(sourceFolder, outputZipName, outputFilePath) {
  return new Promise((resolve) => {
    gulp
      .src(sourceFolder)
      .pipe(zip(outputZipName))
      .pipe(gulp.dest(outputFilePath))
      .on("end", () => {
        resolve();
      });
  });
}

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
    const id = "1015";

    const chromeFileName = `${pck.name}-chrome-edge-${pck.version}-${id}`;
    const firefoxFileName = `${pck.name}-firefox-${pck.version}-${id}`;
    const sourceFileName = `${pck.name}-source-${pck.version}-${id}`;
    const publishFileName = `${pck.name}-${pck.version}-${id}`;

    const zipPath = path.resolve(__dirname, `../zip`);
    const chromePath = path.resolve(__dirname, `../zip/${chromeFileName}`);
    const firefoxPath = path.resolve(__dirname, `../zip/${firefoxFileName}`);
    const distPath = path.resolve(__dirname, `../dist`);

    await execShell(`mkdir -p ${chromePath}`);
    await execShell(`mkdir -p ${firefoxPath}`);

    const sourceFolder = "dist";
    const targetFolders = [chromePath, firefoxPath];
    await copyFilesToMultipleFolders(sourceFolder, targetFolders);

    await writeManifestFile(distPath, chromeManifest);
    await writeManifestFile(chromePath, chromeManifest);
    await writeManifestFile(firefoxPath, firefoxManifest);

    // zip firefox add-on
    // or await execShell(`web-ext build --source-dir=zip/${firefoxFileName} -artifacts-dir ./zip -filename ${firefoxFileName}.zip`);
    await webExt.cmd.build({
      sourceDir: firefoxPath,
      artifactsDir: zipPath,
      filename: `${firefoxFileName}.zip`,
    });

    //  zip chrome folder
    // gulp
    //   .src(`${chromePath}/**`)
    //   .pipe(zip(`${chromeFileName}.zip`))
    //   .pipe(gulp.dest(zipPath));
    await simpleZipFolder(`${chromePath}/**`, `${chromeFileName}.zip`, zipPath);

    // zip source
    const ignoreFileList = [
      "!.git/*",
      "!dist/**",
      "!node_modules/**",
      "!zip/**",
    ];
    let pathName = path.resolve(__dirname, '..')
    const sourceFilelist = [
      pathName+"/**",
      pathName+"/.*",
    ];
    // gulp
    //   .src([...sourceFileList, ...ignoreFileList])
    //   .pipe(zip(`${sourceFileName}.zip`))
    //   .pipe(gulp.dest(zipPath));
    await simpleZipFolder(
      [...sourceFilelist, ...ignoreFileList],
      `${sourceFileName}.zip`,
      zipPath
    );

    // /zip publish
    gulp
      .src([`${zipPath}/**.zip`])
      // .src([`zip/${chromeFileName}.zip`, `zip/${firefoxFileName}.zip`,`zip/${sourceFileName}.zip`])
      .pipe(zip(`${publishFileName}.zip`))
      .pipe(gulp.dest(zipPath));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
