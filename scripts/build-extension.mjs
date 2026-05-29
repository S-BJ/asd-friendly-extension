import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "src");
const distRoot = join(repoRoot, "dist");
const manifestOverridesRoot = join(repoRoot, "build", "manifest-overrides");
const distributionReadmeSource = join(repoRoot, "docs", "distribution-readme-ko.md");

// Build target. Chrome (default) keeps the historical `dist/extension` output and
// no manifest override, so its output is unchanged. Other browsers emit to
// `dist/<browser>` and merge an optional override from build/manifest-overrides/.
const targetBrowser = parseTargetBrowser();
const extensionDist = join(distRoot, targetBrowser === "chrome" ? "extension" : targetBrowser);

const sourceAssets = [
  "manifest.json",
  "background",
  "content",
  "popup",
  "rules",
  "shared"
];
const excludedSourcePaths = new Set([
  "background/site-overrides.js",
  "content/classifier",
  "shared/feature-policy.js"
]);

await ensureInsideRepo(extensionDist);
await rm(extensionDist, { recursive: true, force: true });
await mkdir(extensionDist, { recursive: true });

for (const asset of sourceAssets) {
  await copyRequiredFromSource(asset);
}

await copyOptionalDirectory("icons");
await copyOptionalDirectory("public");

const manifestPath = join(extensionDist, "manifest.json");
let manifest = await readManifest(manifestPath);

const override = await readManifestOverride(targetBrowser);
if (override) {
  manifest = deepMerge(manifest, override);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

await validateManifestReferences(manifest);
await writeBuildMetadata(manifest);
await copyDistributionReadme();

console.log(`Built ${targetBrowser} extension at ${relative(repoRoot, extensionDist)}`);

function parseTargetBrowser() {
  const args = process.argv.slice(2);
  let value = "chrome";
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--browser=")) value = arg.slice("--browser=".length);
    else if (arg === "--browser" && args[i + 1]) value = args[i + 1];
  }
  return String(value).trim().toLowerCase() || "chrome";
}

async function readManifestOverride(browser) {
  if (browser === "chrome") return null;
  const overridePath = join(manifestOverridesRoot, `${browser}.json`);
  if (!existsSync(overridePath)) return null;
  return readManifest(overridePath);
}

// Recursive merge: plain objects merge key-by-key; arrays and primitives in the
// override replace the base value.
function deepMerge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return result;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function copyRequiredFromSource(relativePath) {
  const source = join(sourceRoot, relativePath);
  if (!existsSync(source)) {
    throw new Error(`Required source extension asset is missing: src/${relativePath}`);
  }

  const destination = join(extensionDist, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, filter: shouldCopySourcePath });
}

async function copyOptionalDirectory(relativePath) {
  const source = join(repoRoot, relativePath);
  if (!existsSync(source)) return;

  const sourceStat = await stat(source);
  if (!sourceStat.isDirectory()) return;

  const destination = join(extensionDist, relativePath);
  await cp(source, destination, { recursive: true });
}

async function readManifest(manifestPath) {
  const raw = await readFile(manifestPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`manifest.json is not valid JSON: ${error.message}`);
  }
}

async function validateManifestReferences(manifest) {
  const referencedFiles = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {}),
    ...(manifest.declarative_net_request?.rule_resources || []).map((ruleset) => ruleset.path),
    ...(manifest.content_scripts || []).flatMap((script) => [
      ...(script.js || []),
      ...(script.css || [])
    ])
  ].filter(Boolean);

  for (const filePath of referencedFiles) {
    const resolvedPath = join(extensionDist, filePath);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Manifest references a missing file: ${filePath}`);
    }
  }
}

function shouldCopySourcePath(sourcePath) {
  const relativePath = toPosixPath(relative(sourceRoot, sourcePath));
  if (!relativePath) return true;

  for (const excludedPath of excludedSourcePaths) {
    if (relativePath === excludedPath || relativePath.startsWith(`${excludedPath}/`)) return false;
  }

  return true;
}

function toPosixPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

async function writeBuildMetadata(manifest) {
  const metadata = {
    builtAt: new Date().toISOString(),
    source: "src-rebuild-foundation",
    manifestVersion: manifest.manifest_version,
    extensionVersion: manifest.version
  };

  await writeFile(
    join(extensionDist, "build-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8"
  );
}

async function copyDistributionReadme() {
  if (!existsSync(distributionReadmeSource)) return;

  await cp(distributionReadmeSource, join(distRoot, "README-KO.md"));
  await cp(distributionReadmeSource, join(extensionDist, "README-KO.md"));
}

async function ensureInsideRepo(targetPath) {
  const resolvedTarget = resolve(targetPath);
  const relativeTarget = relative(repoRoot, resolvedTarget);
  if (relativeTarget.startsWith("..") || relativeTarget === "") {
    throw new Error(`Refusing to build outside the repository: ${resolvedTarget}`);
  }
}
