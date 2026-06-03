---
name: shared
description: Framework-agnostic logic shared by background, content, and popup — settings schema, AI prompt/schema/normalize, page classification, i18n.
type: code
updated: 2026-05-30
---

# src/shared

Pure modules with no DOM or Chrome-API dependency, importable by the background service worker and popup (ES modules). The classic content script cannot import these, so it keeps inlined copies kept in parity by `tests/content-drift.test.mjs`.

| File | Responsibility |
|------|----------------|
| `settings.js` | Sync/local settings defaults, normalization/clamps, comfort presets (incl. `adhd-focus`), site overrides |
| `feature-policy.js` | Evidence-graded feature registry (`FEATURE_DEFAULT_POLICY`). Reference/contract data — build-excluded, not shipped |
| `sensitive-page.js` | Detects login/payment/identity/upload/health pages so supports back off |
| `page-profile.js` | Page profile + community subtype enums and normalizers |
| `ai-instructions.js` | Builds system prompts for selection/page/form explanations (+ sensitive-context guardrails) |
| `ai-schemas.js` | JSON Schemas for structured AI output (selection, page summary incl. `key_points`, form) |
| `ai-normalize.js` | Shapes/clamps raw AI JSON into camelCase render payloads |
| `i18n.js` | Locale resolution (en/ko/auto) |
| `messages.js` | `MESSAGE_TYPES` constants for runtime message dispatch |
| `openai-models.js` | Supported model IDs + normalization |
