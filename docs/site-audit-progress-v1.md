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
