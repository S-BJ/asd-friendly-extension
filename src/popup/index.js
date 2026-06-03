import { resolveLocale as resolveUiLocale } from "../shared/i18n.js";
import { MESSAGE_TYPES } from "../shared/messages.js";
import { OPENAI_MODELS } from "../shared/openai-models.js";
import {
  DEFAULT_SITE_OVERRIDE,
  normalizeLocalSettings,
  normalizeSiteOverride,
  normalizeSyncSettings,
  originFromUrl
} from "../shared/settings.js";

let syncSettings = normalizeSyncSettings();
let localSettings = normalizeLocalSettings();
let activeOrigin = "";
let currentLocale = resolveUiLocale(syncSettings.uiLanguage, navigator.language || "");

const statusElement = document.getElementById("status");
const aiStatusElement = document.getElementById("ai-status");
const originLabel = document.getElementById("origin-label");
const firstRunPanel = document.getElementById("first-run-panel");
const apiKeyInput = document.getElementById("openAIApiKey");
const openAIModelSelect = document.getElementById("openAIModel");
const toggleApiKeyButton = document.getElementById("toggle-api-key");
const clearApiKeyButton = document.getElementById("clear-api-key");
const backendUrlInput = document.getElementById("backendUrl");
const explainSelectionButton = document.getElementById("explain-selection");
const explainPageButton = document.getElementById("explain-page");
const explainFormButton = document.getElementById("explain-form");
const aiShortcutKeyElement = document.getElementById("ai-shortcut-key");
const editAiShortcutButton = document.getElementById("edit-ai-shortcut");

