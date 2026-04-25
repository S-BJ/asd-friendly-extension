# Foundation Design v1

This document defines the design concepts for the ASD-Friendly UI foundation. It describes what the extension should feel like and why each support stays user-controlled.

## Design Goal

The extension should make ordinary browsing calmer and more predictable without taking control away from the user. It is not a clinical intervention, and it should not assume that one sensory profile fits every autistic user.

The default experience is intentionally conservative:

- keep the page structure recognizable
- reduce common interruptions first
- make higher-variance changes opt-in
- make every visible intervention reversible or easy to disable
- preserve original controls on high-risk pages

## Core Principles

### 1. User Control First

Users must be able to turn the extension off globally and adjust major supports individually. Site-specific exceptions are required when a page depends on its original visual or interaction model.

### 2. Predictability Over Aggression

The extension should avoid hidden restructuring. It can soften motion, media, typography, contrast, and distractions, but it should not silently reorder page content or remove user-critical controls.

### 3. Conservative Defaults

`minimal-safe` is the default preset. By default, only reduced motion, autoplay muting, and the active state indicator are enabled.

Opt-in supports include:

- readable font normalization
- reduced contrast
- toggleable ad blocking and recoverable likely-ad/distraction collapsing
- reader mode
- community assist
- reading ruler
- image softening
- AI helper

### 4. Sensitive Page Protection

Sensitive contexts such as login, payment, account, health, legal, identity, and upload flows should preserve the original page as much as possible. In those contexts, layout-changing or meaning-changing supports are disabled automatically.

Sensitive pages may still keep low-risk supports such as reduced motion, autoplay muting, and the active state indicator.

## Interaction Model

### Popup Controls

The popup is the main control surface. It should provide:

- global on/off
- language selection
- comfort preset selection
- individual support toggles
- text size, line spacing, and page density controls
- AI helper setup and manual AI actions
- current-site exceptions

Controls should use plain labels and immediate saved feedback. The popup should avoid tutorial-like explanations inside the interface.

### Site Exceptions

Site exceptions exist because browser pages are highly variable. Current implemented exceptions include:

- disable extension here
- keep original colors
- keep original fonts
- keep original contrast
- allow likely ads/distractions
- allow autoplay
- disable image softening
- disable community assist
- disable reader mode

## Feature Concepts

### Reduced Motion

Animation and transitions are reduced to near-zero duration when enabled. This is a strong default because irrelevant motion can be distracting or uncomfortable.

### Autoplay Muting

Autoplaying media should be muted or paused when possible. This support is enabled by default because sudden sound and movement are common sensory interruptions.

### Active State Indicator

A small passive indicator shows that the extension is active and which page profile was detected. This reduces surprise without requiring the user to inspect the popup.

### Readable Font

When enabled, content text uses a readable sans-serif stack while code and monospace content keep monospace fonts. This support remains optional because font preference varies.

### Text Scale, Line Height, And Density

Text size, line spacing, and page density are adjustable. Density changes should be modest and disabled on sensitive pages to avoid disrupting forms or critical workflows.

### Theme And Reduced Contrast

Theme presets can soften the page, and reduced contrast can lower visual intensity. These are opt-in because lower contrast can help some users but harm readability for others.

### Ad And Distraction Reduction

Likely ad network requests can be blocked when the ad setting is enabled. Already-rendered likely ads or sponsored regions can also be collapsed. The DOM-side implementation should be conservative and recoverable: elements are marked and hidden rather than deleted from the DOM.

### Reader Mode

Reader mode is limited to detected article-like pages. It should improve text measure and readability without changing the meaning or order of content.

### Community Assist

Community assist targets dense discussion pages. It can improve readability and spacing, but it must preserve chronology, replies, voting, moderation controls, and visible context.

### Image Softening

Image softening is optional and default off. When enabled, images, video elements, and known embedded video frames are blurred by default and become visible while hovered or focused.

Design constraints:

- blur should not shift layout
- hover and keyboard focus should reveal the softened media
- no image, video frame, or thumbnail is uploaded or classified
- sensitive pages disable the feature automatically
- users can disable it globally or per site

This design treats image softening as a sensory-control option, not as a content judgment system.

### AI Helper

The AI helper is optional and manually triggered. It can explain selected text, visible page structure, or visible form structure. It must not click, submit, hide, reorder, or rewrite page DOM.

AI output should separate visible evidence from uncertainty. It should avoid claiming hidden knowledge about the user, typed values, identity, payment, medical, or legal meaning.

## Safety Rules

- Do not remove page controls permanently.
- Do not make high-variance supports default-on.
- Do not send page images for analysis.
- Do not run AI actions automatically.
- Do not simplify sensitive pages in ways that could change task meaning.
- Keep labels clear and reversible.

## Source Of Evidence

All research and institutional references are centralized in `docs/implementation-references-v1.md`.
