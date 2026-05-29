---
name: background
description: MV3 service worker — message router, settings storage, AI orchestration, declarative ad-block sync, site overrides.
type: code
updated: 2026-05-30
---

# src/background

Runs as an ES-module service worker (`manifest.json` → `background.service_worker`). Imports freely from `../shared`.

| File | Responsibility |
|------|----------------|
| `index.js` | Message router; settings get/set, tab context, AI request flow, declarative ad-block sync, site-override read/write (`get/set/clearSiteOverrideFromMessage`). Origin trust resolved in `getMessageOrigin` (prefers `sender.tab.url`) |
| `ai-client.js` | OpenAI direct calls + optional self-hosted backend POSTs; maps responses through `shared/ai-normalize` |
| `site-overrides.js` | Standalone override helpers — **build-excluded reference module**, not imported at runtime (background inlines the logic). Pinned by `tests/extension-contract.test.mjs` |