const I18N = {
  en: {
    firstRunEyebrow: "First-run comfort setup",
    firstRunTitle: "Choose a calm starting point",
    firstRunCopy: "You can change every setting later. This setup only picks a reversible default.",
    presetMinimalSafe: "Minimal",
    presetSoftLight: "Soft light",
    presetSoftDark: "Soft dark",
    presetTextFocused: "Text focused",
    presetMotionMinimal: "Motion minimal",
    presetAdhdFocus: "ADHD focus",
    reduceContrast: "Reduce screen contrast",
    readableFont: "Use readable font",
    hideLikelyAds: "Hide likely ads",
    skipSetup: "Skip setup",
    checkingTab: "Checking the current tab.",
    regularTabMissing: "Not a regular webpage tab.",
    extensionOn: "On",
    language: "Language",
    languageAuto: "Auto",
    languageEnglish: "English",
    languageKorean: "Korean",
    comfortPreset: "Comfort preset",
    groupAppearance: "Appearance",
    groupDistractions: "Distractions & media",
    groupInterface: "Interface",
    hintAppearance: "Contrast, font, spacing, size",
    hintReading: "Reader, spotlight, progress",
    hintDistractions: "Ads, autoplay, community",
    hintInterface: "Indicator, quick toggle",
    hintAi: "Explain page, form, selection",
    hintSite: "Per-site exceptions",
    reduceMotion: "Reduce motion",
    reduceContrastShort: "Reduce contrast",
    readableFontShort: "Readable font",
    hideAds: "Hide ads",
    muteAutoplay: "Mute autoplay",
    readerMode: "Reader mode",
    communityAssist: "Community assist",
    readingRuler: "Reading ruler",
    adhdHeading: "Focus & reading",
    adhdCopy: "Supports for attention and place-keeping while reading.",
    focusSpotlight: "Focus spotlight",
    focusSpotlightScope: "Spotlight area",
    spotlightParagraph: "Paragraph",
    spotlightLine: "Line",
    readingProgress: "Reading progress",
    readerChunking: "Chunk long text",
    letterSpacing: "Letter spacing",
    readingWidth: "Reading width",
    widthOff: "Off",
    widthNarrow: "Narrow",
    widthMedium: "Medium",
    widthWide: "Wide",
    noFocusSpotlight: "No spotlight",
    noReadingProgress: "No progress bar",
    stateIndicator: "State indicator",
    quickToggle: "Quick toggle button",
    gentleAiWording: "Gentle AI wording",
    imageSoftening: "Image softening",
    pageDensity: "Page density",
    densityCompact: "Compact",
    densityNormal: "Normal",
    densitySpacious: "Spacious",
    textSize: "Text size",
    lineSpacing: "Line spacing",
    aiHelperHeading: "AI helper",
    aiHelperCopy: "Enter an OpenAI API key for direct use. A self-hosted backend URL is optional.",
    aiHelperToggle: "AI helper",
    openAIModelLabel: "OpenAI model",
    openAIModelNote: "Used for direct API calls and request-scoped backend calls.",
    apiKeyLabel: "OpenAI API key",
    backendUrlLabel: "Self-hosted backend URL (optional)",
    explainSelectionButton: "Explain selected text",
    explainPageButton: "Explain this page",
    explainFormButton: "Explain this form",
    aiStatusIdle: "AI results open on the current page.",
    aiShortcutLabel: "AI analysis shortcut",
    aiShortcutEdit: "Change",
    aiShortcutNone: "Not set",
    aiShortcutHint: "Opens your browser's keyboard-shortcut settings.",
    aiHelperDisabledPopup: "Turn on AI helper first.",
    aiSettingsSaved: "AI settings saved.",
    aiSettingsFailed: "Could not save AI settings.",
    aiSelectionRunning: "Sending the selected text to the AI helper.",
    aiPageRunning: "Sending visible page context and any visible form structure to the AI helper.",
    aiFormRunning: "Sending visible form structure to the AI helper.",
    aiSelectionDone: "The selected-text explanation opened on the page.",
    aiPageDone: "The page guide opened on the page.",
    aiFormDone: "The form guide opened on the page.",
    aiSelectionFailed: "Could not explain the selected text.",
    aiPageFailed: "Could not explain this page.",
    aiFormFailed: "Could not explain this form.",
    siteExceptions: "Current-site exceptions",
    disableHere: "Disable here",
    keepColors: "Keep colors",
    keepFonts: "Keep fonts",
    keepContrast: "Keep contrast",
    allowAds: "Allow ads",
    allowAutoplay: "Allow autoplay",
    noImageSoftening: "No image softening",
    noCommunityAssist: "No community assist",
    noReaderMode: "No reader mode",
    comfortSetupSaved: "Comfort setup saved.",
    comfortSetupFailed: "Could not save comfort setup.",
    setupSkipped: "Setup skipped.",
    setupSkipFailed: "Could not skip setup.",
    saved: "Saved.",
    settingsSaveFailed: "Could not save settings.",
    siteExceptionNeedsTab: "Open a regular webpage tab to save site exceptions.",
    siteExceptionSaved: "Site exception saved.",
    siteExceptionFailed: "Could not save site exception.",
    apiKeyReveal: "Show",
    apiKeyHide: "Hide",
    apiKeyClear: "Clear",
    apiKeyStorageNote: "Stored on this device only. Remove it if you stop using the extension.",
    apiKeyLooksUnusual: "API key saved, but it does not start with \"sk-\". Double-check if AI calls fail.",
    apiKeyCleared: "API key removed."
  },
  ko: {
    firstRunEyebrow: "처음 실행 설정",
    firstRunTitle: "차분한 시작점을 골라주세요",
    firstRunCopy: "모든 설정은 나중에 다시 바꿀 수 있어요. 여기서는 되돌릴 수 있는 기본값만 정해요.",
    presetMinimalSafe: "최소 변경",
    presetSoftLight: "부드러운 라이트",
    presetSoftDark: "부드러운 다크",
    presetTextFocused: "텍스트 집중",
    presetMotionMinimal: "움직임 최소",
    presetAdhdFocus: "ADHD 집중",
    reduceContrast: "화면 대비 줄이기",
    readableFont: "읽기 쉬운 글꼴 사용",
    hideLikelyAds: "광고로 보이는 영역 숨기기",
    skipSetup: "건너뛰기",
    checkingTab: "현재 탭을 확인하고 있어요.",
    regularTabMissing: "일반 웹페이지 탭이 아니에요.",
    extensionOn: "켜짐",
    language: "언어",
    languageAuto: "자동",
    languageEnglish: "영어",
    languageKorean: "한국어",
    comfortPreset: "편안함 프리셋",
    groupAppearance: "화면",
    groupDistractions: "방해 요소",
    groupInterface: "인터페이스 표시",
    hintAppearance: "대비·글꼴·자간·크기",
    hintReading: "읽기 모드·스포트라이트·진행바",
    hintDistractions: "광고·자동재생·커뮤니티",
    hintInterface: "상태 표시·퀵 토글",
    hintAi: "페이지·폼·선택 설명",
    hintSite: "사이트별 예외",
    reduceMotion: "움직임 줄이기",
    reduceContrastShort: "대비 줄이기",
    readableFontShort: "읽기 쉬운 글꼴",
    hideAds: "광고 숨기기",
    muteAutoplay: "자동 재생 음소거",
    readerMode: "읽기 모드",
    communityAssist: "커뮤니티 보조",
    readingRuler: "읽기 가이드",
    adhdHeading: "집중 & 읽기",
    adhdCopy: "읽는 동안 주의 유지와 위치 추적을 돕는 기능이에요.",
    focusSpotlight: "포커스 스포트라이트",
    focusSpotlightScope: "스포트라이트 범위",
    spotlightParagraph: "문단",
    spotlightLine: "줄",
    readingProgress: "읽기 진행바",
    readerChunking: "긴 글 끊어 읽기",
    letterSpacing: "자간",
    readingWidth: "본문 폭",
    widthOff: "끄기",
    widthNarrow: "좁게",
    widthMedium: "보통",
    widthWide: "넓게",
    noFocusSpotlight: "스포트라이트 끄기",
    noReadingProgress: "진행바 끄기",
    stateIndicator: "상태 표시",
    quickToggle: "퀵 토글 버튼",
    gentleAiWording: "AI 부드러운 표현",
    imageSoftening: "이미지 완화",
    pageDensity: "페이지 밀도",
    densityCompact: "촘촘하게",
    densityNormal: "기본",
    densitySpacious: "넓게",
    textSize: "글자 크기",
    lineSpacing: "줄 간격",
    aiHelperHeading: "AI 도움",
    aiHelperCopy: "OpenAI API 키를 넣으면 바로 사용할 수 있어요. 자체 호스팅 백엔드 URL은 선택 사항이에요.",
    aiHelperToggle: "AI 도움",
    openAIModelLabel: "OpenAI 모델",
    openAIModelNote: "직접 API 호출과 백엔드 요청별 호출에 사용돼요.",
    apiKeyLabel: "OpenAI API 키",
    backendUrlLabel: "자체 호스팅 백엔드 URL (선택)",
    explainSelectionButton: "선택한 텍스트 설명",
    explainPageButton: "이 페이지 설명",
    explainFormButton: "이 폼 설명",
    aiStatusIdle: "AI 결과는 현재 페이지에서 열려요.",
    aiShortcutLabel: "AI 분석 단축키",
    aiShortcutEdit: "변경",
    aiShortcutNone: "지정 안 됨",
    aiShortcutHint: "브라우저의 단축키 설정을 열어요.",
    aiHelperDisabledPopup: "AI 도움 기능을 먼저 켜주세요.",
    aiSettingsSaved: "AI 설정을 저장했어요.",
    aiSettingsFailed: "AI 설정을 저장하지 못했어요.",
    aiSelectionRunning: "선택한 텍스트를 AI 도움으로 보내고 있어요.",
    aiPageRunning: "보이는 페이지 정보를 AI 도움으로 보내고 있어요.",
    aiFormRunning: "보이는 폼 구조를 AI 도움으로 보내고 있어요.",
    aiSelectionDone: "선택한 텍스트 설명이 페이지에 열렸어요.",
    aiPageDone: "페이지 가이드가 페이지에 열렸어요.",
    aiFormDone: "폼 가이드가 페이지에 열렸어요.",
    aiSelectionFailed: "선택한 텍스트를 설명하지 못했어요.",
    aiPageFailed: "이 페이지를 설명하지 못했어요.",
    aiFormFailed: "이 폼을 설명하지 못했어요.",
    siteExceptions: "현재 사이트 예외",
    disableHere: "이 사이트에서는 끄기",
    keepColors: "원래 색 유지",
    keepFonts: "원래 글꼴 유지",
    keepContrast: "원래 대비 유지",
    allowAds: "광고 허용",
    allowAutoplay: "자동 재생 허용",
    noImageSoftening: "이미지 완화 끄기",
    noCommunityAssist: "커뮤니티 보조 끄기",
    noReaderMode: "읽기 모드 끄기",
    comfortSetupSaved: "처음 실행 설정을 저장했어요.",
    comfortSetupFailed: "처음 실행 설정을 저장하지 못했어요.",
    setupSkipped: "설정을 건너뛰었어요.",
    setupSkipFailed: "설정을 건너뛰지 못했어요.",
    saved: "저장했어요.",
    settingsSaveFailed: "설정을 저장하지 못했어요.",
    siteExceptionNeedsTab: "사이트 예외를 저장하려면 일반 웹페이지 탭이 필요해요.",
    siteExceptionSaved: "사이트 예외를 저장했어요.",
    siteExceptionFailed: "사이트 예외를 저장하지 못했어요.",
    apiKeyReveal: "표시",
    apiKeyHide: "숨김",
    apiKeyClear: "지우기",
    apiKeyStorageNote: "이 기기에만 저장돼요. 더 이상 사용하지 않으면 지워주세요.",
    apiKeyLooksUnusual: "API 키를 저장했지만 \"sk-\"로 시작하지 않아요. AI 호출이 실패하면 다시 확인해 주세요.",
    apiKeyCleared: "API 키를 삭제했어요."
  }
};

