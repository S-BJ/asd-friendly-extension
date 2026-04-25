# Source Foundation

This folder is the runtime source layout for the rebuild. New builds are assembled from this folder into `dist/extension`.

Start with shared contracts:

- `shared/settings.js`
- `shared/messages.js`
- `shared/page-profile.js`
- `shared/feature-policy.js`
- `shared/sensitive-page.js`

Do not add AI-driven DOM hide, collapse, or reorder behavior.

Runtime entrypoints:

- `manifest.json`
- `background/index.js`
- `content/index.js`
- `content/styles.css`
- `popup/index.html`
- `popup/index.js`
- `popup/styles.css`
