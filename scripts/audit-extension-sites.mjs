import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_OPENAI_MODEL } from "../src/shared/openai-models.js";

const port = Number.parseInt(process.env.ASD_AUDIT_CDP_PORT || "9223", 10);
const timeoutMs = 30_000;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionRoot = join(repoRoot, "dist", "extension");
const contentScriptPath = join(extensionRoot, "content", "index.js");
const contentStylePath = join(extensionRoot, "content", "styles.css");
const cliArgs = parseCliArgs(process.argv.slice(2));
const aiAuditEnabled = cliArgs.flags.has("ai") || process.env.ASD_AUDIT_AI === "1";
const openAiModel = process.env.ASD_AUDIT_OPENAI_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
const openAiApiKey = process.env.ASD_AUDIT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";

const sites = [
  {
    category: "video",
    name: "YouTube",
    url: "https://www.youtube.com/"
  },
  {
    category: "text",
    name: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Autism"
  },
  {
    category: "text",
    name: "NamuWiki",
    url: "https://namu.wiki/w/%EC%95%84%EC%9D%B4%EC%9C%A0"
  },
  {
    category: "community",
    name: "DCInside",
    url: "https://gall.dcinside.com/board/view/?id=dcbest&no=423961"
  },
  {
    category: "community",
    name: "Reddit",
    url: "https://www.reddit.com/r/news/"
  },
  {
    category: "news",
    name: "BBC News",
    url: "https://www.bbc.com/news"
  },
  {
    category: "blog",
    name: "Google Blog",
    url: "https://blog.google/products/search/"
  },
  {
    category: "blog",
    name: "NaverBlog",
    url: "https://blog.naver.com/naver_diary"
  },
  {
    category: "news",
    name: "YonhapNews",
    url: "https://www.yna.co.kr/"
  },
  {
    category: "news",
    name: "NaverNews",
    url: "https://news.naver.com/"
  },
  {
    category: "business",
    name: "Microsoft",
    url: "https://www.microsoft.com/en-us/"
  },
  {
    category: "ad-heavy",
    name: "Speedtest",
    url: "https://www.speedtest.net/"
  },
  {
    category: "public",
    name: "USA.gov",
    url: "https://www.usa.gov/"
  },
  {
    category: "public",
    name: "Gov.kr",
    url: "https://www.gov.kr/"
  }
];

const AI_AUDIT_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    overall_risk: {
      type: "string",
      enum: ["low", "medium", "high"]
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          site_name: { type: "string" },
          category: { type: "string" },
          issue_type: {
            type: "string",
            enum: [
              "sensitive_false_positive",
              "sensitive_false_negative",
              "profile_misclassification",
              "image_softening_missing",
              "ad_candidate_missed",
              "ad_overcollapse_risk",
              "network_rule_gap",
              "test_gap",
              "other"
            ]
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          evidence: { type: "string" },
          recommendation: { type: "string" },
          suggested_selectors: {
            type: "array",
            items: { type: "string" }
          },
          suggested_rule_domains: {
            type: "array",
            items: { type: "string" }
          },
          suggested_tests: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "site_name",
          "category",
          "issue_type",
          "severity",
          "confidence",
          "evidence",
          "recommendation",
          "suggested_selectors",
          "suggested_rule_domains",
          "suggested_tests"
        ]
      }
    },
    safe_global_changes: {
      type: "array",
      items: { type: "string" }
    },
    site_specific_changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          site_host: { type: "string" },
          changes: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["site_host", "changes"]
      }
    }
  },
  required: ["summary", "overall_risk", "findings", "safe_global_changes", "site_specific_changes"]
});

class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener("message", (event) => this.handleMessage(event));
  }

  static async connect(webSocketDebuggerUrl) {
    const socket = new WebSocket(webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP WebSocket connection timed out.")), timeoutMs);
      socket.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP WebSocket connection failed."));
      }, { once: true });
    });
    return new CdpConnection(socket);
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject, timer } = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(timer);
      if (message.error) {
        reject(new Error(message.error.message || JSON.stringify(message.error)));
      } else {
        resolve(message.result || {});
      }
      return;
    }
    for (const listener of this.listeners) listener(message);
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.socket.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
    });
  }

  waitForEvent(method, sessionId, timeout = timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
      const listener = (message) => {
        if (message.method !== method) return;
        if (sessionId && message.sessionId !== sessionId) return;
        clearTimeout(timer);
        this.listeners.delete(listener);
        resolve(message.params || {});
      };
      this.listeners.add(listener);
    });
  }

  close() {
    this.socket.close();
  }
}

