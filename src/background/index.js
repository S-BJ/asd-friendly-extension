import { requestFormExplanation, requestPageSummary, requestSelectionExplanation, AI_CLIENT_ERROR_CODES } from "./ai-client.js";
import { resolveLocale } from "../shared/i18n.js";
import { MESSAGE_TYPES } from "../shared/messages.js";
import {
  DEFAULT_LOCAL_SETTINGS,
  DEFAULT_SYNC_SETTINGS,
  applyComfortPreset,
  normalizeLocalSettings,
  normalizeSiteOverride,
  normalizeSiteOverrides,
  normalizeSyncSettings,
  originFromUrl
} from "../shared/settings.js";

const AD_BLOCK_RULESET_ID = "asd_ad_block";
const AD_ALLOW_RULE_ID_START = 900000;
const AD_ALLOW_RULE_ID_END = 900199;
const AD_RULE_RESOURCE_TYPES = ["script", "image", "xmlhttprequest", "sub_frame", "media", "font", "stylesheet", "ping", "other"];

const UI_TEXT = {
  en: {
    regularPageRequired: "Open a regular webpage tab first.",
    aiHelperDisabled: "Turn on AI helper first.",
    missingApiKey: "Enter your OpenAI API key in the popup, or set a self-hosted backend URL.",
    selectedTextRequired: "Highlight text on the page first.",
    pageContextUnavailable: "This page did not expose enough visible content to explain yet.",
    formContextUnavailable: "This page did not expose a form I can explain.",
    pageBlocked: "This page does not allow the extension to read its content. Restricted pages such as chrome:// or the Chrome Web Store are blocked.",
    sensitivePageBlocked: "AI helper is off on this page because it looks like a sign-in, payment, identity, or upload screen. Open a regular page to use AI.",
    backendOffline: "The self-hosted AI backend is not reachable.",
    backendInvalid: "The AI service returned an invalid response.",
    requestTimedOut: "The AI request did not finish in time. Try again.",
    selectionFailed: "The AI helper could not explain the selected text.",
    pageFailed: "The AI helper could not explain this page.",
    formFailed: "The AI helper could not explain this form.",
    selectionLoading: "Reading the selected text and nearby visible context.",
    pageLoading: "Collecting visible page structure and any visible form details.",
    formLoading: "Collecting visible form labels, warnings, and button labels.",
    summarySelectionText: "Selected text",
    summaryNearbyText: "Nearby visible text",
    summaryPageIdentity: "Page title and address",
    summaryVisibleHeadings: "Visible headings",
    summaryVisibleActions: "Visible buttons and actions",
    summaryVisibleSnippets: "Short visible page snippets",
    summaryVisibleCommunityItems: "Visible posts and comments only",
    summaryFormLabels: "Form labels and field types",
    summaryFormButtons: "Visible button labels",
    summaryFormWarnings: "Visible warnings and help text",
    summaryNoTypedValues: "No typed input values",
    noteSelection: "Based on the selected text and nearby visible text only.",
    notePage: "Based on visible page content only, not the full page source.",
    noteCommunity: "Based on visible community items only, not the whole thread or community.",
    noteForm: "Based on visible form labels and warnings only. Typed values are excluded."
  },
  ko: {
    regularPageRequired: "\uc77c\ubc18 \uc6f9 \ud398\uc774\uc9c0 \ud0ed\uc744 \uba3c\uc800 \uc5f4\uc5b4\uc8fc\uc138\uc694.",
    aiHelperDisabled: "AI \ub3c4\uc6c0 \uae30\ub2a5\uc744 \uba3c\uc800 \ucf1c\uc8fc\uc138\uc694.",
    missingApiKey: "\ud31d\uc5c5\uc5d0 OpenAI API \ud0a4\ub97c \uc785\ub825\ud558\uac70\ub098 \uc790\uccb4 \ud638\uc2a4\ud305 \ubc31\uc5d4\ub4dc URL\uc744 \uc124\uc815\ud574\uc8fc\uc138\uc694.",
    selectedTextRequired: "\ud398\uc774\uc9c0\uc5d0\uc11c \ud14d\uc2a4\ud2b8\ub97c \uba3c\uc800 \uc120\ud0dd\ud574\uc8fc\uc138\uc694.",
    pageContextUnavailable: "\uc774 \ud398\uc774\uc9c0\uc5d0\uc11c\ub294 \uc124\uba85\uc5d0 \ud544\uc694\ud55c \ubcf4\uc774\ub294 \uc815\ubcf4\ub97c \ucda9\ubd84\ud788 \uac00\uc838\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    formContextUnavailable: "\uc124\uba85\ud560 \uc218 \uc788\ub294 \ud3fc\uc744 \uc774 \ud398\uc774\uc9c0\uc5d0\uc11c \ucc3e\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    pageBlocked: "\uc774 \ud398\uc774\uc9c0\ub294 \ud655\uc7a5 \ud504\ub85c\uadf8\ub7a8\uc774 \ub0b4\uc6a9\uc744 \uc77d\uc744 \uc218 \uc5c6\uc5b4\uc694. chrome:// \ud398\uc774\uc9c0\ub098 \ud06c\ub86c \uc6f9\uc2a4\ud1a0\uc5b4 \uac19\uc740 \uc81c\ud55c \ud398\uc774\uc9c0\ub294 \uc9c0\uc6d0\ud558\uc9c0 \uc54a\uc544\uc694.",
    sensitivePageBlocked: "\ub85c\uadf8\uc778, \uacb0\uc81c, \ubcf8\uc778\uc778\uc99d, \uc5c5\ub85c\ub4dc \ud398\uc774\uc9c0\ub85c \ubcf4\uc5ec\uc11c AI \ub3c4\uc6c0\uc744 \uaed0\uc5b4\uc694. \uc77c\ubc18 \ud398\uc774\uc9c0\uc5d0\uc11c \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
    backendOffline: "\uc790\uccb4 \ud638\uc2a4\ud305 AI \ubc31\uc5d4\ub4dc\uc5d0 \uc5f0\uacb0\ud560 \uc218 \uc5c6\uc5b4\uc694.",
    backendInvalid: "AI \uc11c\ube44\uc2a4\uac00 \uc62c\ubc14\ub978 \uc751\ub2f5\uc744 \ubcf4\ub0b4\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    requestTimedOut: "AI \uc694\uccad\uc774 \uc2dc\uac04 \uc548\uc5d0 \ub05d\ub098\uc9c0 \ubabb\ud588\uc5b4\uc694. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
    selectionFailed: "AI \ub3c4\uc6c0\uc774 \uc120\ud0dd\ud55c \ud14d\uc2a4\ud2b8\ub97c \uc124\uba85\ud558\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    pageFailed: "AI \ub3c4\uc6c0\uc774 \uc774 \ud398\uc774\uc9c0\ub97c \uc124\uba85\ud558\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    formFailed: "AI \ub3c4\uc6c0\uc774 \uc774 \ud3fc\uc744 \uc124\uba85\ud558\uc9c0 \ubabb\ud588\uc5b4\uc694.",
    selectionLoading: "\uc120\ud0dd\ud55c \ud14d\uc2a4\ud2b8\uc640 \uadfc\ucc98\uc758 \ubcf4\uc774\ub294 \ub9e5\ub77d\uc744 \uc77d\uace0 \uc788\uc5b4\uc694.",
    pageLoading: "\ubcf4\uc774\ub294 \ud398\uc774\uc9c0 \uad6c\uc131\uacfc \ud3fc \uc815\ubcf4\uac00 \uc788\uc73c\uba74 \ud568\uaed8 \ubaa8\uc73c\uace0 \uc788\uc5b4\uc694.",
    formLoading: "\ubcf4\uc774\ub294 \ud3fc \ub77c\ubca8, \uacbd\uace0, \ubc84\ud2bc \ubb38\uad6c\ub97c \ubaa8\uc73c\uace0 \uc788\uc5b4\uc694.",
    summarySelectionText: "\uc120\ud0dd\ud55c \ud14d\uc2a4\ud2b8",
    summaryNearbyText: "\uadfc\ucc98\uc758 \ubcf4\uc774\ub294 \ud14d\uc2a4\ud2b8",
    summaryPageIdentity: "\ud398\uc774\uc9c0 \uc81c\ubaa9\uacfc \uc8fc\uc18c",
    summaryVisibleHeadings: "\ubcf4\uc774\ub294 \uc81c\ubaa9",
    summaryVisibleActions: "\ubcf4\uc774\ub294 \ubc84\ud2bc\uacfc \uc8fc\uc694 \ub3d9\uc791",
    summaryVisibleSnippets: "\uc9e7\uc740 \ubcf4\uc774\ub294 \ud398\uc774\uc9c0 \ub0b4\uc6a9",
    summaryVisibleCommunityItems: "\ubcf4\uc774\ub294 \uac8c\uc2dc\ubb3c\uacfc \ub313\uae00\ub9cc",
    summaryFormLabels: "\ud3fc \ub77c\ubca8\uacfc \ud544\ub4dc \uc720\ud615",
    summaryFormButtons: "\ubcf4\uc774\ub294 \ubc84\ud2bc \ubb38\uad6c",
    summaryFormWarnings: "\ubcf4\uc774\ub294 \uacbd\uace0\uc640 \ub3c4\uc6c0 \ubb38\uad6c",
    summaryNoTypedValues: "\uc785\ub825\ud55c \uac12\uc740 \uc81c\uc678",
    noteSelection: "\uc120\ud0dd\ud55c \ud14d\uc2a4\ud2b8\uc640 \uadfc\ucc98\uc758 \ubcf4\uc774\ub294 \ub0b4\uc6a9\ub9cc \ubcf4\uace0 \uc124\uba85\ud574\uc694.",
    notePage: "\ud398\uc774\uc9c0 \uc804\uccb4 \uc18c\uc2a4\uac00 \uc544\ub2c8\ub77c \ubcf4\uc774\ub294 \ub0b4\uc6a9\ub9cc \uae30\uc900\uc73c\ub85c \uc124\uba85\ud574\uc694.",
    noteCommunity: "\ucee4\ubba4\ub2c8\ud2f0 \uc804\uccb4\uac00 \uc544\ub2c8\ub77c \ud604\uc7ac \ubcf4\uc774\ub294 \uac8c\uc2dc\ubb3c\uacfc \ub313\uae00\ub9cc \uae30\uc900\uc73c\ub85c \uc124\uba85\ud574\uc694.",
    noteForm: "\ubcf4\uc774\ub294 \ud3fc \ub77c\ubca8\uacfc \uacbd\uace0\ub9cc \ubcf4\uace0 \uc124\uba85\ud574\uc694. \uc785\ub825\ud55c \uac12\uc740 \ubcf4\ub0b4\uc9c0 \uc54a\uc544\uc694."
  }
};