document.getElementById("enabled").addEventListener("change", (event) => {
  void saveSyncSetting("enabled", event.target.checked);
});

document.querySelectorAll("[data-setting]").forEach((control) => {
  control.addEventListener("change", () => {
    const key = control.dataset.setting;
    const value = readControlValue(control);
    void saveSyncSetting(key, value);
  });

  if (control.type === "range") {
    control.addEventListener("input", () => updateRangeOutput(control));
  }
});

document.querySelectorAll("[data-site-override]").forEach((control) => {
  control.addEventListener("change", () => {
    void saveSiteOverride(control.dataset.siteOverride, control.checked);
  });
});

document.querySelectorAll("[data-first-run-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    void completeFirstRun(button.dataset.firstRunPreset);
  });
});

document.getElementById("skip-first-run").addEventListener("click", () => {
  void skipFirstRun();
});

apiKeyInput.addEventListener("change", () => {
  void saveApiKey(apiKeyInput.value.trim());
});

toggleApiKeyButton.addEventListener("click", () => {
  const revealed = apiKeyInput.type === "text";
  apiKeyInput.type = revealed ? "password" : "text";
  toggleApiKeyButton.setAttribute("aria-pressed", String(!revealed));
  toggleApiKeyButton.textContent = t(revealed ? "apiKeyReveal" : "apiKeyHide");
});

