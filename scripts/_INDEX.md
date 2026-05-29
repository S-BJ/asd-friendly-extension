---
name: scripts
description: Build, backend launch, and CDP-based audit/verification tooling.
type: code
updated: 2026-05-30
---

# scripts

| File | Responsibility |
|------|----------------|
| `build-extension.mjs` | Copies `src` → `dist/<target>`, deep-merges per-browser manifest overrides (`--browser`), validates manifest references, excludes reference-only modules + dev `_INDEX.md`. No bundler — content script ships as-is |
| `package-extension.mjs` | Zips a built target for store upload (`npm run package` → `dist/chromium.zip`); dependency-free, native zip per platform |
| `start-openai-backend.ps1` / `.sh` | Launch the optional self-hosted relay; prompt for the API key if unset |
| `launch-isolated-chrome.ps1` | Launch Chrome/Edge with an isolated profile + the built extension (optionally remote-debugging) |
| `audit-extension-sites.mjs` | CDP accessibility/ad-detection audit across configured sites (`npm run audit:sites`, `--ai` for recommendations) |
| `verify-extension-toggles.mjs` | CDP toggle/storage/messaging integration check (`npm run verify:toggles`) |