chrome.runtime.onInstalled.addListener(() => {
  void ensureStoredSettings();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureStoredSettings();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "run-ai-analysis") {
    void runAiShortcutCommand();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) return false;

  switch (message.type) {
    case MESSAGE_TYPES.getSettings:
      return respondWith(getSyncSettings().then((settings) => ({ settings })), sendResponse);

    case MESSAGE_TYPES.setSettings:
      return respondWith(setSyncSettings(message.payload).then((settings) => ({ settings })), sendResponse);

    case MESSAGE_TYPES.completeFirstRun:
      return respondWith(completeFirstRun(message.payload).then((settings) => ({ settings })), sendResponse);

    case MESSAGE_TYPES.getLocalSettings:
      return respondWith(
        getLocalSettings().then((settings) => ({ settings, activeOrigin: getSenderTabOrigin(sender) })),
        sendResponse
      );

    case MESSAGE_TYPES.setLocalSettings:
      return respondWith(setLocalSettings(message.payload).then((settings) => ({ settings })), sendResponse);

    case MESSAGE_TYPES.getSiteOverrides:
      return respondWith(getLocalSettings().then((settings) => ({ siteOverrides: settings.siteOverrides })), sendResponse);

    case MESSAGE_TYPES.setSiteOverride:
      return respondWith(setSiteOverrideFromMessage(message, sender), sendResponse);

    case MESSAGE_TYPES.clearSiteOverride:
      return respondWith(clearSiteOverrideFromMessage(message, sender), sendResponse);

    case MESSAGE_TYPES.explainSelection:
      return respondWith(
        runAiWorkflow({
          message,
          sender,
          requestType: "selection",
          contextMessageType: MESSAGE_TYPES.getSelectionContext,
          isContextValid: (context) => Boolean(context?.selectionText),
          emptyContextKey: "selectedTextRequired",
          callBackend: requestSelectionExplanation
        }),
        sendResponse
      );

    case MESSAGE_TYPES.explainPage:
      return respondWith(runUnifiedPageWorkflow({ message, sender }), sendResponse);

    case MESSAGE_TYPES.explainForm:
      return respondWith(
        runAiWorkflow({
          message,
          sender,
          requestType: "form",
          contextMessageType: MESSAGE_TYPES.getFormContext,
          isContextValid: (context) => Array.isArray(context?.fields) && context.fields.length > 0,
          emptyContextKey: "formContextUnavailable",
          callBackend: requestFormExplanation
        }),
        sendResponse
      );

    default:
      return false;
  }
});