clearApiKeyButton.addEventListener("click", () => {
  apiKeyInput.value = "";
  void saveApiKey("", { cleared: true });
});

backendUrlInput.addEventListener("change", () => {
  void saveLocalSetting("backendUrl", backendUrlInput.value.trim());
});

openAIModelSelect.addEventListener("change", () => {
  void saveLocalSetting("openAIModel", openAIModelSelect.value);
});

explainSelectionButton.addEventListener("click", () => {
  void runAiAction("selection");
});

explainPageButton.addEventListener("click", () => {
  void runAiAction("page");
});

explainFormButton.addEventListener("click", () => {
  void runAiAction("form");
});

editAiShortcutButton.addEventListener("click", () => {
  openShortcutSettings();
});

void load();

async function load() {
  renderOpenAIModelOptions();
  const [settingsResponse, localResponse, tab] = await Promise.all([
    sendRuntimeMessage({ type: MESSAGE_TYPES.getSettings }),
    sendRuntimeMessage({ type: MESSAGE_TYPES.getLocalSettings }),
    getActiveTab()
  ]);

  syncSettings = normalizeSyncSettings(settingsResponse?.settings);
  localSettings = normalizeLocalSettings(localResponse?.settings);
  activeOrigin = originFromUrl(tab?.url || "");
  render();
  if (!aiStatusElement.textContent) {
    setAiStatus(t("aiStatusIdle"));
  }
}

function render() {
  currentLocale = resolveUiLocale(syncSettings.uiLanguage, navigator.language || "");
  applyLocale();

  document.getElementById("enabled").checked = syncSettings.enabled;

  document.querySelectorAll("[data-setting]").forEach((control) => {
    const key = control.dataset.setting;
    if (!key) return;
    writeControlValue(control, syncSettings[key]);
    if (control.type === "range") updateRangeOutput(control);
  });

  apiKeyInput.value = localSettings.openAIApiKey || "";
  openAIModelSelect.value = localSettings.openAIModel || OPENAI_MODELS[0].id;
  backendUrlInput.value = localSettings.backendUrl || "";
  originLabel.textContent = activeOrigin || t("regularTabMissing");

  renderSiteOverrides();
  renderFirstRun();
  updateAiButtonState();
  refreshAiShortcut();
}

