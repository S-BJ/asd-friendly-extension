# Session Handoff

This document is the first file to read when continuing work in a new session.

## Project

ASD-Friendly UI is a Chrome MV3 extension that applies optional comfort supports:

- readable font and spacing controls
- soft theme and contrast controls
- image softening
- ad network blocking and recoverable ad collapsing
- reader/community assists
- manual AI helper actions
- AI-assisted site audit mode

The extension should stay conservative. Do not use AI or DOM heuristics to click, submit, reorder, delete, or silently rewrite page content.

## Current Status

Recent focus:

- DCInside image softening and ad collapsing
- broad site audit across video, text, community, news, blog, business, SNS, ad-heavy, and public-service sites
- AI audit mode for summarized runtime metrics
- large community stability, especially DCInside-like pages
- embedded video thumbnail softening on wiki-style pages

Latest verified community result:

- DCInside profile: `community`
- DCInside large-image blur: `16/16`
- DCInside collapsed ads: `6`
- Reddit profile: `community`
- Reddit large-image blur: `62/62`
- Reddit collapsed ads: `50`

Latest audit report:

- `audit-reports/site-audit-media-20260425-022416.json`

Progress notes:

- `docs/site-audit-progress-v1.md`

## Key Files

- `src/content/index.js`: main runtime classification and page adaptation logic
- `src/content/styles.css`: CSS adaptations for content pages
- `src/content/classifier/detect-form.js`: importable form-profile classifier used by tests
- `src/shared/sensitive-page.js`: sensitive page detection
- `src/rules/ad-block.json`: declarative network request ad rules
- `scripts/audit-extension-sites.mjs`: site audit and AI audit mode
- `tests/profile-detection.test.mjs`: community/form profile regression tests
- `tests/settings-sensitive.test.mjs`: sensitive page regression tests
- `tests/audit-ai.test.mjs`: AI audit sanitization tests

## Verification Commands

Run these before handing work back after behavior changes:

```powershell
npm test
npm run build
```

For site audits:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-isolated-chrome.ps1 -Browser chrome -RemoteDebuggingPort 9224
$env:ASD_AUDIT_CDP_PORT="9224"
npm run audit:sites
```

For AI-assisted audit recommendations:

```powershell
$env:ASD_AUDIT_CDP_PORT="9224"
$env:OPENAI_API_KEY="your-openai-api-key"
npm run audit:sites:ai
```

The AI audit input should remain privacy-preserving:

- no raw HTML
- no typed input values
- no raw image URLs
- no image alt text
- only compact runtime metrics and limited ad-candidate labels

## Maintenance Flow

When starting a new task:

1. Read this file and `docs/site-audit-progress-v1.md`.
2. Inspect current changes before editing.
3. Preserve existing feature toggles and current-site exceptions.
4. Keep sensitive pages conservative.
5. Add focused regression tests for any classification or site-specific fix.
6. Run `npm test` and `npm run build`.
7. If behavior changed on real sites, run `npm run audit:sites`.
8. Update `docs/site-audit-progress-v1.md` with the change and latest result.

## Community Stability Rules

Community pages often contain fields that look sensitive but are not account or payment workflows.

Treat these as routine community UI when the page is already classified as community:

- comment and reply inputs
- search and filter forms
- nickname fields
- anonymous comment password fields
- captcha fields
- write/post controls
- attachment controls inside comment or post widgets

Still keep `form` profile for high-risk flows:

- checkout or payment
- billing or card entry
- account security or password change
- identity verification
- passport, license, or resident-number entry
- application or official document submission

## Known Watch Points

- Community sites frequently use password fields for anonymous comments. Keep tests around this.
- Ad selectors should stay recoverable by marking/collapsing likely ads, not deleting DOM nodes.
- Image softening must remain user-controlled and disabled on sensitive pages.
- Image softening covers images, video elements, and known embedded video frames; keep raw iframe URLs and video IDs out of AI audit input.
- AI audit mode can suggest changes, but deterministic tests and site audits should confirm them.
- Avoid reintroducing old project-layout wording that the docs previously removed.
