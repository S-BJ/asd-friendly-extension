import test from "node:test";
import assert from "node:assert/strict";
import { buildAiAuditInput } from "../scripts/audit-extension-sites.mjs";

test("AI audit input strips raw image URLs and alt text", () => {
  const input = buildAiAuditInput({
    auditedAt: "2026-04-24T16:40:19.988Z",
    auditMode: "content-runtime-simulation",
    results: [
      {
        category: "news",
        name: "Example News",
        url: "https://news.example/article/private-slug",
        finalUrl: "https://news.example/article/private-slug",
        title: "Example article",
        profile: "reader",
        sensitiveKind: "",
        imageSofteningActive: true,
        adRemovalActive: true,
        visibleImageCount: 2,
        largeImageCount: 1,
        blurredLargeImageCount: 1,
        visibleMediaSurfaceCount: 2,
        largeMediaSurfaceCount: 2,
        blurredLargeMediaSurfaceCount: 2,
        collapsedAdCount: 0,
        restoreButtonCount: 0,
        visibleAdCandidateCount: 0,
        sampleLargeImages: [
          {
            src: "https://cdn.example/private/person-face.jpg?token=secret",
            alt: "Private descriptive alt text",
            filter: "blur(8px)",
            rect: { x: 1, y: 2, w: 300, h: 200 }
          }
        ],
        sampleLargeMediaSurfaces: [
          {
            tag: "IFRAME",
            src: "https://www.youtube.com/embed/private-video-id?secret=token",
            filter: "blur(8px)",
            rect: { x: 3, y: 4, w: 640, h: 360 }
          }
        ]
      }
    ]
  });

  const raw = JSON.stringify(input);
  assert.equal(input.privacy.rawHtmlIncluded, false);
  assert.equal(input.privacy.typedInputValuesIncluded, false);
  assert.equal(input.privacy.imageUrlsIncluded, false);
  assert.equal(input.privacy.imageAltTextIncluded, false);
  assert.equal(input.sites[0].sampleLargeImages[0].host, "cdn.example");
  assert.equal(input.sites[0].sampleLargeImages[0].extensionHint, "jpg");
  assert.equal(input.sites[0].mediaSurfaceBlurCoverage, 1);
  assert.equal(input.sites[0].sampleLargeMediaSurfaces[0].tag, "IFRAME");
  assert.equal(input.sites[0].sampleLargeMediaSurfaces[0].host, "www.youtube.com");
  assert.doesNotMatch(raw, /person-face/);
  assert.doesNotMatch(raw, /token=secret/);
  assert.doesNotMatch(raw, /private-video-id/);
  assert.doesNotMatch(raw, /Private descriptive alt text/);
});

test("AI audit input keeps compact ad candidate evidence", () => {
  const input = buildAiAuditInput({
    results: [
      {
        category: "community",
        name: "Forum",
        finalUrl: "https://forum.example/thread/123",
        title: "Thread page",
        profile: "community",
        sensitiveKind: "",
        imageSofteningActive: true,
        adRemovalActive: true,
        largeImageCount: 4,
        blurredLargeImageCount: 2,
        sampleVisibleAdCandidates: [
          {
            tag: "DIV",
            id: "ad-slot-main",
            className: "banner promoted unit extra extra2 extra3 extra4 extra5 extra6",
            text: "Sponsored listing with a short label",
            rect: { x: 10, y: 20, w: 300, h: 250 }
          }
        ]
      }
    ]
  });

  assert.equal(input.sites[0].host, "forum.example");
  assert.equal(input.sites[0].pathHint, "thread/123");
  assert.equal(input.sites[0].blurCoverage, 0.5);
  assert.equal(input.sites[0].sampleVisibleAdCandidates[0].id, "ad-slot-main");
  assert.equal(input.sites[0].sampleVisibleAdCandidates[0].className.split(" ").length, 8);
  assert.equal(input.sites[0].sampleVisibleAdCandidates[0].textHint, "Sponsored listing with a short label");
});
