import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Zips a built extension directory for store upload. Dependency-free: uses the
// platform's native zip tool (PowerShell Compress-Archive on Windows, `zip`
// elsewhere). A single Chromium build covers Chrome, Edge, Brave, Opera,
// Vivaldi, and Arc, so the default `chrome` target is named chromium.zip.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(repoRoot, "dist");

const browser = parseBrowser();
const sourceDirName = browser === "chrome" ? "extension" : browser;
const sourceDir = join(distRoot, sourceDirName);

if (!existsSync(sourceDir)) {
  throw new Error(
    `Build the ${browser} target first (e.g. \`npm run build\`); ${relative(repoRoot, sourceDir)} is missing.`
  );
}

const zipName = browser === "chrome" ? "chromium" : browser;
const zipPath = join(distRoot, `${zipName}.zip`);
await rm(zipPath, { force: true });

const result =
  process.platform === "win32"
    ? spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `Compress-Archive -Path '${join(sourceDir, "*")}' -DestinationPath '${zipPath}' -Force`
        ],
        { stdio: "inherit" }
      )
    : spawnSync("zip", ["-r", "-X", zipPath, "."], { cwd: sourceDir, stdio: "inherit" });

if (result.error || result.status !== 0) {
  throw new Error(`Packaging failed for ${browser}: ${result.error?.message || `exit ${result.status}`}`);
}

console.log(`Packaged ${relative(repoRoot, zipPath)}`);

function parseBrowser() {
  const args = process.argv.slice(2);
  let value = "chrome";
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--browser=")) value = arg.slice("--browser=".length);
    else if (arg === "--browser" && args[i + 1]) value = args[i + 1];
  }
  return String(value).trim().toLowerCase() || "chrome";
}