function applyLocale() {
  document.documentElement.lang = currentLocale;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) return;
    element.textContent = t(key);
  });
}

function renderOpenAIModelOptions() {
  openAIModelSelect.replaceChildren(
    ...OPENAI_MODELS.map((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = `${model.label} - ${model.description}`;
      return option;
    })
  );
}

function renderFirstRun() {
  firstRunPanel.hidden = Boolean(syncSettings.firstRunComplete);
}

function renderSiteOverrides() {
  const controls = [...document.querySelectorAll("[data-site-override]")];
  const override = activeOrigin
    ? normalizeSiteOverride(localSettings.siteOverrides[activeOrigin])
    : DEFAULT_SITE_OVERRIDE;

  for (const control of controls) {
    const key = control.dataset.siteOverride;
    control.checked = Boolean(override[key]);
    control.disabled = !activeOrigin;
  }
}

function updateAiButtonState() {
  const disabled = !syncSettings.aiHelperEnabled || !activeOrigin;
  explainSelectionButton.disabled = disabled;
  explainPageButton.disabled = disabled;
  explainFormButton.disabled = disabled;
}

function refreshAiShortcut() {
  if (!chrome.commands || !chrome.commands.getAll) {
    aiShortcutKeyElement.textContent = t("aiShortcutNone");
    return;
  }
  chrome.commands.getAll((commands) => {
    const command = Array.isArray(commands)
      ? commands.find((entry) => entry.name === "run-ai-analysis")
      : null;
    aiShortcutKeyElement.textContent = command && command.shortcut ? command.shortcut : t("aiShortcutNone");
  });
}

// Chrome/Edge cannot rebind a command from extension code, so the button opens
// the browser's own shortcut settings page. Firefox can open it programmatically.
function openShortcutSettings() {
  if (typeof browser !== "undefined" && browser.commands && browser.commands.openShortcutSettings) {
    void browser.commands.openShortcutSettings();
    window.close();
    return;
  }
  const url = navigator.userAgent.includes("Edg/")
    ? "edge://extensions/shortcuts"
    : "chrome://extensions/shortcuts";
  chrome.tabs.create({ url });
  window.close();
}

async function completeFirstRun(presetKey) {
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.completeFirstRun,
    payload: {
      activeComfortPreset: presetKey,
      readableFontEnabled: document.getElementById("first-run-readable-font").checked,
      reduceContrastEnabled: document.getElementById("first-run-reduce-contrast").checked,
      adRemovalEnabled: document.getElementById("first-run-ad-removal").checked
    }
  });

  if (response?.ok) {
    syncSettings = normalizeSyncSettings(response.settings);
    render();
    setStatus(t("comfortSetupSaved"));
    return;
  }

  setStatus(response?.error || t("comfortSetupFailed"), true);
}

async function skipFirstRun() {
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.completeFirstRun,
    payload: {}
  });

  if (response?.ok) {
    syncSettings = normalizeSyncSettings(response.settings);
    render();
    setStatus(t("setupSkipped"));
    return;
  }

  setStatus(response?.error || t("setupSkipFailed"), true);
}

async function saveSyncSetting(key, value) {
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.setSettings,
    payload: { [key]: value }
  });

  if (response?.ok) {
    syncSettings = normalizeSyncSettings(response.settings);
    render();
    setStatus(t("saved"));
    return;
  }

  setStatus(response?.error || t("settingsSaveFailed"), true);
}

async function saveLocalSetting(key, value) {
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.setLocalSettings,
    payload: { [key]: value }
  });

  if (response?.ok) {
    localSettings = normalizeLocalSettings(response.settings);
    render();
    setAiStatus(t("aiSettingsSaved"));
    return;
  }

  setAiStatus(response?.error || t("aiSettingsFailed"), true);
}

