import http from "node:http";
import { mkdir, writeFile } from "node:fs/promises";

const cdpPort = Number.parseInt(process.env.ASD_TOGGLE_CDP_PORT || "9233", 10);
const host = "127.0.0.1";
const reportPath = process.env.ASD_TOGGLE_REPORT_PATH || "audit-reports/toggle-verification-latest.json";
const configuredExtensionId = process.env.ASD_EXTENSION_ID || "";

const baseSettings = {
  enabled: true,
  uiLanguage: "en",
  firstRunComplete: true,
  activeComfortPreset: "minimal-safe",
  themePreset: "soft-light",
  textScale: 100,
  lineHeight: 1.7,
  pageDensity: "normal",
  readableFontEnabled: false,
  reduceContrastEnabled: false,
  readerMode: false,
  communityAssistEnabled: false,
  adRemovalEnabled: false,
  reduceMotion: false,
  muteAutoplay: false,
  imageSofteningEnabled: false,
  imageSofteningStrength: "medium",
  readingRuler: false,
  aiHelperEnabled: false,
  aiGentleSuggestions: true,
  assistPanelDefaultOpen: false,
  showActiveStateIndicator: false
};

const longText = "This paragraph exists so the reader classifier sees a real article-like page with enough visible text and predictable structure. ".repeat(18);
const imgData = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220"><rect width="360" height="220" fill="#d85959"/><circle cx="260" cy="80" r="55" fill="#ffd166"/><text x="24" y="116" font-size="30" fill="#112">fixture image</text></svg>`);
const bgData = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="240"><rect width="420" height="240" fill="#247ba0"/><path d="M0 200 L120 80 L210 180 L310 60 L420 210 Z" fill="#70c1b3"/></svg>`);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (url.pathname === "/community") {
    res.end(`<!doctype html><html><head><title>Fixture Community</title><style>body{font-family:sans-serif}.comment,.reply{margin:8px;padding:8px;border:1px solid #ccc}</style></head><body><h1>Board thread comment reply vote</h1>${Array.from({ length: 7 }, (_, i) => `<div class="comment">comment ${i} reply vote board discussion</div>`).join("")} ${Array.from({ length: 85 }, (_, i) => `<a href="#l${i}">thread link ${i}</a>`).join(" ")}</body></html>`);
    return;
  }

  if (url.pathname === "/sensitive") {
    res.end(`<!doctype html><html><head><title>Payment checkout</title></head><body><h1>Payment checkout</h1><form><label>Card number <input name="card-number" autocomplete="cc-number"></label><label>Password <input type="password"></label><button>Pay now</button></form><img id="fixture-image" width="360" height="220" src="${imgData}"></body></html>`);
    return;
  }

  res.end(`<!doctype html><html><head><title>Fixture Reader</title><style>body{font-family:Arial,sans-serif}.ad-slot{width:300px;height:90px;background:#f9c74f;margin:12px}.animated{animation:pulse 2s infinite}@keyframes pulse{from{opacity:.4}to{opacity:1}}#background-card{width:420px;height:240px;background-image:url("${bgData}");background-size:cover;background-position:center;margin:16px 0}</style></head><body><aside id="sidebar">Sidebar</aside><div id="ad-fixture" class="ad-slot adsbygoogle" aria-label="advertisement">Ad fixture</div><article><h1>Reader Fixture</h1>${Array.from({ length: 5 }, () => `<p>${longText}</p>`).join("")}<img id="fixture-image" width="360" height="220" src="${imgData}" alt="fixture"><div id="background-card" role="img" aria-label="background fixture"></div><video id="fixture-video" width="320" height="180" autoplay muted></video><p class="animated" id="animated-text">Animated paragraph</p><button id="action-button">Action</button></article></body></html>`);
});

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolve(message.result || {});
    });
  }

  static async connect(wsUrl) {
    const client = new CdpClient(wsUrl);
    await new Promise((resolve, reject) => {
      client.ws.addEventListener("open", resolve, { once: true });
      client.ws.addEventListener("error", reject, { once: true });
    });
    return client;
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    this.ws.close();
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed ${url}: ${response.status}`);
  return response.json();
}

async function waitForBrowser() {
  for (let index = 0; index < 60; index += 1) {
    try {
      return await fetchJson(`http://${host}:${cdpPort}/json/version`);
    } catch {
      await delay(250);
    }
  }
  throw new Error("CDP browser did not start.");
}

