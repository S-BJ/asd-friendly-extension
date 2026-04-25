# LLM Implementation Blueprint v1

This document is the implementation blueprint for the foundation design. It describes how the current extension maps design concepts into settings, runtime behavior, and tests.

## Current Architecture

Runtime source lives under `src/`:

- `src/manifest.json`: Chrome MV3 manifest
- `src/background/index.js`: settings, AI actions, and message routing
- `src/background/ai-client.js`: direct OpenAI request formatting
- `src/background/site-overrides.js`: origin-based override storage helpers
- `src/content/index.js`: page profiling, effective settings, DOM-safe runtime behavior
- `src/content/styles.css`: CSS-based page adaptations
- `src/popup/index.html`: popup control structure
- `src/popup/index.js`: popup state, i18n, and save actions
- `src/rules/ad-block.json`: MV3 declarative network request ad rules
- `src/shared/settings.js`: settings schema, defaults, presets, normalization
- `src/shared/sensitive-page.js`: sensitive-context detection
- `src/shared/feature-policy.js`: feature policy metadata

Optional local backend source lives under `server/`.

## Runtime Contract

The extension follows a conservative foundation contract:

- `minimal-safe` is the default preset.
- Reduced motion, autoplay muting, and active state indication are enabled by default.
- Higher-variance supports are opt-in.
- Sensitive pages disable layout-changing or meaning-changing supports.
- AI helper actions are manually triggered.
- AI is not used to hide, reorder, click, submit, or restructure the page.

## Settings Schema

The current sync settings include:

```json
{
  "enabled": true,
  "uiLanguage": "auto",
  "firstRunComplete": false,
  "activeComfortPreset": "minimal-safe",
  "themePreset": "soft-light",
  "textScale": 100,
  "lineHeight": 1.7,
  "pageDensity": "normal",
  "readableFontEnabled": false,
  "reduceContrastEnabled": false,
  "readerMode": false,
  "communityAssistEnabled": false,
  "adRemovalEnabled": false,
  "reduceMotion": true,
  "muteAutoplay": true,
  "imageSofteningEnabled": false,
  "imageSofteningStrength": "medium",
  "readingRuler": false,
  "aiHelperEnabled": false,
  "aiGentleSuggestions": true,
  "assistPanelDefaultOpen": false,
  "showActiveStateIndicator": true
}
```

The current local site override shape includes:

```json
{
  "disabled": false,
  "keepOriginalColors": false,
  "keepOriginalFonts": false,
  "allowAds": false,
  "disableContrastReduction": false,
  "allowAutoplay": false,
  "disableImageSoftening": false,
  "disableAiSuggestions": false,
  "disableCommunityAssist": false,
  "disableReaderMode": false
}
```

## Presets

`COMFORT_PRESETS` in `src/shared/settings.js` defines preset deltas.

Implementation rules:

- Presets are normalized through `normalizeSyncSettings()`.
- Applying a preset sets `activeComfortPreset` and marks first-run setup complete.
- Presets should not silently enable AI helper.
- Presets should avoid enabling image softening by default.

## Effective Settings

`src/content/index.js` computes effective settings from:

- normalized sync settings
- current-site override
- detected page profile
- detected sensitive page kind

Sensitive contexts force these supports off:

- theme recoloring
- readable font normalization
- contrast reduction
- page density changes beyond normal
- reader mode
- community assist
- recoverable distraction collapsing
- image softening

## DOM Attributes

The content script applies root attributes on `document.documentElement`:

- `data-asd-foundation`
- `data-asd-force-light`
- `data-asd-motion-off`
- `data-asd-font`
- `data-asd-ad-removal`
- `data-asd-reduce-contrast`
- `data-asd-reader`
- `data-asd-community-assist`
- `data-asd-ai-gentle`
- `data-asd-image-softening`
- `data-asd-theme`
- `data-asd-density`
- `data-asd-profile`
- `data-asd-community-subtype`
- `data-asd-sensitive-kind`

CSS adaptations must key off these attributes rather than making one-off DOM mutations when CSS is sufficient.

## Image Softening Implementation

Image softening is implemented as CSS-backed visual softening:

- popup toggle: `imageSofteningEnabled`
- site exception: `disableImageSoftening`
- root attribute: `data-asd-image-softening`
- CSS variable: `--asd-image-softening-blur`
- default strength: `medium` / `8px`

Behavior:

- images, video elements, and known embedded video frames are blurred while the feature is enabled
- hover or focus reveals the softened media
- linked and button-contained images reveal on parent hover/focus
- reduced contrast filters are preserved when both features are active
- sensitive pages disable the attribute through effective settings

The feature does not upload, classify, or infer image or video-frame content.

## Ad Blocking And Recoverable Distraction Collapsing

When `adRemovalEnabled` is on, the background worker enables the `asd_ad_block` declarative network request ruleset. This blocks a small conservative list of common ad network requests.

The same toggle also enables DOM-side cleanup for already-rendered likely ads and sponsored regions. Candidates are marked with `data-asd-ad-collapsed`. CSS hides marked elements only while ad removal is active.

Implementation rules:

- keep the network ruleset disabled by default
- enable the ruleset only while the user ad setting is on
- prepare the active tab runtime after popup setting changes, so existing tabs respond without requiring a manual reload
- do not delete candidate nodes
- provide restore behavior through content script controls
- keep heuristics conservative
- disable on sensitive pages

## AI Helper Blueprint

AI helper actions are available only when `aiHelperEnabled` is on and the user presses a popup action.

Actions:

- explain selected text
- explain this page
- explain this form

Page guide responses include:

- page purpose
- important areas
- visible main actions
- likely next step
- optional or secondary areas
- warnings or confusing points
- unknowns
- confidence note

Form guide responses include:

- form purpose
- required fields
- optional fields
- important warnings
- time-sensitive warnings
- review before submit
- suggested steps
- confidence note

Prompt constraints:

- explain only visible context supplied to the model
- do not infer hidden user intent or hidden state
- do not give medical, legal, financial, or identity conclusions
- mark uncertainty explicitly

## Popup Blueprint

The popup exposes:

- global on/off
- language selector
- comfort preset selector
- reduced motion
- reduced contrast
- readable font
- hide likely ads
- mute autoplay
- reader mode
- community assist
- reading ruler
- active state indicator
- image softening
- page density
- text size
- line spacing
- AI helper setup and actions
- current-site exceptions

The UI style should remain stable unless a design change is explicitly requested.

## Verification Matrix

| Area | Verification |
|---|---|
| Settings defaults | `tests/settings-sensitive.test.mjs` |
| Popup controls | `tests/extension-contract.test.mjs` |
| Manifest permissions | `tests/extension-contract.test.mjs` |
| Toggleable ad network rules | `tests/extension-contract.test.mjs` |
| Recoverable distractions | `tests/extension-contract.test.mjs` |
| AI schema fields | `tests/extension-contract.test.mjs` |
| Server CORS | `tests/server-cors.test.mjs` |

Run:

```powershell
npm test
npm run build
```

## Build Output

`npm run build` copies extension runtime files from `src/` to `dist/extension`.

The source of truth remains `src/`, not `dist/`.

## Reference Source

All research and institutional references are centralized in `docs/implementation-references-v1.md`.