async function saveApiKey(value, { cleared = false } = {}) {
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.setLocalSettings,
    payload: { openAIApiKey: value }
  });

  if (!response?.ok) {
    setAiStatus(response?.error || t("aiSettingsFailed"), true);
    return;
  }

  localSettings = normalizeLocalSettings(response.settings);
  render();
  if (cleared) {
    setAiStatus(t("apiKeyCleared"));
    return;
  }
  if (value && !/^sk-[A-Za-z0-9_-]{10,}$/.test(value)) {
    setAiStatus(t("apiKeyLooksUnusual"), true);
    return;
  }
  setAiStatus(t("aiSettingsSaved"));
}

async function saveSiteOverride(key, value) {
  if (!activeOrigin) {
    setStatus(t("siteExceptionNeedsTab"), true);
    return;
  }

  const current = normalizeSiteOverride(localSettings.siteOverrides[activeOrigin]);
  const next = { ...current, [key]: value };
  const response = await sendRuntimeMessage({
    type: MESSAGE_TYPES.setSiteOverride,
    origin: activeOrigin,
    payload: { override: next }
  });

  if (response?.ok) {
    localSettings = normalizeLocalSettings({
      ...localSettings,
      siteOverrides: response.siteOverrides
    });
    renderSiteOverrides();
    setStatus(t("siteExceptionSaved"));
    return;
  }

  setStatus(response?.error || t("siteExceptionFailed"), true);
}

async function runAiAction(kind) {
  if (!syncSettings.aiHelperEnabled) {
    setAiStatus(t("aiHelperDisabledPopup"), true);
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id || !activeOrigin) {
    setAiStatus(t("regularTabMissing"), true);
    return;
  }

  const button = getAiButton(kind);
  const messageType = getAiMessageType(kind);
  const runningKey = getAiRunningKey(kind);
  const doneKey = getAiDoneKey(kind);
  const failedKey = getAiFailedKey(kind);

  button.disabled = true;
  setAiStatus(t(runningKey));

  let response;
  try {
    response = await sendRuntimeMessage({
      type: messageType,
      tabId: tab.id
    });
  } catch (error) {
    setAiStatus(error?.message || t(failedKey), true);
    return;
  } finally {
    button.disabled = false;
    updateAiButtonState();
  }

  if (response?.ok) {
    setAiStatus(t(doneKey));
    return;
  }

  setAiStatus(response?.error || t(failedKey), true);
}

function getAiButton(kind) {
  if (kind === "form") return explainFormButton;
  if (kind === "page") return explainPageButton;
  return explainSelectionButton;
}

function getAiMessageType(kind) {
  if (kind === "form") return MESSAGE_TYPES.explainForm;
  if (kind === "page") return MESSAGE_TYPES.explainPage;
  return MESSAGE_TYPES.explainSelection;
}

function getAiRunningKey(kind) {
  if (kind === "form") return "aiFormRunning";
  if (kind === "page") return "aiPageRunning";
  return "aiSelectionRunning";
}

function getAiDoneKey(kind) {
  if (kind === "form") return "aiFormDone";
  if (kind === "page") return "aiPageDone";
  return "aiSelectionDone";
}

function getAiFailedKey(kind) {
  if (kind === "form") return "aiFormFailed";
  if (kind === "page") return "aiPageFailed";
  return "aiSelectionFailed";
}

function readControlValue(control) {
  if (control.type === "checkbox") return control.checked;
  if (control.type === "range") return Number(control.value);
  return control.value;
}

function writeControlValue(control, value) {
  if (control.type === "checkbox") {
    control.checked = Boolean(value);
    return;
  }
  control.value = String(value ?? control.value);
}

function updateRangeOutput(control) {
  const output = document.getElementById(`${control.id}-output`);
  if (!output) return;

  if (control.id === "lineHeight") {
    output.textContent = Number(control.value).toFixed(1);
    return;
  }

  if (control.id === "letterSpacing") {
    output.textContent = `${Number(control.value).toFixed(2)}em`;
    return;
  }

  output.textContent = `${control.value}%`;
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(tabs[0] || null);
    });
  });
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "No response." });
    });
  });
}

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.toggleAttribute("data-error", isError);
}

function setAiStatus(message, isError = false) {
  aiStatusElement.textContent = message;
  aiStatusElement.toggleAttribute("data-error", isError);
}

function t(key) {
  return I18N[currentLocale]?.[key] || I18N.en[key] || key;
}
