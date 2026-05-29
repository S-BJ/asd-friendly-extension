# ASD-Friendly UI

A Chrome extension rebuild focused on calm, predictable, user-controlled browsing supports for autistic users.

## Current Direction

Runtime code lives under:

- `src/manifest.json`
- `src/background`
- `src/content`
- `src/popup`
- `src/shared`

## Foundation Features

- Global on/off control
- Comfort presets
- Reduced motion
- Reduced screen contrast
- Readable font normalization
- Broader content theme application
- Toggleable ad network blocking plus recoverable likely-ad/distraction collapsing
- Autoplay muting
- Optional image softening with hover/focus reveal
- Reader mode toggle
- Community-site assist toggle for Reddit, DCInside, Ruliweb, and similar dense pages
- Reading ruler toggle
- ADHD focus & reading supports: focus spotlight (line/paragraph place-keeping), reading progress with estimated time left, adjustable letter spacing and reading width, and long-text chunking (all opt-in, sensitive-page aware)
- Keyboard shortcuts (toggle extension / focus spotlight / reader mode; rebindable at `chrome://extensions/shortcuts`)
- Optional on-page floating quick-toggle for common controls
- Active state indicator
- Site-specific overrides
- First-run comfort setup
- English/Korean popup language selection
- Uncertain/high-variance supports kept behind toggles

The foundation does not add AI-driven DOM hiding, collapsing, or reordering.

## Build

```powershell
npm run build
```

## Supported browsers

A single Chromium build runs across the Chromium family — Chrome, Edge, Brave, Opera, Vivaldi, Arc:

```powershell
npm run build      # dist/extension
npm run package    # dist/chromium.zip (Chrome Web Store / Edge Add-ons / Opera)
```

Edge can use a separate listing via `npm run build:edge`. Firefox is scaffolded (`npm run build:firefox` → `dist/firefox`) but not yet device-verified. Safari is out of scope (needs macOS + Xcode). See `docs/multi-browser-support-v1.md`.

AI can run directly from the extension when you enter an OpenAI API key in the popup.

The local backend is now optional and is only needed if you want a self-hosted relay:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-openai-backend.ps1
```

On macOS/Linux:

```bash
bash ./scripts/start-openai-backend.sh
```

If `OPENAI_API_KEY` is not already set in env or config, both scripts prompt for it in the console and use it for that launch only.

Direct mode stores the API key in extension local storage. If you do not want the key stored in the extension, use the self-hosted backend instead.

Load this folder in `chrome://extensions`:

- `dist/extension`

For a disposable browser profile, you can also launch the built extension directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser edge
```

The local backend only accepts requests from the fixed packaged extension ID by default, so other Chrome extensions on the same machine cannot use your OpenAI key. For unpacked builds, set `ALLOWED_EXTENSION_ORIGINS` to your generated `chrome-extension://...` origin (or a comma/space-separated list). If you really want to accept any unpacked extension during local development, set `ASD_FRIENDLY_ALLOW_ANY_EXTENSION_ORIGIN=1`.

## Site Audit

Launch an isolated browser with remote debugging:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser chrome -RemoteDebuggingPort 9224
```

Run the local site audit:

```powershell
$env:ASD_AUDIT_CDP_PORT="9224"
npm run audit:sites
```

Run the local toggle verification against a browser launched with remote debugging:

```powershell
$env:ASD_TOGGLE_CDP_PORT="9224"
npm run verify:toggles
```

For AI-assisted audit recommendations, set an API key and use:

```powershell
$env:OPENAI_API_KEY="your-openai-api-key"
$env:ASD_AUDIT_CDP_PORT="9224"
npm run audit:sites:ai
```

AI audit mode sends only summarized runtime metrics. It does not send raw HTML, typed input values, image URLs, or image alt text.

## Design Docs

- `docs/foundation-design-v1.md`
- `docs/llm-implementation-blueprint-v1.md`
- `docs/implementation-references-v1.md`
- `docs/adhd-support-design-v1.md`
- `docs/multi-browser-support-v1.md`