async function main() {
  if (aiAuditEnabled && !openAiApiKey) {
    throw new Error("AI audit mode requires OPENAI_API_KEY or ASD_AUDIT_OPENAI_API_KEY.");
  }

  const browserInfo = await fetchJson(`http://127.0.0.1:${port}/json/version`);
  const cdp = await CdpConnection.connect(browserInfo.webSocketDebuggerUrl);
  try {
    // An MV3 service worker is dormant until an event wakes it, so a cold
    // Target.getTargets often misses it and the run silently falls back to
    // simulation. Load a real page first: its content script messages the
    // background, waking the worker so target discovery (and the real
    // all_frames extension) can be used.
    await wakeExtension(cdp).catch(() => {});
    const extensionTarget = await waitForExtensionTarget(cdp).catch(() => null);
    const auditAssets = extensionTarget ? null : await readAuditAssets();

    if (extensionTarget) {
      const { sessionId: extensionSessionId } = await cdp.send("Target.attachToTarget", {
        targetId: extensionTarget.targetId,
        flatten: true
      });
      await cdp.send("Runtime.enable", {}, extensionSessionId);
      await enableExtensionFeatures(cdp, extensionSessionId);
    }

    const results = [];
    for (const site of sites) {
      results.push(await auditSite(cdp, site, auditAssets));
    }

    const report = {
      auditedAt: new Date().toISOString(),
      auditMode: extensionTarget ? "loaded-extension" : "content-runtime-simulation",
      extensionTarget: extensionTarget
        ? {
            type: extensionTarget.type,
            url: extensionTarget.url
          }
        : null,
      results
    };

    if (aiAuditEnabled) {
      report.aiAudit = await runAiAudit(report);
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    cdp.close();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json();
}

async function wakeExtension(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  try {
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    const loaded = cdp.waitForEvent("Page.loadEventFired", sessionId, 15_000).catch(() => null);
    await cdp.send("Page.navigate", { url: "https://example.com/" }, sessionId);
    await loaded;
    await delay(1500);
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function waitForExtensionTarget(cdp) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { targetInfos } = await cdp.send("Target.getTargets");
    const target = targetInfos.find((item) =>
      (item.type === "service_worker" || item.type === "background_page") &&
        /^chrome-extension:\/\//.test(item.url || "") &&
        /\/background\/index\.js$/i.test(item.url || "")
    );
    if (target) return target;
    await delay(500);
  }
  throw new Error("Could not find the loaded extension service worker.");
}

async function readAuditAssets() {
  const [contentScript, contentStyle] = await Promise.all([
    readFile(contentScriptPath, "utf8"),
    readFile(contentStylePath, "utf8")
  ]);
  return { contentScript, contentStyle };
}

async function enableExtensionFeatures(cdp, sessionId) {
  const expression = `async () => {
    await chrome.storage.sync.set({
      enabled: true,
      firstRunComplete: true,
      imageSofteningEnabled: true,
      imageSofteningStrength: "medium",
      adRemovalEnabled: true,
      reduceMotion: true,
      muteAutoplay: true,
      reduceContrastEnabled: false,
      readableFontEnabled: false,
      readerMode: false,
      communityAssistEnabled: true,
      readingRuler: false,
      showActiveStateIndicator: true
    });
    await chrome.storage.local.set({ siteOverrides: {} });
    if (chrome.declarativeNetRequest?.updateEnabledRulesets) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["asd_ad_block"],
        disableRulesetIds: []
      });
    }
    return {
      sync: await chrome.storage.sync.get(null),
      local: await chrome.storage.local.get(null)
    };
  }`;
  await cdp.send("Runtime.evaluate", {
    expression: `(${expression})()`,
    awaitPromise: true,
    returnByValue: true
  }, sessionId);
}

async function auditSite(cdp, site, auditAssets) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  const loadEvent = cdp.waitForEvent("Page.loadEventFired", sessionId, 25_000).catch(() => null);
  const startedAt = Date.now();
  try {
    await cdp.send("Page.navigate", { url: site.url }, sessionId);
    await loadEvent;
    if (auditAssets) {
      await injectContentRuntime(cdp, sessionId, auditAssets);
    }
    await waitForFoundation(cdp, sessionId);
    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, Math.min(document.body.scrollHeight - window.innerHeight, 1400));",
      awaitPromise: false
    }, sessionId).catch(() => {});
    await delay(2000);
    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, Math.max(0, document.body.scrollHeight - window.innerHeight - 300));",
      awaitPromise: false
    }, sessionId).catch(() => {});
    await delay(1500);

    const metrics = await evaluateMetrics(cdp, sessionId, !auditAssets);
    return {
      ...site,
      ok: true,
      durationMs: Date.now() - startedAt,
      ...metrics
    };
  } catch (error) {
    return {
      ...site,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error.message
    };
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function injectContentRuntime(cdp, sessionId, { contentScript, contentStyle }) {
  const styleSource = `(() => {
    const style = document.createElement("style");
    style.setAttribute("data-asd-audit-style", "1");
    style.textContent = ${JSON.stringify(contentStyle)};
    (document.head || document.documentElement).append(style);
  })()`;
  await cdp.send("Runtime.evaluate", {
    expression: styleSource,
    awaitPromise: false
  }, sessionId);

  const runtimeStub = `(() => {
    const syncSettings = {
      enabled: true,
      firstRunComplete: true,
      activeComfortPreset: "minimal-safe",
      themePreset: "soft-light",
      textScale: 100,
      lineHeight: 1.7,
      pageDensity: "normal",
      readableFontEnabled: false,
      reduceContrastEnabled: false,
      readerMode: false,
      communityAssistEnabled: true,
      adRemovalEnabled: true,
      reduceMotion: true,
      muteAutoplay: true,
      imageSofteningEnabled: true,
      imageSofteningStrength: "medium",
      readingRuler: false,
      aiHelperEnabled: false,
      aiGentleSuggestions: true,
      assistPanelDefaultOpen: false,
      showActiveStateIndicator: true
    };
    const localSettings = {
      openAIApiKey: "",
      backendUrl: "",
      siteOverrides: {}
    };
    globalThis.chrome = {
      runtime: {
        id: "asd-audit-runtime",
        lastError: null,
        onMessage: { addListener() {} },
        sendMessage(message, callback) {
          const type = message && message.type;
          const response = type === "GET_LOCAL_SETTINGS"
            ? { ok: true, settings: localSettings }
            : { ok: true, settings: syncSettings };
          setTimeout(() => callback(response), 0);
        }
      },
      storage: {
        onChanged: { addListener() {} }
      }
    };
  })();`;

  await cdp.send("Runtime.evaluate", {
    expression: `${runtimeStub}\n${contentScript}`,
    awaitPromise: false
  }, sessionId);
}

async function waitForFoundation(cdp, sessionId) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    const result = await cdp.send("Runtime.evaluate", {
      expression: "Boolean(document.documentElement?.hasAttribute('data-asd-foundation'))",
      returnByValue: true
    }, sessionId);
    if (result.result?.value) return;
    await delay(400);
  }
}

