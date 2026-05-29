---
name: popup
description: Browser-action popup UI — toggles, comfort presets, typography/focus controls, AI key + actions.
type: code
updated: 2026-05-30
---

# src/popup

ES-module popup; imports from `../shared`. Controls bind declaratively: `data-setting` (sync settings), `data-site-override` (per-site), `data-i18n` (en/ko strings live in `index.js`'s `UI_TEXT`).

| File | Responsibility |
|------|----------------|
| `index.html` | Markup: first-run preset grid, comfort preset select, feature toggles, typography ranges, **Focus & reading** section (spotlight/progress/chunking/scope/width), AI helper, site exceptions |
| `index.js` | Locale + i18n table, control binding (`readControlValue`/`writeControlValue`/`updateRangeOutput`), settings/local/site-override save, AI action runner (`runAiAction`, guarded by try/finally) |
| `styles.css` | Popup layout/theme |
