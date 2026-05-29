---
name: build
description: Build-time configuration kept out of the shipped source — per-browser manifest overrides.
type: code
updated: 2026-05-30
---

# build

Configuration consumed by `scripts/build-extension.mjs`; not copied into `dist`.

## manifest-overrides/

Per-browser partial manifests deep-merged onto the base `src/manifest.json` at build time. Objects merge key-by-key; arrays/primitives in the override replace the base.

- Chrome (default): no override → `dist/extension` is byte-identical to the historical build.
- `firefox.json`: adds `browser_specific_settings.gecko` (id + min version). Firefox 121+ supports the `service_worker` background; if an older target is needed, add a `background.scripts` replacement here.
- Edge: Chromium — no override needed; build with `--browser=edge` for a separate `dist/edge` output.

Add a new browser by dropping `<browser>.json` here and running `node scripts/build-extension.mjs --browser=<browser>` (emits to `dist/<browser>`). See `docs/multi-browser-support-v1.md`.