async function evaluateMetrics(cdp, sessionId, aggregateFrames = false) {
  const expression = `(() => {
    const adSelector = [
      "ins.adsbygoogle",
      "[data-ad]",
      "[data-ad-client]",
      "[data-ad-slot]",
      "[data-ad-format]",
      "[data-ad-unit]",
      "[data-ad-manager]",
      "[data-google-query-id]",
      "[aria-label*='advertisement' i]",
      "[aria-label*='sponsored' i]",
      "iframe[src*='doubleclick.net']",
      "iframe[src*='googlesyndication.com']",
      "iframe[src*='googleadservices.com']",
      "iframe[src*='adnxs.com']",
      "iframe[src*='taboola.com']",
      "iframe[src*='outbrain.com']",
      "ins.kakao_ad_area",
      ".kakao_ad_area",
      ".view_ad_wrap",
      ".power_link",
      ".rightbanner1",
      ".rightbanner2",
      ".ad_bottom_list",
      ".con_banner.writing_banbox",
      "[id^='kakao_ad_']",
      "div[id^='div-gpt-ad']",
      "div[id*='ad-slot' i]",
      "div[class*='ad-slot' i]",
      "div[id*='ad_banner' i]",
      "div[class*='ad_banner' i]",
      "div[id*='google_ads']",
      "div[id*='ad-container' i]",
      "div[class*='ad-container' i]",
      "div[id*='advert' i]",
      "div[class*='advert' i]",
      "div[class*='sponsored' i]",
      "[data-testid*='sponsored' i]",
      "[data-testid*='promoted' i]",
      "aside[class*='ad' i]"
    ].join(",");
    const softeningMediaSelector = [
      "img",
      "video",
      "iframe[src*='youtube.com/embed']",
      "iframe[src*='youtube-nocookie.com/embed']",
      "iframe[src*='player.vimeo.com']",
      "iframe[src*='dailymotion.com/embed']",
      "iframe[src*='tv.naver.com/embed']",
      "iframe[src*='tv.kakao.com/embed']",
      "iframe[src*='streamable.com']"
    ].join(",");
    const visible = (element) => {
      if (!(element instanceof Element)) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    };
    const rectInfo = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
    };
    const root = document.documentElement;
    const visibleImages = [...document.images].filter(visible);
    const largeImages = visibleImages.filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width >= 120 && rect.height >= 80;
    });
    const blurredImages = largeImages.filter((img) => getComputedStyle(img).filter.includes("blur"));
    const visibleMediaSurfaces = [...document.querySelectorAll(softeningMediaSelector)].filter(visible);
    const largeMediaSurfaces = visibleMediaSurfaces.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 120 && rect.height >= 80;
    });
    const blurredMediaSurfaces = largeMediaSurfaces.filter((element) => getComputedStyle(element).filter.includes("blur"));
    const collapsedAds = [...document.querySelectorAll("[data-asd-ad-collapsed]")];
    const visibleAdCandidates = [...document.querySelectorAll(adSelector)].filter(visible);
    return {
      finalUrl: location.href,
      title: document.title,
      rootAttributes: [...root.attributes].filter((attribute) => attribute.name.startsWith("data-asd")).map((attribute) => [attribute.name, attribute.value]),
      profile: root.dataset.asdProfile || "",
      sensitiveKind: root.dataset.asdSensitiveKind || "",
      imageSofteningActive: root.hasAttribute("data-asd-image-softening"),
      adRemovalActive: root.hasAttribute("data-asd-ad-removal"),
      visibleImageCount: visibleImages.length,
      largeImageCount: largeImages.length,
      blurredLargeImageCount: blurredImages.length,
      visibleMediaSurfaceCount: visibleMediaSurfaces.length,
      largeMediaSurfaceCount: largeMediaSurfaces.length,
      blurredLargeMediaSurfaceCount: blurredMediaSurfaces.length,
      sampleLargeImages: largeImages.slice(0, 5).map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt || "",
        filter: getComputedStyle(img).filter,
        rect: rectInfo(img)
      })),
      sampleLargeMediaSurfaces: [
        ...largeMediaSurfaces.filter((element) => element.tagName !== "IMG"),
        ...largeMediaSurfaces.filter((element) => element.tagName === "IMG")
      ].slice(0, 5).map((element) => ({
        tag: element.tagName,
        src: element.currentSrc || element.src || "",
        filter: getComputedStyle(element).filter,
        rect: rectInfo(element)
      })),
      collapsedAdCount: collapsedAds.length,
      restoreButtonCount: document.querySelectorAll("[data-asd-ad-restore-button]").length,
      visibleAdCandidateCount: visibleAdCandidates.length,
      sampleVisibleAdCandidates: visibleAdCandidates.slice(0, 8).map((element) => ({
        tag: element.tagName,
        id: element.id || "",
        className: String(element.className || ""),
        text: (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 120),
        rect: rectInfo(element)
      }))
    };
  })()`;
  const topResult = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true
  }, sessionId);
  const base = topResult.result?.value || {};
  // Frame aggregation only makes sense when the real extension is loaded (it runs
  // in all frames). In simulation mode the runtime is injected into the top frame
  // only, so summing child-frame images would understate the blur ratio.
  if (!aggregateFrames) return { ...base, frameCount: 0 };
  return aggregateAcrossFrames(cdp, sessionId, expression, base);
}