async function ensureStoredSettings() {
  const [syncSettings, localSettings] = await Promise.all([
    chrome.storage.sync.get(DEFAULT_SYNC_SETTINGS),
    chrome.storage.local.get(DEFAULT_LOCAL_SETTINGS)
  ]);

  const normalizedSyncSettings = normalizeSyncSettings(syncSettings);
  const normalizedLocalSettings = normalizeLocalSettings(localSettings);

  await Promise.all([
    chrome.storage.sync.set(normalizedSyncSettings),
    chrome.storage.local.set(normalizedLocalSettings)
  ]);
  await syncDeclarativeAdBlocking(normalizedSyncSettings, normalizedLocalSettings);
}

async function getSyncSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SYNC_SETTINGS);
  return normalizeSyncSettings(stored);
}

async function setSyncSettings(payload = {}) {
  const current = await getSyncSettings();
  const rawPayload = safeObject(payload);
  const next = rawPayload.activeComfortPreset
    ? applyComfortPreset(current, rawPayload.activeComfortPreset, rawPayload)
    : normalizeSyncSettings({ ...current, ...rawPayload });

  await chrome.storage.sync.set(next);
  await Promise.all([
    syncDeclarativeAdBlocking(next, await getLocalSettings()),
    ensureActiveTabRuntime()
  ]);
  return next;
}