async function waitForExtensionTarget(cdp) {
  for (let index = 0; index < 80; index += 1) {
    const { targetInfos } = await cdp.send("Target.getTargets");
    const target = targetInfos.find((item) =>
      (item.type === "service_worker" || item.type === "background_page") &&
        /^chrome-extension:\/\//.test(item.url || "") &&
        /\/background\/index\.js$/i.test(item.url || "")
    );
    if (target) return target;
    await delay(250);
  }
  throw new Error("Extension background/index.js target not found.");
}

async function attach(cdp, targetId) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Runtime.enable", {}, sessionId);
  return sessionId;
}

async function evalJs(cdp, sessionId, expression, awaitPromise = true) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true }, sessionId);
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}

async function waitLoad(cdp, sessionId) {
  for (let index = 0; index < 80; index += 1) {
    const state = await evalJs(cdp, sessionId, "document.readyState", false);
    if (state === "complete") return;
    await delay(250);
  }
}

async function createPage(cdp, url) {
  const { targetId } = await cdp.send("Target.createTarget", { url });
  const sessionId = await attach(cdp, targetId);
  await cdp.send("Page.enable", {}, sessionId);
  await waitLoad(cdp, sessionId);
  await delay(800);
  return { targetId, sessionId };
}

async function setBaseStorage(cdp, backgroundSession) {
  await evalJs(cdp, backgroundSession, `(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    await chrome.storage.sync.set(${JSON.stringify(baseSettings)});
    await chrome.storage.local.set({ siteOverrides: {} });
    if (chrome.declarativeNetRequest?.updateEnabledRulesets) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [], disableRulesetIds: ["asd_ad_block"] });
    }
    return { sync: await chrome.storage.sync.get(null), local: await chrome.storage.local.get(null) };
  })()`);
}

async function setBaseStorageFromExtensionPage(cdp, extensionPageSession) {
  await evalJs(cdp, extensionPageSession, `(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    await chrome.storage.sync.set(${JSON.stringify(baseSettings)});
    await chrome.storage.local.set({ siteOverrides: {} });
    if (chrome.declarativeNetRequest?.updateEnabledRulesets) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [], disableRulesetIds: ["asd_ad_block"] });
    }
    return { sync: await chrome.storage.sync.get(null), local: await chrome.storage.local.get(null) };
  })()`);
}

async function sendRuntime(cdp, popupSession, type, payload) {
  return evalJs(cdp, popupSession, `(async () => await new Promise((resolve) => {
    chrome.runtime.sendMessage(${JSON.stringify({ type, payload })}, (response) => {
      resolve(response || { ok: false, error: chrome.runtime.lastError?.message });
    });
  }))()`);
}

async function setSetting(cdp, popupSession, key, value) {
  const response = await sendRuntime(cdp, popupSession, "SET_SETTINGS", { [key]: value });
  if (!response?.ok) throw new Error(`SET_SETTINGS ${key} failed: ${response?.error}`);
  await delay(500);
}

async function setOverride(cdp, popupSession, origin, override) {
  const response = await evalJs(cdp, popupSession, `(async () => await new Promise((resolve) => {
    chrome.runtime.sendMessage(${JSON.stringify({ type: "SET_SITE_OVERRIDE", origin, payload: { override } })}, (response) => {
      resolve(response || { ok: false, error: chrome.runtime.lastError?.message });
    });
  }))()`);
  if (!response?.ok) throw new Error(`SET_SITE_OVERRIDE failed: ${response?.error}`);
  await delay(500);
}

async function clearOverride(cdp, popupSession, origin) {
  const response = await evalJs(cdp, popupSession, `(async () => await new Promise((resolve) => {
    chrome.runtime.sendMessage(${JSON.stringify({ type: "CLEAR_SITE_OVERRIDE", origin })}, (response) => {
      resolve(response || { ok: false, error: chrome.runtime.lastError?.message });
    });
  }))()`);
  if (!response?.ok) throw new Error(`CLEAR_SITE_OVERRIDE failed: ${response?.error}`);
  await delay(500);
}