// Content runs in all frames (manifest all_frames:true), but the top document
// alone misses iframe-hosted bodies (e.g. Naver Blog's #mainFrame). Sum the same
// metrics from every child frame via an isolated world so the verdict is real.
async function aggregateAcrossFrames(cdp, sessionId, expression, base) {
  const countKeys = [
    "visibleImageCount",
    "largeImageCount",
    "blurredLargeImageCount",
    "visibleMediaSurfaceCount",
    "largeMediaSurfaceCount",
    "blurredLargeMediaSurfaceCount",
    "collapsedAdCount",
    "restoreButtonCount",
    "visibleAdCandidateCount"
  ];

  let childFrameIds = [];
  try {
    const { frameTree } = await cdp.send("Page.getFrameTree", {}, sessionId);
    childFrameIds = collectChildFrameIds(frameTree);
  } catch {
    return { ...base, frameCount: 0 };
  }

  const aggregated = { ...base };
  const sampleImages = [...(base.sampleLargeImages || [])];
  const sampleMedia = [...(base.sampleLargeMediaSurfaces || [])];
  let measuredFrames = 0;
  let skippedFrames = 0;

  for (const frameId of childFrameIds) {
    try {
      const { executionContextId } = await cdp.send("Page.createIsolatedWorld", {
        frameId,
        worldName: "asd_audit_metrics"
      }, sessionId);
      const frameResult = await cdp.send("Runtime.evaluate", {
        expression,
        contextId: executionContextId,
        returnByValue: true
      }, sessionId);
      const value = frameResult.result?.value;
      if (!value) continue;
      measuredFrames += 1;
      for (const key of countKeys) {
        aggregated[key] = (aggregated[key] || 0) + (value[key] || 0);
      }
      if (value.imageSofteningActive) aggregated.imageSofteningActive = true;
      if (value.adRemovalActive) aggregated.adRemovalActive = true;
      sampleImages.push(...(value.sampleLargeImages || []));
      sampleMedia.push(...(value.sampleLargeMediaSurfaces || []));
    } catch {
      // Cross-origin or detached frames may refuse a context; record, don't hide.
      skippedFrames += 1;
    }
  }

  aggregated.sampleLargeImages = sampleImages.slice(0, 5);
  aggregated.sampleLargeMediaSurfaces = sampleMedia.slice(0, 5);
  aggregated.frameCount = measuredFrames;
  aggregated.skippedFrameCount = skippedFrames;
  return aggregated;
}

