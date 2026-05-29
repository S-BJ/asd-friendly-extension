---
name: server
description: Optional self-hosted relay that holds the OpenAI key server-side instead of in extension storage.
type: code
updated: 2026-05-30
---

# server

Optional. Only needed if you prefer not to store the OpenAI key in the extension. Launched via `scripts/start-openai-backend.*`.

| File | Responsibility |
|------|----------------|
| `index.mjs` | HTTP server: `/health` + explain-selection/summarize-page/explain-form endpoints; forwards to OpenAI with the shared prompt/schema modules |
| `cors.mjs` | Origin allowlist — restricts to the packaged extension ID by default; `ALLOWED_EXTENSION_ORIGINS` / `ASD_FRIENDLY_ALLOW_ANY_EXTENSION_ORIGIN` opt-ins. Tested by `tests/server-cors.test.mjs` |
| `.env.local.example` | Template for `OPENAI_API_KEY` / allowed origins |