async function completeFirstRun(payload = {}) {
  return setSyncSettings({
    ...safeObject(payload),
    firstRunComplete: true
  });
}

async function getLocalSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_LOCAL_SETTINGS);
  return normalizeLocalSettings(stored);
}

async function setLocalSettings(payload = {}) {
  const current = await getLocalSettings();
  const next = normalizeLocalSettings({ ...current, ...safeObject(payload) });
  await chrome.storage.local.set(next);
  await syncDeclarativeAdBlocking(await getSyncSettings(), next);
  return next;
}

async function setSiteOverrideFromMessage(message, sender) {
  const localSettings = await getLocalSettings();
  const origin = getMessageOrigin(message, sender);
  if (!origin) throw new Error("A valid http(s) origin is required.");

  const payload = safeObject(message.payload);
  const overridePayload = safeObject(payload.override || payload.settings || payload);
  const siteOverrides = normalizeSiteOverrides({
    ...localSettings.siteOverrides,
    [origin]: normalizeSiteOverride({
      ...localSettings.siteOverrides[origin],
      ...overridePayload
    })
  });

  await chrome.storage.local.set({ siteOverrides });
  await Promise.all([
    syncDeclarativeAdBlocking(await getSyncSettings(), normalizeLocalSettings({ ...localSettings, siteOverrides })),
    ensureActiveTabRuntime()
  ]);
  return { origin, siteOverride: siteOverrides[origin], siteOverrides };
}

