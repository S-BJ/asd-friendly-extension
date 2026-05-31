# Multi-Browser Support — v1

Status: **Chromium family supported by a single build** (Safari out of scope). Build targets + manifest overrides are in place. Firefox now uses a dual-key event-page background (`service_worker` + `scripts` + `type: module`) so the module background loads on Gecko; `web-ext lint` passes with **0 errors**. Remaining for Firefox: on-device load via `about:debugging`.

## Supported browsers

The extension uses only standard Chromium MV3 APIs (`runtime`, `commands`, `storage`, `tabs`, `scripting`, `declarativeNetRequest`) — no Chrome-only API — so **one Chromium build runs on the whole family**:

| Browser | Engine | How |
|---------|--------|-----|
| Chrome | Chromium | `dist/extension` / `chromium.zip` |
| Edge | Chromium | same build (or `dist/edge` for a separate store listing) |
| Brave, Opera, Vivaldi, Arc | Chromium | load the same `dist/extension` / `chromium.zip` |
| Firefox | Gecko | `dist/firefox` (adds `gecko` id) — scaffolded, verify on device |
| Safari | WebKit | **out of scope** (needs macOS + Xcode conversion) |

## Packaging for stores

```
npm run build      # dist/extension
npm run package    # dist/chromium.zip  (upload to Chrome Web Store / Edge Add-ons / Opera)
```

The chromium.zip has `manifest.json` at the archive root and excludes dev-only files (`_INDEX.md`). The same zip is accepted by all Chromium extension stores.

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
- **Firefox** — MV3. Firefox does **not** support `background.service_worker` at all (MDN: unsupported, bug 1573659); it requires an event page. The `firefox.json` override therefore adds `background.scripts` alongside the base `service_worker` (dual-key pattern — MDN's official cross-browser example): Chrome uses `service_worker`, Firefox uses `scripts`, both loaded as ES modules via the shared `type: "module"`. `strict_min_version: 140` is set deliberately: it clears the dual-key background-start fix (bug 1860304, FF 121), `type: "module"` background (FF 112), DNR static rulesets (FF 113), **and** the older-Gecko trouble spots flagged in review — MV3 host-permission grant issues on FF ≤126 and static-ruleset reload issues on FF ≤132 — while also being the first version that honors `data_collection_permissions`. Supporting 121–139 was rejected because the extension can be partially broken there (missing host permissions / DNR not reloading), so a broken old-Firefox experience is worse than requiring 140+ (a ~2025-mid release). `data_collection_permissions` declares `required: ["none"]` and `optional: ["websiteContent", "browsingActivity", "technicalAndInteraction"]` — matching what the opt-in AI helper transmits to the user's chosen provider: page text/headings/form labels (`websiteContent`), the page URL (`browsingActivity`), and UI language + model selection (`technicalAndInteraction`). The user's own API key is sent only to their own configured endpoint, so `authenticationInfo` is intentionally not declared. `web-ext lint --self-hosted` reports **0 errors**; the only two warnings are inherent and benign: `BACKGROUND_SERVICE_WORKER_IGNORED` (confirms Firefox falls through to `scripts`) and `KEY_FIREFOX_ANDROID_UNSUPPORTED_BY` (the data key is desktop-only on AMO; this extension does not target Firefox Android). Remaining: load `dist/firefox` via `about:debugging` and run the §3 feature checklist on device.
- **Safari** — requires `xcrun safari-web-extension-converter` on macOS + an Xcode project; cannot be built/verified in this (Windows) environment. Treat as a separate packaging track once the WebExtension is confirmed on Chromium + Firefox.

## Chrome APIs used (compat reference)

`storage` (sync/local + onChanged), `tabs`, `scripting`, `declarativeNetRequest` (static ruleset), `commands` (onCommand), `runtime` (messaging), `action`. All have Firefox MV3 equivalents under the `chrome` alias; the items flagged above are the ones worth confirming on-device.
