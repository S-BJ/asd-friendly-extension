import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "src");
const distRoot = join(repoRoot, "dist");
const extensionDist = join(distRoot, "extension");
const distributionReadmeSource = join(repoRoot, "docs", "distribution-readme-ko.md");

const sourceAssets = [
  "manifest.json",
  "background",
  "content",
  "popup",
  "rules",
  "shared"
];

await ensureInsideRepo(extensionDist);
await rm(extensionDist, { recursive: true, force: true });
await mkdir(extensionDist, { recursive: true });

for (const asset of sourceAssets) {
  await copyRequiredFromSource(asset);
}

await copyOptionalDirectory("icons");
await copyOptionalDirectory("public");

const manifest = await readManifest(join(extensionDist, "manifest.json"));
await validateManifestReferences(manifest);
await writeBuildMetadata(manifest);
await copyDistributionReadme();

console.log(`Built extension at ${relative(repoRoot, extensionDist)}`);

async function copyRequiredFromSource(relativePath) {
  const source = join(sourceRoot, relativePath);
  if (!existsSync(source)) {
    throw new Error(`Required source extension asset is missing: src/${relativePath}`);
  }

  const destination = join(extensionDist, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
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
