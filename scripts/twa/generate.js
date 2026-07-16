// Generates the Android TWA (Trusted Web Activity) Gradle project non-interactively,
// wrapping the deployed web app. Runs entirely through @bubblewrap/core's programmatic
// API (no Inquirer prompts) so it's safe to call from CI.
//
// Usage: node scripts/twa/generate.js
//
// Reads config from env vars (all have sane defaults, see .github/workflows/build-apk.yml):
//   WEB_MANIFEST_URL   - full URL to the deployed app's manifest.json
//   TWA_PACKAGE_ID     - Android package id, e.g. ru.ball.app
//   TWA_DIR            - output directory for the generated Android project
//   ANDROID_KEY_ALIAS  - alias name inside the signing keystore
//   APP_VERSION_CODE   - integer, must increase on every Play/RuStore upload
//   APP_VERSION_NAME   - human-readable version string

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { TwaManifest, TwaGenerator, ConsoleLog } = require("@bubblewrap/core");

async function main() {
  const webManifestUrl =
    process.env.WEB_MANIFEST_URL || "https://ai-q7usi1aj4-proid.vercel.app/manifest.json";
  const targetDir = path.resolve(process.env.TWA_DIR || "./android-twa");
  const packageId = process.env.TWA_PACKAGE_ID || "ru.ball.app";
  const keyAlias = process.env.ANDROID_KEY_ALIAS || "ball";
  const versionCode = Number(process.env.APP_VERSION_CODE || 1);
  const versionName = process.env.APP_VERSION_NAME || "1.0.0";

  console.log(`Fetching web manifest from ${webManifestUrl} ...`);
  const twaManifest = await TwaManifest.fromWebManifest(webManifestUrl);

  twaManifest.packageId = packageId;
  twaManifest.appVersionCode = versionCode;
  twaManifest.appVersionName = versionName;
  twaManifest.signingKey.path = path.join(targetDir, "android-keystore");
  twaManifest.signingKey.alias = keyAlias;

  fs.mkdirSync(targetDir, { recursive: true });
  const manifestFile = path.join(targetDir, "twa-manifest.json");
  await twaManifest.saveToFile(manifestFile);

  console.log(`Generating Android project in ${targetDir} ...`);
  const generator = new TwaGenerator();
  await generator.createTwaProject(targetDir, twaManifest, new ConsoleLog("twa-generate"));

  // Bubblewrap's template only lists google()/jcenter() as Gradle repositories, but
  // jcenter() has been shut down and androidbrowserhelper is published on Maven Central —
  // without this the build fails to resolve that dependency.
  const rootBuildGradle = path.join(targetDir, "build.gradle");
  const original = fs.readFileSync(rootBuildGradle, "utf8");
  const patched = original.replace(/google\(\)/g, "google()\n        mavenCentral()");
  fs.writeFileSync(rootBuildGradle, patched);

  // Matches Bubblewrap's own checksum algorithm (sha1 hex of the manifest file bytes) so
  // `bubblewrap build` recognizes the project as up to date and skips its interactive prompt.
  const manifestContents = fs.readFileSync(manifestFile);
  const checksum = crypto.createHash("sha1").update(manifestContents).digest("hex");
  fs.writeFileSync(path.join(targetDir, "manifest-checksum.txt"), checksum);

  console.log("Done. Project ready for `bubblewrap build`.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
