---
name: runtime-verification
description: How to load and manually verify the built extension in Chromium browsers (Edge/Brave/Chrome) and Firefox.
type: docs
updated: 2026-05-30
---

# Runtime Verification — v1

Tests (`npm test`) cover pure logic only. This is the on-device check: load the build and confirm the UI behaves. Do this in at least one Chromium browser + Firefox.

## 0. Build first

```powershell
npm run build           # dist/extension  (Chromium: Chrome/Edge/Brave/Opera/Vivaldi)
npm run build:firefox   # dist/firefox
```

## 1. Chromium (Edge / Brave / Chrome)

### Fastest: isolated-profile launcher (loads the extension automatically)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser edge
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser brave
```

It opens a throwaway profile with `dist/extension` side-loaded and lands on `chrome://extensions` + a test page. Add `-ResetProfile` for a clean slate.

### Manual load (any Chromium browser)

1. Open `edge://extensions` / `brave://extensions` / `chrome://extensions`.
2. Enable **Developer mode**.
3. **Load unpacked** → select `dist/extension`.
4. Pin the action icon; open the popup.

### Optional: automated toggle check over CDP

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser edge -RemoteDebuggingPort 9224
$env:ASD_TOGGLE_CDP_PORT="9224"; npm run verify:toggles
```

`verify:toggles` exercises foundation toggles **and** the ADHD/quick-toggle features (spotlight, progress, chunking, letter-spacing, reading-width, quick-toggle) plus sensitive-page suppression, against the real browser via CDP. If the MV3 service worker has gone idle, target discovery fails with "Extension ID could not be resolved" — set `ASD_EXTENSION_ID` to the id shown on the extensions page (stable per `--load-extension` path) and rerun:

```powershell
$env:ASD_TOGGLE_CDP_PORT="9224"; $env:ASD_EXTENSION_ID="<id>"; npm run verify:toggles
```

Verified on Edge 148 (Chromium): **30/30 checks pass** — generalizes to Chrome/Brave/other Chromium browsers (same engine). Firefox: `dist/firefox` builds with a dual-key event-page background and passes `web-ext lint --self-hosted` (0 errors); not yet device-verified — load it via §2 and run the §3 checklist.

## 2. Firefox

1. `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on…** → select `dist/firefox/manifest.json`.
4. Inspect the background: same page → the add-on's **Inspect** button → Console, to catch service-worker errors.

Firefox does not support `background.service_worker`, so `firefox.json` adds `background.scripts` (dual-key event page) and the override already ships in `dist/firefox`. `strict_min_version: 140` clears the dual-key background-start fix (bug 1860304, FF 121), older-Gecko host-permission (≤126) and DNR static-ruleset reload (≤132) issues, and is the first version honoring `data_collection_permissions`. Caveats to confirm on device:

- Background registers without error (about:debugging → this add-on → Inspect → Console). The module event page should load `ai-client.js`/`shared/*` imports cleanly.
- `declarativeNetRequest` ad-block toggling works (FF 113+ for static rulesets).
- `commands` shortcuts register (`about:addons` → manage → shortcuts).

## 3. Feature checklist (run in each browser)

On a normal article page with the extension enabled:

- [ ] Popup opens; toggles persist after reopening
- [ ] Comfort presets apply (try **ADHD focus**)
- [ ] **Focus spotlight**: dims page, follows pointer (paragraph + line scope)
- [ ] **Reading progress**: top bar + "~N min left" on an article
- [ ] **Letter spacing / reading width / chunking** visibly change body text
- [ ] **Quick toggle** (enable `showQuickToggle`): floating button bottom-left toggles work
- [ ] **Shortcuts**: Alt+2 on/off, Alt+3 spotlight, Alt+4 reader (rebind at the browser's shortcuts page)
- [ ] **Ad/distraction collapse**, **reduce motion**, **reader mode** behave
- [ ] **Sensitive pages** (a login/checkout page): spotlight/progress/theme back off
- [ ] **AI helper** (with a key): "Explain this page" shows Key points first

## 4. Reporting issues

Note browser + version, the page URL, and the console error (popup: right-click → Inspect; background: the extensions page → service worker/Inspect; content: page DevTools console).