function collectChildFrameIds(frameTree) {
  const ids = [];
  const walk = (node, isRoot) => {
    if (!node) return;
    if (!isRoot && node.frame?.id) ids.push(node.frame.id);
    for (const child of node.childFrames || []) walk(child, false);
  };
  walk(frameTree, true);
  return ids;
}

async function runAiAudit(report) {
  const auditInput = buildAiAuditInput(report);
  const parsed = await requestStructuredOutput({
    apiKey: openAiApiKey,
    model: openAiModel,
    name: "asd_extension_audit",
    schema: AI_AUDIT_SCHEMA,
    maxOutputTokens: 1800,
    instructions: [
      "You are reviewing a Chrome extension audit for autism-friendly browsing supports.",
      "Use only the summarized metrics provided. Do not assume full page content or hidden DOM.",
      "Focus on false positives, false negatives, fragile selectors, and safe test additions.",
      "Never recommend AI-driven DOM hiding, reordering, or automatic removal of task-critical content.",
      "Prefer conservative global changes and site-specific rules when evidence is narrow.",
      "Suggested selectors must be CSS selectors or empty. Suggested rule domains must be hostnames or empty.",
      "Keep recommendations concise and implementation-oriented.",
      "Return only schema-compliant JSON."
    ].join(" "),
    contentText: JSON.stringify(auditInput, null, 2)
  });

  return normalizeAiAuditResult(parsed);
}

export function buildAiAuditInput(report) {
  const results = Array.isArray(report?.results) ? report.results : [];
  return {
    auditedAt: normalizeText(report?.auditedAt, 64),
    auditMode: normalizeText(report?.auditMode, 48),
    privacy: {
      rawHtmlIncluded: false,
      typedInputValuesIncluded: false,
      imageUrlsIncluded: false,
      imageAltTextIncluded: false,
      visibleTextLimitedToAdCandidateLabels: true
    },
    sites: results.map(sanitizeSiteResult)
  };
}

