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
- Comfort presets (minimal-safe, soft light/dark calm, text-focused, motion-minimal, ADHD-focus)
- Reduced motion (forces reduced-motion, freezes animated GIFs, and tames video previews)
- Reduced screen contrast
- Readable font normalization
- Adjustable text size, line spacing, and page density
- Broader content theme application
- Toggleable ad network blocking plus recoverable likely-ad/distraction collapsing
- Autoplay muting
- Optional image softening with hover/focus reveal
- Reader mode toggle (engages only on detected long-form article pages, not homepages/feeds/index grids)
- Community-site assist toggle for Reddit, Clien, DCInside, FMKorea, Inven, Ruliweb, and similar dense pages
- Reading ruler toggle
- ADHD focus & reading supports: focus spotlight (line/paragraph place-keeping), reading progress with estimated time left, adjustable letter spacing, word spacing, and reading width, and long-text chunking (all opt-in, sensitive-page aware)
- Optional AI reading assist: opt-in, read-only summaries of a selection, the page, or a form (needs your own OpenAI key) — see [AI Assist](#ai-assist) below
- Keyboard shortcuts (run AI analysis / toggle extension / focus spotlight / reader mode; rebindable at `chrome://extensions/shortcuts`)
- Optional on-page floating quick-toggle for common controls
- Active state indicator
- Site-specific overrides
- First-run comfort setup
- Popup language: auto-detected, with manual English/Korean override
- Uncertain/high-variance supports kept behind toggles

The optional AI assist is read-only — it produces summaries in an on-page panel and never hides, collapses, or reorders page content.

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

Edge can use a separate listing via `npm run build:edge`. Firefox (`npm run build:firefox` → `dist/firefox`) uses a dual-key event-page background so the module background loads on Gecko, and passes `web-ext lint` with 0 errors; it still needs an on-device load via `about:debugging` to be fully verified. Safari is out of scope (needs macOS + Xcode). See `docs/multi-browser-support-v1.md`.

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

## AI Assist

When AI is enabled, the selection, page-summary, and form actions all return the same calm, predictable summary shape, rendered in a single on-page panel:

- **Key points** — at most 3, most important first
- **Do this next** — exactly one concrete next action, or an explicit "nothing required"
- **Watch out** — only genuinely important cautions, plus a literal restatement of any idiom, sarcasm, or ambiguous wording (`'phrase' = plain meaning`)
- **More detail** — secondary notes kept collapsed (progressive disclosure)
- **Confidence note** — a quiet footer line saying whether the result is based only on visible text or includes interpretation

The model is instructed to summarize the actual content rather than the page's structure or controls, to avoid inventing unsupported content, and to return schema-compliant JSON only. Each action shows a loading indicator and a retry control.

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
