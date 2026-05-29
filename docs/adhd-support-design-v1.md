# ADHD Support — Design v1

Status: **Phase 1 + 2 implemented** (A1 focus spotlight, A2 reading progress, A3 letter-spacing + reading-width, B1 chunking, B2 key-points AI mode, C2 `adhd-focus` preset). Phase 3 (C1 re-engagement nudge) deferred.
Scope: add ADHD-oriented visual/attention supports on top of the existing ASD-friendly foundation, following the same conservative, evidence-graded, toggle-gated philosophy.

## Implementation notes (v1)

- All new sync keys (`focusSpotlight`, `focusSpotlightScope`, `readingProgress`, `letterSpacing`, `readingWidth`, `readerChunking`) default OFF/neutral and are normalized/clamped in both `src/shared/settings.js` and the inlined copy in `src/content/index.js` (kept in sync; enforced by `tests/content-drift.test.mjs`).
- Spotlight uses a `box-shadow` window overlay (`.asd-foundation-spotlight`) — never mutates page DOM. Paragraph scope sizes to the block under the pointer; line scope is a fixed band. Pointer/scroll work is `requestAnimationFrame`-batched.
- Reading progress (`.asd-foundation-progress`) shows only on reader-profile pages; word count estimated from the detected reading container (~220 wpm).
- Chunking / reading-width scope to the detected article via a `data-asd-read-shape` marker, so they never reflow arbitrary pages; all gated by `:not([data-asd-sensitive-kind])`.
- Sensitive pages (login/payment/identity/upload) suppress spotlight, progress, chunking, letter-spacing, and reading-width via `getEffectiveSettings`.
- B2 adds a `key_points` array to `PAGE_SUMMARY_SCHEMA`, rendered first (TL;DR) in the assist panel; the page prompt now also asks for shorter, plainer, calmer output.
- Tests: `tests/settings-sensitive.test.mjs` covers the new defaults, clamps, enum, `adhd-focus` preset, and site-override flags (44 tests total, all passing).

### Known limitations

- **Spotlight dim on transformed roots:** the `box-shadow: 0 0 0 100vmax` window is clipped on sites that put `transform` / `will-change: transform` / `perspective` on `<html>` or `<body>` (it creates a new containing block for fixed elements). Effect: the dimming may not cover the full viewport on those sites. This is graceful degradation (the spotlight still tracks; the surround is just less dark), not a break. A full fix would require a different dimming primitive (e.g. four edge panels or an SVG mask) — deferred as not worth the added complexity.
- `syncFocusSpotlight` / `syncReadingProgress` are idempotent (guarded by `spotlightEnabled` / `progressEnabled`); word count for the time estimate is recomputed lazily and re-marked stale on every `refreshPageClassification` so SPA content swaps re-estimate.

## 1. Research basis (visual / attention traits)

Evidence strength tags: **[study]** peer-reviewed · **[std]** standards-body (W3C COGA) · **[opinion]** industry blog/forum.

| Trait | Note | Source / strength |
|---|---|---|
| Distractibility from peripheral clutter & motion | Cluttered UI (suggested content, ads, popups, autoplay thumbnails), flashing, motion are top frustrations for ADHD users | CHI 2025 video-accessibility **[study]**; COGA "minimize distractions" **[std]** |
| Difficulty sustaining attention on long text | Focus drifts, rereading needed; short sustained-attention windows | COGA focus objective **[std]**; **[opinion]** |
| Place-keeping (losing the current line) | Drift between lines, lose the passage, reread | **[opinion]** (rationale only; no ADHD-specific controlled trial) |
| Visual crowding sensitivity | Crowding degrades reading eye-movements; relieved by attention to target | crowding studies on dyslexia/general pops **[study]** (ADHD applicability inferential) |
| Working-memory load while reading | Hard to retain what was just read | COGA memory objective **[std]**; **[opinion]** |
| Time blindness / impaired time perception | Impaired time estimation & reproduction; worse for longer intervals | IJERPH 2023 narrative review **[study]** |
| Customization > fixed value | ADHD readers preferred adjustable font/size/brightness/background; no single best size/font emerged | CHI 2026 pupillometry/typography **[study]** |
| Task-switch / dopamine-driven scrolling | Trouble starting/switching; mindless binge scrolling | CHI 2025 video-accessibility **[study]** |

