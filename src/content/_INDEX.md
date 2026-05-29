---
name: content
description: Classic IIFE content script + CSS that apply visual supports to the page DOM. No imports — self-contained.
type: code
updated: 2026-05-30
---

# src/content

Injected into pages as a classic (non-module) script, so it **cannot import** from `../shared`; it keeps inlined copies of `DEFAULT_SETTINGS`/`DEFAULT_SITE_OVERRIDE`/`normalizeSettings` kept in parity with `shared/settings.js` by `tests/content-drift.test.mjs`.

| File | Responsibility |
|------|----------------|
| `index.js` | The runtime. `apply()` maps effective settings → `data-asd-*` attrs + `--asd-*` CSS vars; feature engines: contrast fix, ad collapse, image softening, reader target, reading ruler, **focus spotlight (A1)**, **reading progress (A2)**, **chunking/reading-width (B1/A3)**, assist panel. Pointer/scroll work is rAF-batched; observers debounced |
| `styles.css` | All `[data-asd-*]`-scoped rules + overlay element styles (`.asd-foundation-spotlight`, `.asd-foundation-progress`, ruler, indicator). Sensitive pages guarded via `:not([data-asd-sensitive-kind])` |

## classifier/ (build-excluded reference detectors)

`detect-community.js`, `detect-form.js`, `detect-portal.js`, `detect-reader.js`, `profile.js` — page-type detectors exercised by `tests/profile-detection.test.mjs` and the audit script. The content script inlines its own detection; these are the canonical reference + test surface, not shipped.