async function snapshot(cdp, sessionId) {
  return evalJs(cdp, sessionId, `(() => {
    const root = document.documentElement;
    const img = document.getElementById("fixture-image");
    const bg = document.getElementById("background-card");
    const ad = document.getElementById("ad-fixture");
    const video = document.getElementById("fixture-video");
    const p = document.querySelector("article p") || document.querySelector("p");
    const article = document.querySelector("article");
    const animated = document.getElementById("animated-text");
    const cs = (element) => element ? getComputedStyle(element) : null;
    return {
      attrs: [...root.attributes].filter((attribute) => attribute.name.startsWith("data-asd")).map((attribute) => [attribute.name, attribute.value]),
      foundation: root.hasAttribute("data-asd-foundation"),
      motion: root.hasAttribute("data-asd-motion-off"),
      font: root.hasAttribute("data-asd-font"),
      contrast: root.hasAttribute("data-asd-reduce-contrast"),
      reader: root.hasAttribute("data-asd-reader"),
      community: root.hasAttribute("data-asd-community-assist"),
      imageSoftening: root.hasAttribute("data-asd-image-softening"),
      adRemoval: root.hasAttribute("data-asd-ad-removal"),
      aiGentle: root.hasAttribute("data-asd-ai-gentle"),
      theme: root.getAttribute("data-asd-theme"),
      density: root.getAttribute("data-asd-density"),
      sensitive: root.getAttribute("data-asd-sensitive-kind") || "",
      imgFilter: img ? cs(img).filter : "",
      bgSoftened: bg ? bg.hasAttribute("data-asd-background-image-softened") : false,
      bgFilter: bg ? cs(bg).filter : "",
      bgBeforeFilter: bg ? getComputedStyle(bg, "::before").filter : "",
      bgImage: bg ? cs(bg).backgroundImage : "",
      adHidden: ad ? ad.hidden : null,
      restoreButtons: document.querySelectorAll("[data-asd-ad-restore-button]").length,
      rulerVisible: !!document.querySelector(".asd-foundation-ruler:not([hidden])"),
      indicatorVisible: !!document.querySelector(".asd-foundation-indicator"),
      spotlightVisible: !!document.querySelector(".asd-foundation-spotlight:not([hidden])"),
      progressVisible: !!document.querySelector(".asd-foundation-progress:not([hidden])"),
      quickToggleVisible: !!document.querySelector(".asd-foundation-quicktoggle:not([hidden])"),
      chunking: root.hasAttribute("data-asd-chunking"),
      letterSpacingAttr: root.hasAttribute("data-asd-letter-spacing"),
      readingWidthAttr: root.hasAttribute("data-asd-reading-width"),
      readShape: !!document.querySelector("[data-asd-read-shape]"),
      paragraphLetterSpacing: p ? cs(p).letterSpacing : "",
      videoMuted: video ? video.muted : null,
      videoPaused: video ? video.paused : null,
      paragraphFont: p ? cs(p).fontFamily : "",
      paragraphLineHeight: p ? cs(p).lineHeight : "",
      paragraphFontSize: p ? cs(p).fontSize : "",
      articleMaxWidth: article ? cs(article).maxWidth : "",
      animationDuration: animated ? cs(animated).animationDuration : ""
    };
  })()`);
}

function result(name, ok, details = {}) {
  return { name, ok: Boolean(ok), details };
}