async function clearSiteOverrideFromMessage(message, sender) {
  const localSettings = await getLocalSettings();
  const origin = getMessageOrigin(message, sender);
  if (!origin) throw new Error("A valid http(s) origin is required.");

  const siteOverrides = { ...localSettings.siteOverrides };
  delete siteOverrides[origin];
  await chrome.storage.local.set({ siteOverrides });
  await Promise.all([
    syncDeclarativeAdBlocking(await getSyncSettings(), normalizeLocalSettings({ ...localSettings, siteOverrides })),
    ensureActiveTabRuntime()
  ]);
  return { origin, siteOverrides };
}

async function ensureActiveTabRuntime() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && isSupportedPageUrl(tab.url)) {
      await ensureContentScriptInjected(tab);
    }
  } catch (error) {
    console.warn("[asd] ensureActiveTabRuntime failed", error);
  }
}

async function syncDeclarativeAdBlocking(syncSettings, localSettings) {
  if (!chrome.declarativeNetRequest?.updateEnabledRulesets) return;

  const shouldBlockAds = Boolean(syncSettings?.enabled && syncSettings?.adRemovalEnabled);
  const ruleSetChange = shouldBlockAds
    ? { enableRulesetIds: [AD_BLOCK_RULESET_ID], disableRulesetIds: [] }
    : { enableRulesetIds: [], disableRulesetIds: [AD_BLOCK_RULESET_ID] };

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(ruleSetChange);
    await syncAdAllowRules(shouldBlockAds, localSettings);
  } catch (error) {
    console.warn("[asd] syncDeclarativeAdBlocking failed", error);
  }
}