function sanitizeSiteResult(result) {
  const finalUrl = safeUrl(result?.finalUrl || result?.url);
  const blurCoverage = ratio(result?.blurredLargeImageCount, result?.largeImageCount);
  const mediaSurfaceBlurCoverage = ratio(result?.blurredLargeMediaSurfaceCount, result?.largeMediaSurfaceCount);
  return {
    category: normalizeText(result?.category, 32),
    name: normalizeText(result?.name, 80),
    ok: Boolean(result?.ok),
    host: finalUrl?.hostname || "",
    pathHint: normalizePathHint(finalUrl),
    titleHint: normalizeText(result?.title, 140),
    profile: normalizeText(result?.profile, 32),
    sensitiveKind: normalizeText(result?.sensitiveKind, 32),
    imageSofteningActive: Boolean(result?.imageSofteningActive),
    adRemovalActive: Boolean(result?.adRemovalActive),
    visibleImageCount: clampInteger(result?.visibleImageCount, 0, 10000),
    largeImageCount: clampInteger(result?.largeImageCount, 0, 10000),
    blurredLargeImageCount: clampInteger(result?.blurredLargeImageCount, 0, 10000),
    blurCoverage,
    visibleMediaSurfaceCount: clampInteger(result?.visibleMediaSurfaceCount, 0, 10000),
    largeMediaSurfaceCount: clampInteger(result?.largeMediaSurfaceCount, 0, 10000),
    blurredLargeMediaSurfaceCount: clampInteger(result?.blurredLargeMediaSurfaceCount, 0, 10000),
    mediaSurfaceBlurCoverage,
    collapsedAdCount: clampInteger(result?.collapsedAdCount, 0, 10000),
    restoreButtonCount: clampInteger(result?.restoreButtonCount, 0, 10000),
    visibleAdCandidateCount: clampInteger(result?.visibleAdCandidateCount, 0, 10000),
    sampleLargeImages: sanitizeLargeImages(result?.sampleLargeImages),
    sampleLargeMediaSurfaces: sanitizeLargeMediaSurfaces(result?.sampleLargeMediaSurfaces),
    sampleVisibleAdCandidates: sanitizeAdCandidates(result?.sampleVisibleAdCandidates),
    error: normalizeText(result?.error, 180)
  };
}

function sanitizeLargeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 6).map((image) => {
    const srcUrl = safeUrl(image?.src);
    return {
      host: srcUrl?.hostname || "",
      extensionHint: extensionHintFromPath(srcUrl?.pathname || ""),
      filter: normalizeText(image?.filter, 80),
      rect: sanitizeRect(image?.rect)
    };
  });
}

function sanitizeLargeMediaSurfaces(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 6).map((item) => {
    const srcUrl = safeUrl(item?.src);
    return {
      tag: normalizeText(item?.tag, 24),
      host: srcUrl?.hostname || "",
      filter: normalizeText(item?.filter, 80),
      rect: sanitizeRect(item?.rect)
    };
  });
}

function sanitizeAdCandidates(candidates) {
  if (!Array.isArray(candidates)) return [];
  return candidates.slice(0, 10).map((candidate) => ({
    tag: normalizeText(candidate?.tag, 24),
    id: normalizeSelectorToken(candidate?.id, 80),
    className: normalizeClassTokens(candidate?.className),
    textHint: normalizeText(candidate?.text, 80),
    rect: sanitizeRect(candidate?.rect)
  }));
}

function sanitizeRect(rect) {
  return {
    x: clampInteger(rect?.x, -100000, 100000),
    y: clampInteger(rect?.y, -100000, 100000),
    w: clampInteger(rect?.w, 0, 100000),
    h: clampInteger(rect?.h, 0, 100000)
  };
}

async function requestStructuredOutput({ apiKey, model, name, schema, instructions, contentText, maxOutputTokens }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_output_tokens: maxOutputTokens,
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: contentText
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema
        }
      }
    })
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("OpenAI returned a non-JSON response.");
  }

  if (!response.ok) {
    const message = normalizeText(data?.error?.message || String(data?.error || ""), 280) || "OpenAI request failed.";
    throw new Error(message);
  }

  const refusal = collectRefusal(data.output);
  if (refusal) throw new Error(refusal);

  const outputText = typeof data.output_text === "string" && data.output_text
    ? data.output_text
    : collectOutputText(data.output);
  if (!outputText) throw new Error("OpenAI returned no text output.");

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI response could not be parsed as JSON.");
  }
}