Full source list with credibility tags is at the end.

## 2. What the foundation already covers (overlap — reuse, don't rebuild)

These existing features already address the ASD↔ADHD **shared** load-reduction needs:

- `reduceMotion`, `muteAutoplay` — peripheral motion / autoplay
- `adRemovalEnabled` + distraction collapsing — peripheral clutter
- `readerMode` — distraction-free single-column view
- `readableFontEnabled`, `textScale`, `lineHeight`, `pageDensity`, theme presets — typography/contrast adjustability
- `readingRuler` — a horizontal band aid (partial place-keeping)
- `imageSofteningEnabled` — overstimulation
- AI `summarize-page` action — retention support (currently generic)

**Conclusion:** ADHD support should NOT duplicate these. It should add the **ADHD-emphasized** layer: place-keeping focus, time/progress cues, finer typography control, chunking, and (cautiously) re-engagement nudges.

## 3. Proposed features

Each feature lists: rationale, evidence tag (reusing the project's `evidence` vocabulary in `feature-policy.js`), default, and whether it is new vs. an extension of existing.

### Tier A — strong fit, recommended for Phase 1

**A1. Focus spotlight (place-keeping)** — *new, ADHD-specific*
- Dim the page and brighten only the paragraph (or a line band) under the reading position / pointer. Extends the existing `readingRuler` concept from a thin band to a readable spotlight.
- Non-destructive: a CSS overlay + pointer/scroll tracking. Reuse the ruler's `requestAnimationFrame` (`moveRuler`/`rulerRafPending`) pattern. No DOM reordering.
- Evidence: dynamic-highlight requests **[study]** + place-keeping rationale **[opinion]** → policy `evidence: "plausible-place-keeping"`.
- Default OFF, global toggle. Scope option: `line | paragraph`.
- **Respect sensitive pages** (skip spotlight on login/payment/identity), like other content features.

**A2. Reading progress + estimated time (time blindness)** — *new, ADHD-specific*
- Thin top progress bar + "~N min left" badge, shown only on article/reader-profile pages (reuse `detect-reader` profile). Compute from scroll position and word count (~200–250 wpm).
- Non-destructive overlay inside the existing assist UI shadow host (avoids page CSS collisions).
- Evidence: structure/progress cues **[study]** + time-perception deficit rationale **[study]** → `evidence: "time-blindness-support"`.
- Default OFF, global toggle.

**A3. Finer typography controls (customization > fixed)** — *extends existing*
- Add adjustable `letterSpacing` and `readingWidth` (max line length / measure, e.g. 60–80ch) on top of existing `textScale`/`lineHeight`. Applied via CSS variables in readable/reader mode.
- Evidence: CHI typography study — adjustability mattered more than any fixed value **[study]** → `evidence: "readability-support-preference-varies"` (same as `readableFont`).
- Defaults preserve current look (letterSpacing 0, width "off").

### Tier B — good fit, reuses existing layers

**B1. Chunking long content (sustained attention + working memory)** — *extends reader mode*
- CSS-only "breathing room": cap content measure, increase inter-paragraph spacing, optional subtle section dividers. **No DOM reordering** (foundation rule). Pairs naturally with A1 + reader mode.
- Evidence: COGA chunking **[std]** + CHI **[study]** → `evidence: "segment-content"`.
- Could ship as a `readerChunking` sub-option of reader mode rather than a standalone engine.

**B2. "Key points" AI mode (retention)** — *reuses existing AI helper*
- Add a short bulleted TL;DR / key-points output to the existing `summarize-page` action (an output style, not a new pipeline). Honors the existing privacy posture (summary metrics only; same sensitive-page guards).
- Evidence: summaries requested **[study]** → `evidence: "confirmed-direction-dismissible"`.

### Tier C — uncertain / behavioral, toggle-gated, later

**C1. Dwell / re-engagement nudge (task-switch, doom-scroll)** — *new, high variance*
- Optional, dismissible gentle reminder after a long continuous scroll/dwell. Mirrors `aiGentleSuggestions` style. Easy to annoy → **default OFF**, clearly dismissible, frequency-capped.
- Evidence: problem is documented **[study]** but no tested fix → `evidence: "plausible-high-variance"`.

**C2. "ADHD focus" comfort preset** — *composition, no new engine*
- A new entry in `COMFORT_PRESETS` bundling `reduceMotion` + `adRemovalEnabled` + readable typography + `focusSpotlight` + `readingProgress`. Improves discoverability with zero new runtime logic. Add after A1/A2 exist.

## 4. Architecture mapping (touchpoints)

| Layer | File | Change |
|---|---|---|
| Settings schema | `src/shared/settings.js` | add keys to `DEFAULT_SYNC_SETTINGS`; booleans → `BOOLEAN_SYNC_KEYS`; numerics → `normalizeSyncSettings` clamps (`letterSpacing`, `readingWidth`); add `adhd-focus` to `COMFORT_PRESETS` |
| Feature policy | `src/shared/feature-policy.js` | add `FEATURE_KEYS` + `FEATURE_DEFAULT_POLICY` entries with evidence tags + `siteOverride` flags |
| Site overrides | `src/shared/settings.js` | optional `disableFocusSpotlight` / `disableReadingProgress` in `DEFAULT_SITE_OVERRIDE` |
| Content runtime | `src/content/index.js` | spotlight (reuse ruler rAF), progress overlay (reader profile), typography CSS vars, chunking classes; gate all on `enabled` + sensitive-page kind |
| Styles | `src/content/styles.css` (+ assist shadow `ASSIST_UI_STYLES`) | spotlight dim/highlight, progress bar, spacing vars |
| Popup | `src/popup/index.html`, `index.js`, `src/shared/i18n.js` | toggles + EN/KO strings; respect first-run + preset wiring |
| AI (B2) | `src/shared/ai-instructions.js`, `ai-schemas.js` | key-points output style |
| Tests | `tests/` | extend `settings-*`, `extension-contract`, `profile-detection` for new keys/clamps |

## 5. Constraints honored

- **No AI-driven DOM hiding/collapsing/reordering** (README foundation rule). All new visuals are CSS overlays / class toggles.
- **Sensitive pages**: spotlight / progress / chunking disabled on login/payment/identity/upload contexts (reuse `sensitive-page.js`).
- **Conservative defaults**: every new feature defaults OFF except where it only extends an already-on behavior; Tier C stays OFF and dismissible.
- **Sync storage budget**: ~6 new keys, well within `chrome.storage.sync` limits.
- **Performance**: pointer/scroll work batched via `requestAnimationFrame`, matching existing ruler/observer debouncing.

## 6. Suggested phasing

1. **Phase 1 (high confidence):** A1 focus spotlight, A2 reading progress, A3 typography controls.
2. **Phase 2:** B1 chunking, B2 key-points AI mode, C2 `adhd-focus` preset.
3. **Phase 3 (gated, optional):** C1 re-engagement nudge — only after Phase 1/2 land and can be tested with users.

## 7. Citations

1. W3C COGA, *Making Content Usable* — https://w3c.github.io/coga/content-usable/ — **standards-body**
2. *Pupillometry and Typography Towards Inclusive Design for ADHD Readers*, CHI 2026 EA — https://dl.acm.org/doi/full/10.1145/3772363.3799383 — **peer-reviewed**
3. *Shifting the Focus: Video Accessibility for People with ADHD*, CHI 2025 — https://dl.acm.org/doi/full/10.1145/3706598.3713637 — **peer-reviewed**
4. Mette C., *Time Perception in Adult ADHD: A Decade Review*, IJERPH 2023;20(4):3098 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9962130/ — **peer-reviewed (narrative review)**
5. iubenda, *Best fonts and text layouts for ADHD* — https://www.iubenda.com/en/help/184233-adhd-font-2/ — **industry-blog**

Honesty notes: sources 2–3 are the strongest direct evidence. Time blindness (4) is well-evidenced as a trait but the review is narrative, not a meta-analysis. Place-keeping/current-line aids (A1) and specific spacing numbers are the weakest-evidenced — supported by rationale and blog/forum reports, not ADHD-specific controlled trials. Crowding evidence is solid but from dyslexia/general populations.