async function syncAdAllowRules(shouldBlockAds, localSettings) {
  if (!chrome.declarativeNetRequest?.getDynamicRules || !chrome.declarativeNetRequest?.updateDynamicRules) return;

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules
    .map((rule) => rule.id)
    .filter((id) => id >= AD_ALLOW_RULE_ID_START && id <= AD_ALLOW_RULE_ID_END);
  const addRules = shouldBlockAds ? buildAdAllowRules(localSettings) : [];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

function buildAdAllowRules(localSettings) {
  const overrides = normalizeLocalSettings(localSettings).siteOverrides;
  const allowedEntries = Object.entries(overrides)
    .filter(([, override]) => override.allowAds)
    .map(([origin]) => originToHostname(origin))
    .filter(Boolean);
  const capacity = AD_ALLOW_RULE_ID_END - AD_ALLOW_RULE_ID_START + 1;
  if (allowedEntries.length > capacity) {
    console.warn(
      `[asd] allowAds overrides (${allowedEntries.length}) exceed dynamic rule capacity (${capacity}). ` +
        "Extra entries will keep being blocked."
    );
  }
  const allowedDomains = allowedEntries.slice(0, capacity);

  return allowedDomains.map((domain, index) => ({
    id: AD_ALLOW_RULE_ID_START + index,
    priority: 100,
    action: { type: "allow" },
    condition: {
      urlFilter: "*",
      initiatorDomains: [domain],
      resourceTypes: AD_RULE_RESOURCE_TYPES
    }
  }));
}

function originToHostname(origin) {
  try {
    return new URL(origin).hostname;
  } catch {
    return "";
  }
}

async function runAiWorkflow({ message, sender, requestType, contextMessageType, isContextValid, emptyContextKey, callBackend }) {
  const syncSettings = await getSyncSettings();
  const locale = getUiLocale(syncSettings.uiLanguage);

  if (!syncSettings.aiHelperEnabled) {
    throw new Error(t(locale, "aiHelperDisabled"));
  }

  const tab = await resolveTargetTab(message, sender);
  if (!isSupportedPageUrl(tab?.url)) {
    throw new Error(t(locale, "regularPageRequired"));
  }

  const rawContext = await getTabContext(tab, contextMessageType, locale);
  if (isSensitiveContext(rawContext)) {
    throw new Error(t(locale, "sensitivePageBlocked"));
  }
  const context = withPreferredResponseLanguage(rawContext, locale);
  return runAiRequestForTab({
    tab,
    locale,
    requestType,
    context,
    isContextValid,
    emptyContextKey,
    callBackend
  });
}

async function runUnifiedPageWorkflow({ message, sender, tab: tabOverride, locale: localeOverride } = {}) {
  const syncSettings = await getSyncSettings();
  const locale = localeOverride || getUiLocale(syncSettings.uiLanguage);

  if (!syncSettings.aiHelperEnabled) {
    throw new Error(t(locale, "aiHelperDisabled"));
  }

  const tab = tabOverride || await resolveTargetTab(message, sender);
  if (!isSupportedPageUrl(tab?.url)) {
    throw new Error(t(locale, "regularPageRequired"));
  }

  const rawPageContext = await getTabContext(tab, MESSAGE_TYPES.getPageContext, locale);
  const rawFormContext = await getOptionalTabContext(tab, MESSAGE_TYPES.getFormContext);
  if (isSensitiveContext(rawPageContext) || isSensitiveContext(rawFormContext)) {
    throw new Error(t(locale, "sensitivePageBlocked"));
  }
  const pageContext = withPreferredResponseLanguage(rawPageContext, locale);
  const formContext = withPreferredResponseLanguage(rawFormContext, locale);

  return runUnifiedPageRequestForTab({
    tab,
    locale,
    pageContext,
    formContext
  });
}

async function runAiShortcutCommand() {
  const syncSettings = await getSyncSettings();
  if (!syncSettings.aiHelperEnabled) return;

  const locale = getUiLocale(syncSettings.uiLanguage);
  const tab = await resolveTargetTab(null, null);
  if (!isSupportedPageUrl(tab?.url)) return;

  const rawSelectionContext = await getTabContext(tab, MESSAGE_TYPES.getSelectionContext, locale);
  if (isSensitiveContext(rawSelectionContext)) return;

  const selectionContext = withPreferredResponseLanguage(rawSelectionContext, locale);
  if (selectionContext?.selectionText) {
    await runAiRequestForTab({
      tab,
      locale,
      requestType: "selection",
      context: selectionContext,
      isContextValid: (context) => Boolean(context?.selectionText),
      emptyContextKey: "selectedTextRequired",
      callBackend: requestSelectionExplanation
    });
    return;
  }

  await runUnifiedPageWorkflow({
    tab,
    locale
  });
}

async function runUnifiedPageRequestForTab({ tab, locale, pageContext, formContext }) {
  const hasPage = hasPageContext(pageContext);
  const hasForm = hasFormContext(formContext);

  if (!hasPage && !hasForm) {
    throw new Error(t(locale, "pageContextUnavailable"));
  }

  const requestSummary = buildRequestSummary(locale, "page", pageContext);
  await openLoadingPanel(tab, "page", requestSummary, locale);

  try {
    const localSettings = await getLocalSettings();
    const pagePromise = hasPage ? requestPageSummary(localSettings, pageContext) : Promise.resolve(null);
    const formPromise = hasForm
      ? requestFormExplanation(localSettings, formContext).catch(() => null)
      : Promise.resolve(null);

    const [pageResult, formResult] = await Promise.all([pagePromise, formPromise]);
    const response = {
      ...(pageResult?.payload || {})
    };

    if (formResult?.payload) {
      response.formGuide = formResult.payload;
    }

    await sendTabMessageWithRecovery(tab, {
      type: MESSAGE_TYPES.showAiResult,
      payload: {
        requestType: "page",
        requestSummary,
        response,
        model: pageResult?.model || formResult?.model || ""
      }
    });

    return {
      requestType: "page",
      model: pageResult?.model || formResult?.model || ""
    };
  } catch (error) {
    const messageText = formatAiError(error, locale, "page");

    try {
      await sendTabMessageWithRecovery(tab, {
        type: MESSAGE_TYPES.showAiError,
        payload: {
          requestType: "page",
          requestSummary,
          message: messageText
        }
      });
    } catch {}

    throw new Error(messageText);
  }
}

async function runAiRequestForTab({ tab, locale, requestType, context, isContextValid, emptyContextKey, callBackend }) {
  if (!isContextValid(context)) {
    throw new Error(t(locale, emptyContextKey));
  }

  const requestSummary = buildRequestSummary(locale, requestType, context);
  await openLoadingPanel(tab, requestType, requestSummary, locale);

  try {
    const localSettings = await getLocalSettings();
    const result = await callBackend(localSettings, context);

    await sendTabMessageWithRecovery(tab, {
      type: MESSAGE_TYPES.showAiResult,
      payload: {
        requestType,
        requestSummary,
        response: result.payload,
        model: result.model
      }
    });

    return {
      requestType,
      model: result.model
    };
  } catch (error) {
    const messageText = formatAiError(error, locale, requestType);

    try {
      await sendTabMessageWithRecovery(tab, {
        type: MESSAGE_TYPES.showAiError,
        payload: {
          requestType,
          requestSummary,
          message: messageText
        }
      });
    } catch {}

    throw new Error(messageText);
  }
}

async function resolveTargetTab(message, sender) {
  const requestedTabId = Number(message?.tabId || sender?.tab?.id || 0);
  if (requestedTabId > 0) {
    try {
      return await chrome.tabs.get(requestedTabId);
    } catch {
      return null;
    }
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function getTabContext(tab, contextMessageType, locale) {
  try {
    return await sendTabMessageWithRecovery(tab, { type: contextMessageType });
  } catch {
    throw new Error(t(locale, "pageBlocked"));
  }
}

async function getOptionalTabContext(tab, contextMessageType) {
  try {
    return await sendTabMessageWithRecovery(tab, { type: contextMessageType });
  } catch {
    return null;
  }
}

async function openLoadingPanel(tab, requestType, requestSummary, locale) {
  try {
    await sendTabMessageWithRecovery(tab, {
      type: MESSAGE_TYPES.openAssistPanel,
      payload: {
        state: "loading",
        requestType,
        requestSummary,
        message: t(locale, `${requestType}Loading`)
      }
    });
  } catch {
    throw new Error(t(locale, "pageBlocked"));
  }
}

async function sendTabMessageWithRecovery(tab, message) {
  try {
    return await sendTabMessage(tab.id, message);
  } catch (error) {
    const recovered = await ensureContentScriptInjected(tab);
    if (!recovered) throw error;
    return sendTabMessage(tab.id, message);
  }
}

async function ensureContentScriptInjected(tab) {
  if (!tab?.id || !isSupportedPageUrl(tab?.url)) return false;

  try {
    await sendTabMessage(tab.id, { type: MESSAGE_TYPES.ping });
    return true;
  } catch {
    /* no content script yet; try injecting */
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content/styles.css"]
    });
  } catch (error) {
    console.warn("[asd] insertCSS failed", error);
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/index.js"]
    });
    return true;
  } catch (error) {
    console.warn("[asd] executeScript failed", error);
    return false;
  }
}