function normalizeAiAuditResult(value) {
  const result = safeObject(value);
  return {
    model: openAiModel,
    summary: normalizeText(result.summary, 800),
    overallRisk: normalizeRisk(result.overall_risk),
    findings: Array.isArray(result.findings)
      ? result.findings.map(normalizeFinding).filter(Boolean).slice(0, 20)
      : [],
    safeGlobalChanges: normalizeStringArray(result.safe_global_changes, 12, 240),
    siteSpecificChanges: Array.isArray(result.site_specific_changes)
      ? result.site_specific_changes.map(normalizeSiteSpecificChange).filter(Boolean).slice(0, 20)
      : []
  };
}

function normalizeFinding(item) {
  const value = safeObject(item);
  const siteName = normalizeText(value.site_name, 80);
  const recommendation = normalizeText(value.recommendation, 300);
  if (!siteName || !recommendation) return null;
  return {
    siteName,
    category: normalizeText(value.category, 32),
    issueType: normalizeIssueType(value.issue_type),
    severity: normalizeSeverity(value.severity),
    confidence: clampNumber(value.confidence, 0, 1),
    evidence: normalizeText(value.evidence, 300),
    recommendation,
    suggestedSelectors: normalizeStringArray(value.suggested_selectors, 8, 120),
    suggestedRuleDomains: normalizeStringArray(value.suggested_rule_domains, 8, 120),
    suggestedTests: normalizeStringArray(value.suggested_tests, 8, 180)
  };
}

function normalizeSiteSpecificChange(item) {
  const value = safeObject(item);
  const siteHost = normalizeText(value.site_host, 120);
  const changes = normalizeStringArray(value.changes, 8, 220);
  if (!siteHost || changes.length === 0) return null;
  return { siteHost, changes };
}

function collectOutputText(outputItems) {
  if (!Array.isArray(outputItems)) return "";
  return outputItems
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

function collectRefusal(outputItems) {
  if (!Array.isArray(outputItems)) return "";
  for (const item of outputItems) {
    if (!Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part.type === "refusal" && typeof part.refusal === "string") return part.refusal;
    }
  }
  return "";
}

function parseCliArgs(args) {
  const flags = new Set();
  for (const arg of args) {
    if (arg.startsWith("--")) flags.add(arg.slice(2));
  }
  return { flags };
}

function safeUrl(value) {
  try {
    return new URL(String(value || ""));
  } catch {
    return null;
  }
}

function normalizePathHint(url) {
  if (!url) return "";
  return url.pathname
    .split("/")
    .filter(Boolean)
    .slice(0, 3)
    .join("/");
}

function extensionHintFromPath(pathname) {
  const match = String(pathname || "").toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return match ? match[1] : "";
}

function normalizeSelectorToken(value, maxLength) {
  return normalizeText(value, maxLength).replace(/[^\w\u3131-\u318e\uac00-\ud7a3:.-]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeClassTokens(value) {
  return normalizeText(value, 160)
    .split(/\s+/)
    .map((item) => normalizeSelectorToken(item, 48))
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");
}

function normalizeStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function normalizeRisk(value) {
  if (value === "high" || value === "medium") return value;
  return "low";
}

function normalizeSeverity(value) {
  if (value === "high" || value === "medium") return value;
  return "low";
}

function normalizeIssueType(value) {
  const allowed = new Set([
    "sensitive_false_positive",
    "sensitive_false_negative",
    "profile_misclassification",
    "image_softening_missing",
    "ad_candidate_missed",
    "ad_overcollapse_risk",
    "network_rule_gap",
    "test_gap",
    "other"
  ]);
  return allowed.has(value) ? value : "other";
}

function ratio(numerator, denominator) {
  const parsedDenominator = Number(denominator);
  if (!Number.isFinite(parsedDenominator) || parsedDenominator <= 0) return 0;
  const parsedNumerator = Number(numerator);
  if (!Number.isFinite(parsedNumerator) || parsedNumerator <= 0) return 0;
  return Math.round((parsedNumerator / parsedDenominator) * 100) / 100;
}

function clampInteger(value, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value, min, max) {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
