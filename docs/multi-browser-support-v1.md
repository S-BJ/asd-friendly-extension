# Multi-Browser Support — v1 (common structure)

Status: **foundation in place** (build targets + manifest overrides + compat strategy). No browser-specific runtime forks yet; per-browser builds are verified to *produce* valid output, not yet manually tested in each browser.

## Strategy

1. **One source, per-browser manifests.** `src/manifest.json` is the Chrome/Chromium base. `build/manifest-overrides/<browser>.json` holds the deltas, deep-merged at build time by `scripts/build-extension.mjs`.
2. **`chrome.*` is the shared API surface.** All runtime code uses the callback-style `chrome.*` namespace, which is available in Chromium (Chrome/Edge) and in Firefox MV3 (Firefox exposes a callback-compatible `chrome` alias alongside the promise-based `browser`). No polyfill or `browser.*` rewrite is required for the APIs this extension uses.
3. **Browser-specific divergence stays in the manifest, not the code** wherever possible. Only if a runtime API genuinely diverges would we add a thin guarded wrapper.

## Build targets

| Command | Output | Notes |
|---------|--------|-------|
| `npm run build` | `dist/extension` | Chrome (default); byte-identical to the historical build (no override) |
| `npm run build:edge` | `dist/edge` | Chromium; identity (no override needed) |
| `npm run build:firefox` | `dist/firefox` | Merges `browser_specific_settings.gecko` |

Add a browser: drop `build/manifest-overrides/<browser>.json` and run `node scripts/build-extension.mjs --browser=<browser>`.

## Per-browser status & remaining work

- **Edge** — Chromium. Expected to work as-is. Remaining: store listing only.
- **Firefox** — MV3. Override adds the required `gecko.id` + `strict_min_version: 121` (first version with `background.service_worker`). Remaining to verify in a real Firefox: (a) `service_worker` background vs. needing a `background.scripts` event page on older targets; (b) `declarativeNetRequest` static ruleset behavior (FF 128+); (c) `commands` suggested keys; (d) `chrome.scripting`/`chrome.storage`/`chrome.tabs` parity. If an event-page background is needed, replace `background` wholesale in `firefox.json`.
- **Safari** — requires `xcrun safari-web-extension-converter` on macOS + an Xcode project; cannot be built/verified in this (Windows) environment. Treat as a separate packaging track once the WebExtension is confirmed on Chromium + Firefox.

## Chrome APIs used (compat reference)

`storage` (sync/local + onChanged), `tabs`, `scripting`, `declarativeNetRequest` (static ruleset), `commands` (onCommand), `runtime` (messaging), `action`. All have Firefox MV3 equivalents under the `chrome` alias; the items flagged above are the ones worth confirming on-device.