function isSensitiveContext(context) {
  const kind = context?.sensitivePageKind;
  return typeof kind === "string" && kind && kind !== "none";
}

function hasPageContext(context) {
  return Boolean(
    Array.isArray(context?.visibleHeadings) && context.visibleHeadings.length > 0 ||
      Array.isArray(context?.keyActions) && context.keyActions.length > 0 ||
      Array.isArray(context?.importantTextSnippets) && context.importantTextSnippets.length > 0 ||
      Array.isArray(context?.visibleCommunityItems) && context.visibleCommunityItems.length > 0
  );
}

function hasFormContext(context) {
  return Boolean(Array.isArray(context?.fields) && context.fields.length > 0);
}

function buildRequestSummary(locale, requestType, context) {
  if (requestType === "selection") {
    return {
      items: [t(locale, "summarySelectionText"), t(locale, "summaryNearbyText"), t(locale, "summaryPageIdentity")],
      note: t(locale, "noteSelection")
    };
  }

  if (requestType === "form") {
    return {
      items: [
        t(locale, "summaryFormLabels"),
        t(locale, "summaryFormButtons"),
        t(locale, "summaryFormWarnings"),
        t(locale, "summaryNoTypedValues")
      ],
      note: t(locale, "noteForm")
    };
  }

  const items = [
    t(locale, "summaryVisibleHeadings"),
    t(locale, "summaryVisibleActions"),
    t(locale, "summaryVisibleSnippets")
  ];

  if (context?.pageProfile === "community") {
    items.push(t(locale, "summaryVisibleCommunityItems"));
  }

  return {
    items,
    note: context?.pageProfile === "community" ? t(locale, "noteCommunity") : t(locale, "notePage")
  };
}

