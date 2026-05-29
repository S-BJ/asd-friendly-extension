---
name: tests
description: node --test suite (44 tests) covering settings, sensitive-page, profiles, AI audit input, server CORS, and content/shared parity.
type: code
updated: 2026-05-30
---

# tests

Run with `npm test` (`node --test`). No browser needed — these are pure-logic tests; live-page checks live in `scripts/*audit*` / `*verify*`.

| File | Covers |
|------|--------|
| `settings-sensitive.test.mjs` | Settings normalization/clamps, comfort presets (incl. `adhd-focus`), site overrides, sensitive-page detection |
| `content-drift.test.mjs` | Asserts the content script's inlined `DEFAULT_SETTINGS`/`DEFAULT_SITE_OVERRIDE` match `shared/settings.js` (the duplication guardrail) |
| `extension-contract.test.mjs` | Manifest/build contract, including the build-excluded reference modules list |
| `profile-detection.test.mjs` / `page-profile.test.mjs` | Classifier detectors + profile/subtype normalization |
| `audit-ai.test.mjs` | AI audit input builder |
| `server-cors.test.mjs` | Backend origin allowlist behavior |