async function main() {
  const serverPort = await new Promise((resolve) => server.listen(0, host, () => resolve(server.address().port)));
  const baseUrl = `http://${host}:${serverPort}`;
  const version = await waitForBrowser();
  const cdp = await CdpClient.connect(version.webSocketDebuggerUrl);

  try {
    const extensionTarget = await waitForExtensionTarget(cdp).catch(() => null);
    const extensionId = extensionTarget ? new URL(extensionTarget.url).host : configuredExtensionId;
    if (!extensionId) throw new Error("Extension ID could not be resolved. Set ASD_EXTENSION_ID when the service worker is idle.");

    const popup = await createPage(cdp, `chrome-extension://${extensionId}/popup/index.html`);
    if (extensionTarget) {
      const backgroundSession = await attach(cdp, extensionTarget.targetId);
      await setBaseStorage(cdp, backgroundSession);
    } else {
      await setBaseStorageFromExtensionPage(cdp, popup.sessionId);
    }

    const reader = await createPage(cdp, `${baseUrl}/reader`);
    await delay(500);

    const checks = [];
    let state = await snapshot(cdp, reader.sessionId);
    checks.push(result("baseline foundation on", state.foundation && !state.imageSoftening && !state.adRemoval, state));

    await setSetting(cdp, popup.sessionId, "imageSofteningEnabled", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("image softening blurs img", state.imageSoftening && /blur\(/.test(state.imgFilter), { imgFilter: state.imgFilter, imageSoftening: state.imageSoftening }));
    checks.push(result("background-image softening applies", state.bgSoftened && /blur\(/.test(state.bgBeforeFilter), { bgSoftened: state.bgSoftened, bgBeforeFilter: state.bgBeforeFilter, bgImage: state.bgImage.slice(0, 80) }));
    await setSetting(cdp, popup.sessionId, "imageSofteningEnabled", false);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("image softening off removes blur", !state.imageSoftening && !/blur\(/.test(state.imgFilter), { imgFilter: state.imgFilter }));

    await setSetting(cdp, popup.sessionId, "reduceMotion", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reduce motion toggle applies", state.motion && (/0\.001ms|0s|1e-06s/.test(state.animationDuration)), { animationDuration: state.animationDuration }));
    await setSetting(cdp, popup.sessionId, "reduceMotion", false);

    await setSetting(cdp, popup.sessionId, "readableFontEnabled", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("readable font toggle applies", state.font && /KoddiUD|Atkinson|Segoe|Malgun/.test(state.paragraphFont), { paragraphFont: state.paragraphFont }));
    await setSetting(cdp, popup.sessionId, "readableFontEnabled", false);

    await setSetting(cdp, popup.sessionId, "reduceContrastEnabled", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reduce contrast toggle applies to media", state.contrast && /contrast\(0\.9\)/.test(state.imgFilter), { imgFilter: state.imgFilter }));
    await setSetting(cdp, popup.sessionId, "reduceContrastEnabled", false);

    await setSetting(cdp, popup.sessionId, "adRemovalEnabled", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("ad removal toggle collapses recoverably", state.adRemoval && state.adHidden === true && state.restoreButtons >= 1, { adHidden: state.adHidden, restoreButtons: state.restoreButtons }));
    await setSetting(cdp, popup.sessionId, "adRemovalEnabled", false);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("ad removal off restores element", !state.adRemoval && state.adHidden === false && state.restoreButtons === 0, { adHidden: state.adHidden, restoreButtons: state.restoreButtons }));

    await setSetting(cdp, popup.sessionId, "readerMode", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reader mode toggle applies on reader profile", state.reader && state.articleMaxWidth !== "none", { articleMaxWidth: state.articleMaxWidth, attrs: state.attrs }));
    await setSetting(cdp, popup.sessionId, "readerMode", false);

    await setSetting(cdp, popup.sessionId, "readingRuler", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reading ruler toggle shows ruler", state.rulerVisible, { rulerVisible: state.rulerVisible }));
    await setSetting(cdp, popup.sessionId, "readingRuler", false);

    await setSetting(cdp, popup.sessionId, "showActiveStateIndicator", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("active indicator toggle shows indicator", state.indicatorVisible, { indicatorVisible: state.indicatorVisible }));
    await setSetting(cdp, popup.sessionId, "showActiveStateIndicator", false);

    await setSetting(cdp, popup.sessionId, "textScale", 125);
    await setSetting(cdp, popup.sessionId, "lineHeight", 2);
    await setSetting(cdp, popup.sessionId, "pageDensity", "spacious");
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("text scale / line height / density apply", state.density === "spacious" && parseFloat(state.paragraphFontSize) > 18 && parseFloat(state.paragraphLineHeight) > 30, { density: state.density, paragraphFontSize: state.paragraphFontSize, paragraphLineHeight: state.paragraphLineHeight }));
    await setSetting(cdp, popup.sessionId, "textScale", 100);
    await setSetting(cdp, popup.sessionId, "lineHeight", 1.7);
    await setSetting(cdp, popup.sessionId, "pageDensity", "normal");

    // ADHD focus & reading supports + quick toggle
    await setSetting(cdp, popup.sessionId, "focusSpotlight", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("focus spotlight overlay shows", state.spotlightVisible, { spotlightVisible: state.spotlightVisible }));
    await setSetting(cdp, popup.sessionId, "focusSpotlight", false);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("focus spotlight off hides overlay", !state.spotlightVisible, { spotlightVisible: state.spotlightVisible }));

    await setSetting(cdp, popup.sessionId, "readingProgress", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reading progress bar shows on reader page", state.progressVisible, { progressVisible: state.progressVisible }));
    await setSetting(cdp, popup.sessionId, "readingProgress", false);

    await setSetting(cdp, popup.sessionId, "readerChunking", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("chunking marks read shape on article", state.chunking && state.readShape, { chunking: state.chunking, readShape: state.readShape }));
    await setSetting(cdp, popup.sessionId, "readerChunking", false);

    await setSetting(cdp, popup.sessionId, "letterSpacing", 0.08);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("letter spacing applies to paragraphs", state.letterSpacingAttr && parseFloat(state.paragraphLetterSpacing) > 0, { letterSpacingAttr: state.letterSpacingAttr, paragraphLetterSpacing: state.paragraphLetterSpacing }));
    await setSetting(cdp, popup.sessionId, "letterSpacing", 0);

    await setSetting(cdp, popup.sessionId, "readingWidth", 65);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("reading width marks read shape", state.readingWidthAttr && state.readShape, { readingWidthAttr: state.readingWidthAttr, readShape: state.readShape }));
    await setSetting(cdp, popup.sessionId, "readingWidth", 0);

    await setSetting(cdp, popup.sessionId, "showQuickToggle", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("quick toggle button shows when opted in", state.quickToggleVisible, { quickToggleVisible: state.quickToggleVisible }));
    await setSetting(cdp, popup.sessionId, "showQuickToggle", false);

    await setSetting(cdp, popup.sessionId, "themePreset", "soft-dark");
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("theme preset toggle applies", state.theme === "soft-dark", { theme: state.theme }));
    await setSetting(cdp, popup.sessionId, "themePreset", "soft-light");

    await setSetting(cdp, popup.sessionId, "aiHelperEnabled", true);
    await setSetting(cdp, popup.sessionId, "aiGentleSuggestions", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("AI gentle suggestion toggle applies marker", state.aiGentle, { aiGentle: state.aiGentle }));
    await setSetting(cdp, popup.sessionId, "aiGentleSuggestions", false);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("AI gentle suggestion off removes marker", !state.aiGentle, { aiGentle: state.aiGentle }));
    await setSetting(cdp, popup.sessionId, "aiHelperEnabled", false);

    await setSetting(cdp, popup.sessionId, "muteAutoplay", true);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("mute autoplay toggle mutes autoplay media", state.videoMuted === true && state.videoPaused === true, { videoMuted: state.videoMuted, videoPaused: state.videoPaused }));
    await setSetting(cdp, popup.sessionId, "muteAutoplay", false);

    const community = await createPage(cdp, `${baseUrl}/community`);
    await setSetting(cdp, popup.sessionId, "communityAssistEnabled", true);
    state = await snapshot(cdp, community.sessionId);
    checks.push(result("community assist toggle applies on community profile", state.community && state.attrs.some(([key, value]) => key === "data-asd-profile" && value === "community"), { attrs: state.attrs }));
    await setSetting(cdp, popup.sessionId, "communityAssistEnabled", false);

    await setSetting(cdp, popup.sessionId, "imageSofteningEnabled", true);
    await setSetting(cdp, popup.sessionId, "adRemovalEnabled", true);
    await setOverride(cdp, popup.sessionId, baseUrl, { disableImageSoftening: true, allowAds: true });
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("site override disables image softening and allows ads", !state.imageSoftening && !state.adRemoval, { imageSoftening: state.imageSoftening, adRemoval: state.adRemoval }));
    await setOverride(cdp, popup.sessionId, baseUrl, { disabled: true });
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("site override disabled turns foundation off", !state.foundation, { foundation: state.foundation, attrs: state.attrs }));
    await clearOverride(cdp, popup.sessionId, baseUrl);

    const sensitive = await createPage(cdp, `${baseUrl}/sensitive`);
    await setSetting(cdp, popup.sessionId, "imageSofteningEnabled", true);
    await setSetting(cdp, popup.sessionId, "adRemovalEnabled", true);
    await setSetting(cdp, popup.sessionId, "focusSpotlight", true);
    await setSetting(cdp, popup.sessionId, "readingProgress", true);
    state = await snapshot(cdp, sensitive.sessionId);
    checks.push(result("sensitive page disables high-variance supports", !!state.sensitive && !state.imageSoftening && !state.adRemoval && state.theme === "original", { sensitive: state.sensitive, imageSoftening: state.imageSoftening, adRemoval: state.adRemoval, theme: state.theme }));
    checks.push(result("sensitive page suppresses spotlight and progress", !!state.sensitive && !state.spotlightVisible && !state.progressVisible, { sensitive: state.sensitive, spotlightVisible: state.spotlightVisible, progressVisible: state.progressVisible }));
    await setSetting(cdp, popup.sessionId, "focusSpotlight", false);
    await setSetting(cdp, popup.sessionId, "readingProgress", false);

    await setSetting(cdp, popup.sessionId, "enabled", false);
    state = await snapshot(cdp, reader.sessionId);
    checks.push(result("global enabled off disables foundation", !state.foundation, { attrs: state.attrs }));

    const failed = checks.filter((check) => !check.ok);
    const report = { baseUrl, extensionId, total: checks.length, passed: checks.length - failed.length, failed: failed.length, results: checks };
    await mkdir("audit-reports", { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = failed.length ? 2 : 0;
  } finally {
    cdp.close();
    server.close();
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  server.close();
  process.exit(1);
});