function withPreferredResponseLanguage(context, locale) {
  return {
    ...safeObject(context),
    preferredResponseLanguage: locale === "ko" ? "Korean" : "English",
    preferredResponseLanguageCode: locale === "ko" ? "ko" : "en"
  };
}

function formatAiError(error, locale, requestType) {
  if (error?.code === AI_CLIENT_ERROR_CODES.missingApiKey) {
    return t(locale, "missingApiKey");
  }

  if (error?.code === AI_CLIENT_ERROR_CODES.backendOffline) {
    return t(locale, "backendOffline");
  }

  if (error?.code === AI_CLIENT_ERROR_CODES.invalidResponse) {
    return t(locale, "backendInvalid");
  }

  if (error?.code === AI_CLIENT_ERROR_CODES.requestTimedOut) {
    return t(locale, "requestTimedOut");
  }

  if (typeof error?.message === "string" && error.message) {
    return error.message;
  }

  return t(locale, `${requestType}Failed`);
}

function getMessageOrigin(message, sender) {
  const payload = safeObject(message.payload);
  // When the message comes from a tab (content script) trust the real tab URL
  // so a page cannot spoof a different origin. Caller-supplied origin is only
  // used for extension pages (the popup), which have no sender.tab.url.
  const source = sender?.tab?.url || message.origin || payload.origin || "";
  const origin = originFromUrl(source);
  return /^https?:$/i.test(new URL(origin || "http://x").protocol) && origin ? origin : "";
}

function getSenderTabOrigin(sender) {
  const origin = originFromUrl(sender?.tab?.url || "");
  return /^https?:$/i.test(new URL(origin || "http://x").protocol) && origin ? origin : "";
}

function getUiLocale(value) {
  return resolveLocale(value, globalThis.navigator?.language || "");
}

function t(locale, key) {
  return UI_TEXT[locale]?.[key] || UI_TEXT.en[key] || key;
}

function isSupportedPageUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}

function respondWith(promise, sendResponse) {
  promise
    .then((payload) => sendResponse({ ok: true, ...payload }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
