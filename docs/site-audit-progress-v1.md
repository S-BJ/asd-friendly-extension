# Site Audit Progress

## 2026-04-25: Community Stability Pass

Goal: improve behavior on large community sites, especially DCInside-like thread pages where comment, search, login, and attachment UI can look like risky forms.

Changes made:

- Community detection now runs before final form classification so known dense communities can be considered while filtering routine page chrome.
- Routine community forms are ignored for page-level `form` classification when they are comment, reply, search, login-widget, nickname, captcha, write, post, or attachment controls.
- Standalone anonymous comment password fields are also ignored when they sit inside comment/reply containers such as `cmt` or `view_comment`.
- Generic `email`, `tel`, and `file` inputs no longer force the whole page into the `form` profile by themselves.
- File inputs still count as form signals when the surrounding context looks like an upload, application, identity, or document-submission task.
- High-risk payment, identity, account-security, and application forms still keep the `form` profile.

Tests added:

- Community comment/search widgets do not become `form`.
- High-risk payment forms inside a community page still become `form`.
- Standalone anonymous comment password fields do not become `form`.
- Ordinary newsletter email forms do not become high-risk forms.

Verification:

- `npm test`: 27 tests passed.
- `npm run build`: extension built at `dist/extension`.
- Site audit report: `audit-reports/site-audit-community-20260425-021120.json`.

Latest representative audit result:

| Site | Category | Profile | Large images blurred | Collapsed ads |
| --- | --- | --- | --- | --- |
| YouTube | video | generic | 0/0 | 6 |
| Wikipedia | text | reader | 11/11 | 0 |
| DCInside | community | community | 16/16 | 6 |
| Reddit | community | community | 62/62 | 50 |
| BBC News | news | reader | 30/30 | 11 |
| Google Blog | blog | portal | 2/2 | 0 |
| Microsoft | business | reader | 16/16 | 0 |
| X | sns | generic | 0/0 | 0 |
| Speedtest | ad-heavy | portal | 5/5 | 18 |
| USA.gov | public | reader | 0/0 | 0 |
| Gov.kr | public | portal | 2/2 | 0 |

Notes:

- DCInside image softening and ad collapsing stayed active after the community-profile fix.
- The audit still uses runtime metrics only; it does not send raw HTML, typed values, image URLs, or image alt text to AI audit mode.
- Keep watching community pages that use password-like fields for non-account actions, because those are common false-positive sources.

## 2026-04-25: Embedded Video Thumbnail Softening

Goal: cover wiki pages that attach external videos through embedded players, where the visible thumbnail is an `iframe` rather than an `img`.

Changes made:

- Image softening now also covers `video` elements and known video embed frames, including YouTube, YouTube nocookie, Vimeo, Dailymotion, Naver TV, Kakao TV, and Streamable.
- Hover and keyboard focus reveal these media surfaces the same way image hover/focus reveal works.
- The site audit now includes NamuWiki as a representative wiki page with external embedded video.
- The audit now records large media surfaces separately from image-only counts, so embedded player thumbnails are visible in audit results.
- AI audit input sanitizes large media-surface samples and keeps only tag, host, filter, and rect, not raw iframe URLs or video IDs.

Tests added or updated:

- Runtime contract test now checks that image softening covers YouTube embed iframes and `video:hover`.
- AI audit sanitization test now checks that media iframe URLs and video IDs are stripped.

Verification:

- `npm test`: 27 tests passed.
- `npm run build`: extension built at `dist/extension`.
- Site audit report: `audit-reports/site-audit-media-20260425-022416.json`.

Latest relevant audit result:

| Site | Category | Profile | Large images blurred | Large media surfaces blurred | Collapsed ads |
| --- | --- | --- | --- | --- | --- |
| NamuWiki | text | portal | 48/48 | 51/51 | 0 |
| Wikipedia | text | reader | 11/11 | 11/11 | 0 |
| DCInside | community | community | 16/16 | 16/16 | 6 |
| Reddit | community | community | 64/64 | 64/64 | 50 |

## 2026-05-31: Korean-site pass + true loaded-extension verification

Goal: confirm features apply on 나무위키 / 유튜브 / 네이버블로그 / 디시인사이드 / 레딧 / 뉴스, find why anything fails, fix it.

Two real extension bugs found and fixed (both verified live in loaded-extension mode):

- **News fronts misclassified as `community`** (e.g. BBC). `detectCommunityProfile` matched on a high link count + an incidental "post"/"comment" word. Now non-allowlisted hosts require real comment/reply widgets, or a board-index signal (community URL token + long list + hint). News fronts no longer match → BBC now `reader`.
- **Content pages flagged as sensitive, disabling all comfort features.** `detectSensitivePageKind` scanned body text for keywords, so a news headline like "…개인정보 제공…" tripped the `legal` kind and `getEffectiveSettings` then turned everything off. news.naver.com showed 0/22 softened. Fix: body-text matches now only count when the page also has an interactive sensitive control (password/file/card input, a sensitive form, or an accept-terms button) — `hasInteractiveSensitiveControl`. URL/title matches are unchanged. news.naver.com now softens 22/22.
- **Ad collapse hid YouTube's search/nav bar.** A real ad (`#masthead-ad`) made `resolveAdContainer` ascend to `#masthead-container` (full-width but short → `isSmallPeripheralBlock` true), collapsing the whole top bar including search. `isProtectedContent` only checks ancestors, so a bar *containing* the search input wasn't protected. Fix: new `isInteractiveChrome()` — `resolveAdContainer` won't ascend into, and `markAdCandidate` won't collapse, any element that is or contains nav/header/search/banner or a non-hidden form control. Verified live: YouTube masthead + search stay; only real ads (`masthead-ad`, `player-ads`, `sponsor-button`, etc.) collapse.

Harness work (so the above could be verified for real):

- The CDP audit silently ran in `content-runtime-simulation` because `--load-extension` was never honored — the repo path "바탕 화면" contains a space and the launcher's unquoted Start-Process arg split it. Quoted the path args in `scripts/launch-isolated-chrome.ps1`.
- Stable Chrome blocks side-loading; use Chrome for Testing (`@puppeteer/browsers install chrome@stable`, launched with quoted `--load-extension` + `--remote-debugging-port`).
- `audit-extension-sites.mjs`: `wakeExtension()` opens a real page first so the dormant MV3 service worker is discoverable (else the run falls back to simulation); `aggregateAcrossFrames()` sums per-frame metrics (loaded mode only) so iframe-hosted bodies like Naver Blog's `#mainFrame` are measured. Added NaverBlog / NaverNews / YonhapNews to the site list.

Latest loaded-extension result (Chrome for Testing):

| Site | Profile | Sensitive | Large images blurred | Collapsed ads |
| --- | --- | --- | --- | --- |
| NaverBlog | generic | none | 15/15 (in `#mainFrame`) | 0 |
| NaverNews | portal | none | 22/22 | 2 |
| YonhapNews | portal | none | 42/42 | 11 |
| NamuWiki | portal | none | 91/91 | 2 |
| DCInside | community | none | 16/16 | 6 |
| Reddit | community | none | 58/58 | 20 |
| BBC News | reader | none | 20/20 | 6 |
| YouTube | generic | none | 0/0 (SPA lazy-load) | 7 |
| X | generic | none | 0/0 (SPA) | 0 |

Notes:

- YouTube/X stream images in after load; the extension is active (YouTube collapsed 7 ads) but a snapshot catches 0 images.
- `npm test`: 50 passed (added community board-index + news-front regression tests and sensitive-control gating tests).
