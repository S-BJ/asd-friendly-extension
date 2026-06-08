(() => {
  const MESSAGE_TYPES = {
    ping: "PING",
    getSettings: "GET_SETTINGS",
    getLocalSettings: "GET_LOCAL_SETTINGS",
    getSelectionContext: "GET_SELECTION_CONTEXT",
    getPageContext: "GET_PAGE_CONTEXT",
    getFormContext: "GET_FORM_CONTEXT",
    getCommunityContext: "GET_COMMUNITY_CONTEXT",
    openAssistPanel: "OPEN_ASSIST_PANEL",
    closeAssistPanel: "CLOSE_ASSIST_PANEL",
    showAiResult: "SHOW_AI_RESULT",
    showAiError: "SHOW_AI_ERROR",
    explainSelection: "EXPLAIN_SELECTION",
    explainPage: "EXPLAIN_PAGE",
    explainForm: "EXPLAIN_FORM"
  };

  const PAGE_PROFILES = {
    reader: "reader",
    portal: "portal",
    community: "community",
    form: "form",
    generic: "generic"
  };

  const COMMUNITY_SUBTYPES = {
    none: "none",
    boardList: "board-list",
    feed: "feed",
    thread: "thread",
    commentSection: "comment-section"
  };

  const SENSITIVE_PAGE_KINDS = {
    none: "none",
    login: "login",
    payment: "payment",
    account: "account",
    health: "health",
    legal: "legal",
    identity: "identity",
    upload: "upload"
  };

  const SENSITIVE_PATTERNS = [
    [
      SENSITIVE_PAGE_KINDS.login,
      /\b(login|sign[- ]?in|password|2fa|otp)\b|로그인|비밀번호/i,
      /\b(password|2fa|otp|verification code|security code)\b|비밀번호|인증번호|본인인증|(?=.*로그인)(?=.*아이디)/i
    ],
    [
      SENSITIVE_PAGE_KINDS.payment,
      /\b(payment|checkout|billing|credit ?card|pay ?now)\b|결제|청구/i,
      /\b(card number|credit card|billing address|payment method|pay now|checkout)\b|카드번호|결제하기|결제 수단|청구 주소|주문 결제/i
    ],
    [
      SENSITIVE_PAGE_KINDS.account,
      /\b(account security|security settings|change password|reset password|account[- ]settings|profile[- ]security)\b|계정\s*보안|보안\s*설정|비밀번호\s*(변경|재설정)/i,
      /\b(account security|profile settings|security settings|change password)\b|계정\s*(설정|보안)|프로필\s*(수정|설정)|보안\s*(설정|인증)|비밀번호\s*(변경|재설정)/i
    ],
    [
      SENSITIVE_PAGE_KINDS.health,
      /\b(medical record|health record|patient portal|clinic appointment|doctor appointment|prescription refill|test result)\b|진료\s*(예약|기록)|처방\s*(전|재발급|리필)|검진\s*(결과|예약)|의료\s*기록|환자\s*포털/i,
      /\b(medical record|health record|clinic appointment|doctor appointment|patient portal|prescription refill|test result)\b|진료\s*(예약|기록)|처방\s*(전|재발급|리필)|검진\s*(결과|예약)|의료\s*(기록|상담)|건강\s*(기록|검진\s*결과)/i
    ],
    [
      SENSITIVE_PAGE_KINDS.legal,
      /\b(sign contract|legal document|court filing|attorney[- ]client|accept terms|agree to terms)\b|법률\s*(상담|문서)|계약서|약관\s*(동의|확인)|개인정보\s*(수집|제공|입력|동의)/i,
      /\b(sign contract|legal document|court filing|attorney client|accept terms|agree to terms)\b|법률\s*(상담|문서)|계약서|약관\s*(동의|확인)|개인정보\s*(수집|제공|입력|동의)/i
    ],
    [
      SENSITIVE_PAGE_KINDS.identity,
      /\b(verify identity|identity verification|passport number|driver['’]?s? license number|upload id|id photo|ssn)\b|본인\s*(인증|확인)\s*(하기|진행|입력|수단)|주민등록번호|신분증\s*(업로드|촬영|제출)|여권\s*(번호|업로드|제출)|운전면허\s*(번호|업로드)/i,
      /\b(verify identity|identity verification|enter passport|passport number|driver license number|upload id|id photo|ssn|social security number)\b|주민등록번호|신분증\s*(업로드|촬영|제출)|여권\s*(번호|업로드|제출)|운전면허\s*(번호|업로드)|본인\s*(인증|확인)\s*(하기|진행|입력|수단)|인증번호/i
    ],
    [
      SENSITIVE_PAGE_KINDS.upload,
      /\b(upload|uploads|uploaded|uploading|attach|attachment|choose file|select file|file picker|image-edit|photo upload|upload photo|upload image|profile photo|camera access|use camera|turn on camera|take photo|submit photo|verify photo|passport photo|id photo)\b|업로드|첨부|파일\s*(선택|첨부|업로드)|사진\s*(업로드|첨부|제출|등록|촬영|인증)|이미지\s*(업로드|첨부|제출|등록)|카메라\s*(권한|사용|촬영|켜기)/i,
      /\b(upload|uploads|uploaded|uploading|choose file|select file|file picker|image-edit|photo upload|upload photo|upload image|profile photo|camera access|use camera|turn on camera|take photo|submit photo|verify photo|passport photo|id photo)\b|파일\s*(선택|첨부|업로드)|사진\s*(업로드|첨부|제출|등록|촬영|인증)|이미지\s*(업로드|첨부|제출|등록)|카메라\s*(권한|사용|촬영|켜기)/i
    ]
  ];

  const BODY_TEXT_ONLY_SENSITIVE_KINDS = new Set([]);

  const DEFAULT_SETTINGS = {
    enabled: true,
    uiLanguage: "auto",
    firstRunComplete: false,
    activeComfortPreset: "minimal-safe",
    themePreset: "original",
    textScale: 100,
    lineHeight: 1.7,
    pageDensity: "normal",
    readableFontEnabled: false,
    reduceContrastEnabled: false,
    readerMode: false,
    communityAssistEnabled: false,
    adRemovalEnabled: false,
    reduceMotion: true,
    muteAutoplay: true,
    imageSofteningEnabled: false,
    imageSofteningStrength: "medium",
    readingRuler: false,
    focusSpotlight: false,
    focusSpotlightScope: "paragraph",
    readingProgress: false,
    letterSpacing: 0,
    wordSpacing: 0,
    readingWidth: 0,
    readerChunking: false,
    aiHelperEnabled: false,
    aiGentleSuggestions: true,
    showActiveStateIndicator: true,
    showQuickToggle: false
  };

  const DEFAULT_SITE_OVERRIDE = {
    disabled: false,
    keepOriginalColors: false,
    keepOriginalFonts: false,
    allowAds: false,
    disableContrastReduction: false,
    allowAutoplay: false,
    disableImageSoftening: false,
    disableAiSuggestions: false,
    disableCommunityAssist: false,
    disableReaderMode: false,
    disableFocusSpotlight: false,
    disableReadingProgress: false
  };

  const THEMES = {
    "soft-light": {
      bg: "#faf7f0",
      fg: "#1f2428",
      fgOnDark: "#f3f5f7",
      surface: "#fffdf8",
      accent: "#3f6f8f",
      accentOnDark: "#9fc4df",
      muted: "#59656b",
      border: "rgba(63, 111, 143, 0.24)"
    },
    "soft-dark": {
      bg: "#151a1f",
      fg: "#f1f3f5",
      fgOnDark: "#f1f3f5",
      surface: "#1f262c",
      accent: "#8ab6d6",
      accentOnDark: "#8ab6d6",
      muted: "#b7c3cb",
      border: "rgba(138, 182, 214, 0.28)"
    },
    "neutral-low-contrast": {
      bg: "#efede7",
      fg: "#272b2d",
      fgOnDark: "#f2f1ed",
      surface: "#fbfaf5",
      accent: "#5c7472",
      accentOnDark: "#a3bdbc",
      muted: "#5f6767",
      border: "rgba(92, 116, 114, 0.25)"
    }
  };

  const PANEL_TEXT = {
    en: {
      helper: "AI helper",
      loading: "Working",
      issue: "Issue",
      close: "Close",
      retry: "Try again",
      confidenceNote: "Confidence note",
      selectionTitle: "Selected text help",
      pageTitle: "Page guide",
      formTitle: "Form guide",
      loadingFallback: "Preparing the AI helper.",
      noItems: "Nothing specific was found.",
      bottomLine: "Bottom line",
      keyPoints: "Key points",
      doThisNext: "Do this next",
      watchOut: "Watch out",
      moreDetail: "More detail"
    },
    ko: {
      helper: "AI 도움",
      loading: "처리 중",
      issue: "문제",
      close: "닫기",
      retry: "다시 시도",
      confidenceNote: "확신도 메모",
      selectionTitle: "선택한 텍스트 도움",
      pageTitle: "페이지 가이드",
      formTitle: "폼 가이드",
      loadingFallback: "AI 도움을 준비하고 있어요.",
      noItems: "특별히 찾은 내용이 없어요.",
      bottomLine: "한 줄 결론",
      keyPoints: "핵심 요점",
      doThisNext: "지금 할 일",
      watchOut: "주의 · 헷갈리는 표현",
      moreDetail: "더 보기"
    }
  };

  const ASSIST_UI_STYLES = `
    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
    }

    #overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
      font-family: var(--asd-ui-font, system-ui, sans-serif);
    }

    #panel {
      position: fixed;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: min(420px, calc(100vw - 32px));
      display: grid;
      grid-template-rows: auto 1fr;
      border: 1px solid var(--asd-ui-border, rgba(63, 111, 143, 0.24));
      border-radius: 10px;
      background: var(--asd-ui-surface, #fffdf8);
      color: var(--asd-ui-fg, #1f2428);
      box-shadow: 0 18px 56px rgba(0, 0, 0, 0.18);
      overflow: hidden;
      pointer-events: auto;
    }

    #panel[hidden] {
      display: none;
    }

    .header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 14px 12px;
      border-bottom: 1px solid var(--asd-ui-border, rgba(63, 111, 143, 0.24));
      background: linear-gradient(180deg, var(--asd-ui-surface, #fffdf8), var(--asd-ui-surface-soft, #f8f4ed));
    }

    .heading {
      min-width: 0;
      display: grid;
      gap: 5px;
    }

    .badge {
      width: fit-content;
      max-width: 100%;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--asd-ui-accent-soft, rgba(63, 111, 143, 0.12));
      color: var(--asd-ui-accent, #3f6f8f);
      font-size: 11px;
      line-height: 1.3;
      font-weight: 700;
    }

    .title {
      margin: 0;
      font-size: 16px;
      line-height: 1.35;
      color: inherit;
    }

    .close {
      flex: 0 0 auto;
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid var(--asd-ui-border, rgba(63, 111, 143, 0.24));
      border-radius: 7px;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .body {
      min-height: 0;
      overflow: auto;
      display: grid;
      gap: 12px;
      padding: 14px;
    }

    .message {
      display: grid;
      gap: 6px;
      padding: 14px;
      border: 1px solid var(--asd-ui-border, rgba(63, 111, 143, 0.24));
      border-radius: 10px;
      background: var(--asd-ui-card, rgba(255, 255, 255, 0.82));
      line-height: 1.6;
    }

    /* Only the card and the message are boxes. Text, labels, and list items
       inside stay plain — no box-in-box — so the panel reads calm. */
    .card {
      display: grid;
      gap: 10px;
      padding: 16px;
      border: 1px solid var(--asd-ui-border, rgba(63, 111, 143, 0.24));
      border-radius: 12px;
      background: var(--asd-ui-card, rgba(255, 255, 255, 0.9));
    }

    .card p {
      margin: 0;
      line-height: 1.6;
      color: var(--asd-ui-fg, #1f2428);
    }

    .card .lead {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.5;
    }

    .card .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--asd-ui-muted, #59656b);
    }

    .card ul {
      margin: 0;
      padding-left: 20px;
      display: grid;
      gap: 8px;
    }

    .card li {
      line-height: 1.6;
      color: var(--asd-ui-fg, #1f2428);
    }

    .card.action {
      background: var(--asd-ui-accent-soft, rgba(63, 111, 143, 0.12));
      border-color: var(--asd-ui-accent, #3f6f8f);
    }

    .card.action .label { color: var(--asd-ui-accent, #3f6f8f); }
    .card.action p { font-weight: 600; }

    .card.caution {
      border-style: dashed;
    }

    .confidence {
      margin: 0 2px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--asd-ui-muted, #59656b);
    }

    details.more-detail > summary {
      list-style: none;
      cursor: pointer;
      padding: 6px 2px;
      font-size: 12px;
      font-weight: 700;
      color: var(--asd-ui-accent, #3f6f8f);
    }

    details.more-detail > summary::-webkit-details-marker {
      display: none;
    }

    details.more-detail > ul {
      margin: 6px 0 0;
      padding-left: 20px;
      display: grid;
      gap: 8px;
      line-height: 1.6;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .dots {
      display: inline-flex;
      gap: 4px;
      flex: 0 0 auto;
    }

    .dots > i {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--asd-ui-accent, #3f6f8f);
      opacity: 0.35;
      animation: asd-dot 1s infinite ease-in-out;
    }

    .dots > i:nth-child(2) { animation-delay: 0.15s; }
    .dots > i:nth-child(3) { animation-delay: 0.3s; }

    @keyframes asd-dot {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-3px); }
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .retry {
      min-height: 36px;
      padding: 0 16px;
      border: 1px solid var(--asd-ui-accent, #3f6f8f);
      border-radius: 7px;
      background: var(--asd-ui-accent, #3f6f8f);
      color: #ffffff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .retry[disabled] {
      opacity: 0.5;
      cursor: default;
    }

    @media (prefers-reduced-motion: reduce) {
      .dots > i { animation: none; opacity: 0.5; }
    }

    @media (max-width: 720px) {
      #panel {
        top: auto;
        right: 0;
        bottom: 0;
        left: 0;
        width: auto;
        max-height: min(74vh, 680px);
        border-radius: 12px 12px 0 0;
      }
    }
  `;

  const root = document.documentElement;
  const IS_TOP_FRAME = (() => {
    try {
      return window.top === window.self;
    } catch {
      return false;
    }
  })();
  const ASSIST_UI_HOST_ID = "asd-foundation-ai-host";
  const IMAGE_SOFTENING_UNLOCK_BUTTON_CLASS = "asd-foundation-image-unblur";
  const CONTRAST_FIX_ATTR = "data-asd-contrast-fix";
  const BACKGROUND_IMAGE_SOFTEN_ATTR = "data-asd-background-image-softened";
  const IMAGE_SOFTENING_REVEAL_ATTR = "data-asd-image-softening-revealed";
  const GIF_FROZEN_ATTR = "data-asd-gif-frozen";
  let syncSettings = { ...DEFAULT_SETTINGS };
  let siteOverrides = {};
  let activeOrigin = "";
  let currentProfile = PAGE_PROFILES.generic;
  let currentCommunitySubtype = COMMUNITY_SUBTYPES.none;
  let currentReaderTarget = null;
  let currentSensitivePageKind = SENSITIVE_PAGE_KINDS.none;
  let indicator = null;
  let ruler = null;
  let rulerEnabled = false;
  let adObserver = null;
  let backgroundImageObserver = null;
  let adRemovalEnabled = false;
  let backgroundImageSofteningEnabled = false;
  let imageSofteningRevealEnabled = false;
  let imageSofteningRevealRafPending = false;
  let imageSofteningRevealPointerX = Number.NaN;
  let imageSofteningRevealPointerY = Number.NaN;
  let imageSofteningUnlockButton = null;
  let imageSofteningUnlockTarget = null;
  let imageSofteningHoveredElement = null;
  let imageSofteningUnlockedElements = new Set();
  const imageSofteningOriginalFilters = new WeakMap();
  let collapsedAdIdCounter = 0;
  let contrastObserver = null;
  let contrastFixTimer = null;
  let contrastFixPending = false;
  let adScanTimer = null;
  let adScanPending = false;
  let backgroundImageScanTimer = null;
  let backgroundImageScanPending = false;
  let gifObserver = null;
  let gifFreezingEnabled = false;
  let gifScanTimer = null;
  let gifScanPending = false;
  let rulerRafPending = false;
  let rulerPointerY = 0;
  let spotlightEl = null;
  let spotlightEnabled = false;
  let spotlightScope = "paragraph";
  let spotlightX = 0;
  let spotlightY = 0;
  let spotlightRafPending = false;
  let progressEl = null;
  let progressEnabled = false;
  let progressTotalWords = 0;
  let progressWordsStale = true;
  let progressRafPending = false;
  let quickToggleEl = null;
  let lastReadyState = "";
  let assistUi = null;
  let assistState = { payload: null };
  let themeBridgeState = null;
  let extensionContextAvailable = true;
  let previouslyFocusedElement = null;

  const AD_CANDIDATE_SELECTOR = [
    "ins.adsbygoogle",
    "[data-ad]",
    "[data-ad-client]",
    "[data-ad-slot]",
    "[data-ad-format]",
    "[data-ad-unit]",
    "[data-ad-manager]",
    "[data-google-query-id]",
    "[aria-label*=\"advertisement\" i]",
    "[aria-label*=\"sponsored\" i]",
    "iframe[src*=\"doubleclick.net\"]",
    "iframe[src*=\"googlesyndication.com\"]",
    "iframe[src*=\"googleadservices.com\"]",
    "iframe[src*=\"adnxs.com\"]",
    "iframe[src*=\"taboola.com\"]",
    "iframe[src*=\"outbrain.com\"]",
    "ins.kakao_ad_area",
    ".kakao_ad_area",
    ".view_ad_wrap",
    ".power_link",
    ".rightbanner1",
    ".rightbanner2",
    ".ad_bottom_list",
    ".con_banner.writing_banbox",
    "[id^=\"kakao_ad_\"]",
    "div[id^=\"div-gpt-ad\"]",
    "div[id*=\"ad-slot\" i]",
    "div[class*=\"ad-slot\" i]",
    "div[id*=\"ad_banner\" i]",
    "div[class*=\"ad_banner\" i]",
    "div[id*=\"google_ads\"]",
    "div[id*=\"ad-container\" i]",
    "div[class*=\"ad-container\" i]",
    "div[id*=\"advert\" i]",
    "div[class*=\"advert\" i]",
    "div[class*=\"sponsored\" i]",
    "[data-testid*=\"sponsored\" i]",
    "[data-testid*=\"promoted\" i]"
  ].join(",");
  const AD_MARKER_PATTERN =
    /(^|[\s_-])(ad|ads|advert|advertisement|sponsor|sponsored|promoted|adslot|adunit|adbanner|adcontainer|adsbygoogle|dfp|gpt-ad|google_ads|kakao[_-]?ad[_-]?area|power[_-]?link|view[_-]?ad|ad[_-]?bottom)([\s_-]|$)|(^|[\s_-])rightbanner\d*($|[\s_-])|광고|파워링크/i;
  const BACKGROUND_IMAGE_CANDIDATE_SELECTOR = [
    "[role='img']",
    "[style*='background' i]",
    "[class*='image' i]",
    "[class*='img' i]",
    "[class*='photo' i]",
    "[class*='thumb' i]",
    "[class*='thumbnail' i]",
    "[class*='poster' i]",
    "[class*='media' i]",
    "[class*='avatar' i]",
    "[class*='hero' i]",
    "[class*='banner' i]",
    "[id*='image' i]",
    "[id*='photo' i]",
    "[id*='thumb' i]",
    "[id*='poster' i]",
    "[id*='media' i]",
    "[id*='hero' i]",
    "[id*='banner' i]"
  ].join(",");
  const SOFTENED_MEDIA_SELECTOR = [
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

  void initialize().catch(handleExtensionContextInvalidation);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!extensionContextAvailable) return false;
    if (!message?.type) return false;

    try {
      switch (message.type) {
        case MESSAGE_TYPES.ping:
          sendResponse({ ok: true });
          return true;

        case MESSAGE_TYPES.getSelectionContext:
          sendResponse(getSelectionContext());
          return true;

        case MESSAGE_TYPES.getPageContext:
          sendResponse(getPageContext());
          return true;

        case MESSAGE_TYPES.getFormContext:
          sendResponse(getFormContext());
          return true;

        case MESSAGE_TYPES.getCommunityContext:
          sendResponse(getPageContext());
          return true;

        case MESSAGE_TYPES.openAssistPanel:
          renderAssistPanel(message.payload || { state: "loading" });
          sendResponse({ ok: true });
          return true;

        case MESSAGE_TYPES.showAiResult:
          renderAssistPanel({ ...(message.payload || {}), state: "result" });
          sendResponse({ ok: true });
          return true;

        case MESSAGE_TYPES.showAiError:
          renderAssistPanel({ ...(message.payload || {}), state: "error" });
          sendResponse({ ok: true });
          return true;

        case MESSAGE_TYPES.closeAssistPanel:
          hideAssistPanel();
          sendResponse({ ok: true });
          return true;

        default:
          return false;
      }
    } catch (error) {
      if (isExtensionContextInvalidationError(error)) {
        handleExtensionContextInvalidation();
        sendResponse({ ok: false });
        return true;
      }

      throw error;
    }
  });

  async function initialize() {
    if (!isExtensionContextAvailable()) {
      handleExtensionContextInvalidation();
      return;
    }

    const [settingsResponse, localResponse] = await Promise.all([
      sendRuntimeMessage({ type: MESSAGE_TYPES.getSettings }),
      sendRuntimeMessage({ type: MESSAGE_TYPES.getLocalSettings })
    ]);

    if (!extensionContextAvailable) return;

    syncSettings = normalizeSettings(settingsResponse?.settings);
    siteOverrides = normalizeSiteOverrides(localResponse?.settings?.siteOverrides);
    activeOrigin = normalizeOrigin(localResponse?.activeOrigin) || normalizeOrigin(globalThis.location?.origin);
    refreshPageClassification();
    apply();

    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (!extensionContextAvailable) return;

        if (areaName === "sync") {
          for (const [key, change] of Object.entries(changes)) {
            syncSettings[key] = change.newValue;
          }
          syncSettings = normalizeSettings(syncSettings);
          apply();
        }

        if (areaName === "local" && changes.siteOverrides) {
          siteOverrides = normalizeSiteOverrides(changes.siteOverrides.newValue);
          apply();
        }
      });
    } catch {
      handleExtensionContextInvalidation();
      return;
    }

    document.addEventListener("readystatechange", () => {
      if (document.readyState === lastReadyState) return;
      lastReadyState = document.readyState;
      if (document.readyState !== "interactive" && document.readyState !== "complete") return;
      refreshPageClassification();
      apply();
    });
  }

  function apply() {
    const override = getCurrentSiteOverride();
    const effective = getEffectiveSettings(syncSettings, override);
    const enabled = Boolean(effective.enabled && !override.disabled);
    const sensitiveMode = currentSensitivePageKind !== SENSITIVE_PAGE_KINDS.none;
    const themeActive = Boolean(
      enabled &&
        !override.keepOriginalColors &&
        !sensitiveMode &&
        effective.themePreset !== "original"
    );
    const forceLight = Boolean(themeActive && effective.themePreset !== "soft-dark");

    root.dataset.asdProfile = currentProfile;
    root.dataset.asdCommunitySubtype = currentCommunitySubtype;
    if (sensitiveMode) {
      root.dataset.asdSensitiveKind = currentSensitivePageKind;
    } else {
      delete root.dataset.asdSensitiveKind;
    }
    root.toggleAttribute("data-asd-foundation", enabled);
    root.toggleAttribute("data-asd-force-light", forceLight);
    root.toggleAttribute("data-asd-motion-off", enabled && effective.reduceMotion);
    root.toggleAttribute("data-asd-font", enabled && effective.readableFontEnabled);
    root.toggleAttribute("data-asd-ad-removal", enabled && effective.adRemovalEnabled);
    root.toggleAttribute("data-asd-reduce-contrast", enabled && effective.reduceContrastEnabled);
    root.toggleAttribute("data-asd-reader", enabled && effective.readerMode && currentProfile === PAGE_PROFILES.reader);
    root.toggleAttribute(
      "data-asd-community-assist",
      enabled && effective.communityAssistEnabled && currentProfile === PAGE_PROFILES.community
    );
    root.toggleAttribute("data-asd-ai-gentle", enabled && effective.aiHelperEnabled && effective.aiGentleSuggestions);
    root.toggleAttribute("data-asd-image-softening", enabled && effective.imageSofteningEnabled);
    root.setAttribute("data-asd-theme", themeActive ? effective.themePreset : "original");
    root.setAttribute("data-asd-density", effective.pageDensity);
    root.style.setProperty("--asd-text-scale", `${clampInteger(effective.textScale, 80, 140, 100)}%`);
    root.style.setProperty("--asd-line-height", String(clampNumber(effective.lineHeight, 1.4, 2.1, 1.7)));
    root.style.setProperty("--asd-image-softening-blur", resolveImageSofteningBlur(effective.imageSofteningStrength));

    const letterSpacing = clampNumber(effective.letterSpacing, 0, 0.12, 0);
    const wordSpacing = clampNumber(effective.wordSpacing, 0, 0.5, 0);
    const readingWidth = clampInteger(effective.readingWidth, 0, 100, 0);
    root.style.setProperty("--asd-letter-spacing", `${letterSpacing}em`);
    root.style.setProperty("--asd-word-spacing", `${wordSpacing}em`);
    root.style.setProperty("--asd-reading-width", readingWidth > 0 ? `${readingWidth}ch` : "70ch");
    root.toggleAttribute("data-asd-letter-spacing", enabled && letterSpacing > 0);
    root.toggleAttribute("data-asd-word-spacing", enabled && wordSpacing > 0);
    root.toggleAttribute("data-asd-reading-width", enabled && readingWidth > 0);
    root.toggleAttribute("data-asd-chunking", enabled && effective.readerChunking);

    const theme = THEMES[effective.themePreset] || THEMES["soft-light"];
    root.style.setProperty("--asd-base-bg", theme.bg);
    root.style.setProperty("--asd-base-fg", theme.fg);
    root.style.setProperty("--asd-base-surface", theme.surface);
    root.style.setProperty("--asd-base-accent", theme.accent);
    root.style.setProperty("--asd-bg", theme.bg);
    root.style.setProperty("--asd-fg", theme.fg);
    root.style.setProperty("--asd-fg-on-dark", theme.fgOnDark || "#f3f5f7");
    root.style.setProperty("--asd-surface", theme.surface);
    root.style.setProperty("--asd-accent", theme.accent);
    root.style.setProperty("--asd-accent-on-dark", theme.accentOnDark || theme.accent);
    root.style.setProperty("--asd-muted", theme.muted || "#5f686f");
    root.style.setProperty("--asd-border", theme.border || "rgba(63, 111, 143, 0.24)");

    if (enabled && effective.muteAutoplay) pauseAutoplayMedia();
    syncReaderTarget(enabled && effective.readerMode && currentProfile === PAGE_PROFILES.reader);
    syncReadShape(enabled && !sensitiveMode && (effective.readerChunking || readingWidth > 0));
    syncAdRemoval(enabled && effective.adRemovalEnabled);
    syncImageSofteningReveal(enabled && effective.imageSofteningEnabled);
    syncBackgroundImageSoftening(enabled && effective.imageSofteningEnabled);
    syncGifFreezing(enabled && effective.reduceMotion && !sensitiveMode);
    if (IS_TOP_FRAME) {
      syncReadingRuler(enabled && effective.readingRuler);
      syncFocusSpotlight(enabled && effective.focusSpotlight, effective.focusSpotlightScope);
      syncReadingProgress(enabled && effective.readingProgress && currentProfile === PAGE_PROFILES.reader);
      syncActiveIndicator(enabled && effective.showActiveStateIndicator, currentProfile);
      syncQuickToggle(effective.showQuickToggle);
    }
    syncKnownSiteThemeBridge(themeActive, effective.themePreset);
    syncContrastFix(themeActive);
    if (IS_TOP_FRAME) syncAssistUiAppearance();
  }

  function refreshPageClassification() {
    currentReaderTarget = null;
    progressWordsStale = true;
    const hasSensitiveControl = hasInteractiveSensitiveControl();
    // TODO: Re-run this classification from a lightweight MutationObserver if SPA-only
    // sensitive controls render after readyState stops changing.
    currentSensitivePageKind = detectSensitivePageKind({
      url: location.href,
      title: document.title || "",
      visibleText: document.body?.innerText || "",
      hasInteractiveSensitiveControl: hasSensitiveControl
    });

    const communityProfile = detectCommunityProfile();
    const formProfile = detectFormProfile({ communityMatched: communityProfile.matched });
    if (formProfile.matched) {
      currentProfile = PAGE_PROFILES.form;
      currentCommunitySubtype = COMMUNITY_SUBTYPES.none;
      return;
    }

    if (communityProfile.matched) {
      currentProfile = PAGE_PROFILES.community;
      currentCommunitySubtype = communityProfile.subtype;
      return;
    }

    currentReaderTarget = findReaderTarget();
    if (currentReaderTarget && !isLandingPath(location.pathname)) {
      currentProfile = PAGE_PROFILES.reader;
      currentCommunitySubtype = COMMUNITY_SUBTYPES.none;
      return;
    }
    // A site's root/landing path is a homepage, not an article, even when it is
    // text-heavy enough to score as a reading container — do not reshape it.
    currentReaderTarget = null;

    if (detectPortalProfile()) {
      currentProfile = PAGE_PROFILES.portal;
      currentCommunitySubtype = COMMUNITY_SUBTYPES.none;
      return;
    }

    currentProfile = PAGE_PROFILES.generic;
    currentCommunitySubtype = COMMUNITY_SUBTYPES.none;
  }

  function getEffectiveSettings(settings, override) {
    const normalized = normalizeSettings({
      ...settings,
      readableFontEnabled: override.keepOriginalFonts ? false : settings.readableFontEnabled,
      reduceContrastEnabled: override.disableContrastReduction ? false : settings.reduceContrastEnabled,
      adRemovalEnabled: override.allowAds ? false : settings.adRemovalEnabled,
      muteAutoplay: override.allowAutoplay ? false : settings.muteAutoplay,
      readerMode: override.disableReaderMode ? false : settings.readerMode,
      communityAssistEnabled: override.disableCommunityAssist ? false : settings.communityAssistEnabled,
      aiGentleSuggestions: override.disableAiSuggestions ? false : settings.aiGentleSuggestions,
      imageSofteningEnabled: override.disableImageSoftening ? false : settings.imageSofteningEnabled,
      focusSpotlight: override.disableFocusSpotlight ? false : settings.focusSpotlight,
      readingProgress: override.disableReadingProgress ? false : settings.readingProgress
    });

    if (currentSensitivePageKind === SENSITIVE_PAGE_KINDS.none) {
      return normalized;
    }

    return normalizeSettings({
      ...normalized,
      themePreset: DEFAULT_SETTINGS.themePreset,
      textScale: DEFAULT_SETTINGS.textScale,
      lineHeight: DEFAULT_SETTINGS.lineHeight,
      pageDensity: DEFAULT_SETTINGS.pageDensity,
      readableFontEnabled: false,
      reduceContrastEnabled: false,
      readerMode: false,
      communityAssistEnabled: false,
      adRemovalEnabled: false,
      imageSofteningEnabled: false,
      letterSpacing: DEFAULT_SETTINGS.letterSpacing,
      wordSpacing: DEFAULT_SETTINGS.wordSpacing,
      readingWidth: DEFAULT_SETTINGS.readingWidth,
      readerChunking: false,
      focusSpotlight: false,
      readingProgress: false
    });
  }

  function isLandingPath(pathname) {
    const path = String(pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/") return true;
    if (/^\/[a-z]{2}(-[a-z]{2})?$/i.test(path)) return true; // bare locale root, e.g. /en, /ko, /en-US
    if (/^\/(index|main|home|default)(\.\w+)?$/i.test(path)) return true;
    return false;
  }

  function findReaderTarget() {
    const candidates = [...document.querySelectorAll([
      "article",
      "main",
      "[role='main']",
      "[role='article']",
      "[class*='article' i]",
      "[class*='entry-content' i]",
      "[class*='post-content' i]",
      "[class*='content-body' i]",
      "[id*='content' i]"
    ].join(","))].filter(isVisibleElement);

    let best = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = scoreReaderCandidate(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    return bestScore >= 1 ? best : null;
  }

  function scoreReaderCandidate(element) {
    const paras = element.querySelectorAll("p");
    const paragraphs = paras.length;
    const longParaLengths = [...paras].map((p) => (p.textContent || "").trim().length).filter((len) => len >= 120);
    const longParagraphs = longParaLengths.length;
    const longParaChars = longParaLengths.reduce((sum, len) => sum + len, 0);
    const headings = element.querySelectorAll("h1, h2, h3").length;
    const links = element.querySelectorAll("a[href]").length;
    const textLength = normalizeText(element.innerText || "", 8000).length;
    const linkHeavy = links > Math.max(10, paragraphs * 8) && textLength < 2200;
    const proseRatio = textLength > 0 ? longParaChars / textLength : 0;

    // Require enough genuine long-form paragraphs, at least as many long
    // paragraphs as headings, and long-form prose making up a real share of the
    // container's text, so homepages/feeds/index grids (dominated by short card
    // titles and links, with only a few real paragraphs) are not misread as
    // articles.
    if (longParagraphs < 3 || longParagraphs < headings || proseRatio < 0.4) return 0;
    if (linkHeavy || paragraphs < 2 || textLength < 800) return 0;
    let score = 0;
    if (paragraphs >= 4 && textLength >= 1200) score = textLength + paragraphs * 180 + headings * 90 - links * 25;
    else if (paragraphs >= 3 && textLength >= 950 && headings >= 1) score = textLength + paragraphs * 150 + headings * 90 - links * 25;
    else if (paragraphs >= 2 && textLength >= 1500 && headings >= 1) score = textLength + paragraphs * 120 + headings * 90 - links * 25;
    else return 0;
    // A candidate that cleared every gate above is article-like; keep its score
    // positive even when the link penalty would drive it negative (large,
    // link-rich articles such as long Wikipedia pages) so findReaderTarget,
    // which requires score >= 1, still selects it. The penalty keeps shaping the
    // ranking among competing positive candidates.
    return Math.max(1, score);
  }

  function detectPortalProfile() {
    const bodyText = normalizeText(document.body?.innerText || "", 6000);
    const links = document.querySelectorAll("a[href]").length;
    const lists = document.querySelectorAll("ul, ol, nav, section").length;
    const linkDensity = links / Math.max(bodyText.length / 180, 1);
    return links >= 60 && lists >= 8 && linkDensity >= 1.2;
  }

  function detectCommunityProfile() {
    const host = location.hostname.toLowerCase();
    const path = `${location.pathname} ${location.search}`.toLowerCase();
    const bodyText = normalizeText(document.body?.innerText || "", 4000);
    const commentLikeCount = document.querySelectorAll(
      '[class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i], shreddit-comment'
    ).length;
    const listLikeCount = document.querySelectorAll("li, tr, article").length;
    const hasKnownHost =
      host.includes("reddit.com") ||
      host.includes("dcinside.com") ||
      host.includes("ruliweb.com") ||
      host.includes("clien.net") ||
      host.includes("fmkorea.com");
    const hasCommunityHints = /\b(board|forum|gallery|subreddit|thread|comment|reply|vote|post)\b/i.test(bodyText);
    // A board-index page (thread list) often has no inline comment widgets, so also
    // accept a community URL token + a long list + a discussion hint. News/portal
    // fronts lack the path token, so this stays off them.
    const hasBoardPathToken = /\b(board|forum|gallery|bbs|community|gall|cafe)\b/.test(path);
    const looksLikeBoardIndex = hasBoardPathToken && listLikeCount >= 20 && hasCommunityHints;

    // For hosts outside the known-community allowlist, require real comment/reply
    // widgets (or the board-index signal above). A high link count alone matches
    // news/portal fronts (e.g. BBC) whose body text incidentally says "post".
    if (!hasKnownHost && !(commentLikeCount >= 5 && hasCommunityHints) && !looksLikeBoardIndex) {
      return { matched: false, subtype: COMMUNITY_SUBTYPES.none };
    }

    return {
      matched: true,
      subtype: detectCommunitySubtype()
    };
  }

  function detectCommunitySubtype() {
    const commentCount = document.querySelectorAll(
      'shreddit-comment, [class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i]'
    ).length;
    const articleCount = document.querySelectorAll("article, [role='article'], [data-testid='post-container']").length;
    const listLikeCount = document.querySelectorAll("li, tr, article").length;

    if (commentCount >= 6 && articleCount >= 1) return COMMUNITY_SUBTYPES.thread;
    if (commentCount >= 6) return COMMUNITY_SUBTYPES.commentSection;
    if (articleCount >= 8) return COMMUNITY_SUBTYPES.feed;
    if (listLikeCount >= 20) return COMMUNITY_SUBTYPES.boardList;
    return COMMUNITY_SUBTYPES.feed;
  }

  function detectFormProfile({ communityMatched = false } = {}) {
    const href = `${location.href} ${document.title}`.toLowerCase();
    const forms = [...document.querySelectorAll("form")];
    const visibleForms = forms.filter((form) => countExplainableFields(form) >= 2);
    const sensitiveFields = [...document.querySelectorAll(
      [
        'input[type="password"]',
        'input[autocomplete*="password" i]',
        'input[autocomplete*="cc-" i]',
        'input[name*="password" i]',
        'input[name*="card" i]',
        'input[name*="birth" i]',
        'input[name*="passport" i]',
        'input[name*="license" i]',
        'input[name*="주민" i]'
      ].join(",")
    )].filter((field) => isVisibleElement(field) && !(communityMatched && isCommunityRoutineField(field)));
    const candidateForms = communityMatched ? visibleForms.filter((form) => !isCommunityRoutineForm(form)) : visibleForms;
    const taskHints = /\b(login|signin|sign-in|signup|register|checkout|payment|billing|apply|password|account|security|verify)\b|로그인|가입|결제|신청|비밀번호|본인\s*(인증|확인)/i;
    const uploadTaskHints =
      /\b(upload|attach|attachment|choose file|select file|file picker|apply|verify|submit document|id photo|passport photo)\b|\uC5C5\uB85C\uB4DC|\uCCA8\uBD80|\uD30C\uC77C\s*(\uC120\uD0DD|\uC81C\uCD9C)|\uC2E0\uCCAD|\uBCF8\uC778\s*(\uC778\uC99D|\uD655\uC778)|\uC2E0\uBD84\uC99D|\uC5EC\uAD8C/i;
    const taskForm = candidateForms.find((form) => {
      const formText = normalizeText(
        [
          form.innerText,
          [...form.querySelectorAll("input, textarea, select")]
            .map((control) =>
              [
                control.getAttribute("aria-label") || "",
                control.getAttribute("placeholder") || "",
                control.getAttribute("name") || ""
              ].join(" ")
            )
            .join(" "),
          [...form.querySelectorAll("button, input[type='submit'], input[type='button']")]
            .map((control) => control.innerText || control.value || control.getAttribute("aria-label") || "")
            .join(" ")
        ].join(" "),
        1000
      );
      const hasPasswordField = Boolean(form.querySelector('input[type="password"], input[autocomplete*="password" i]'));
      const hasFileUploadTask = Boolean(form.querySelector('input[type="file"]')) && uploadTaskHints.test(`${href} ${formText}`);
      return taskHints.test(formText) || hasPasswordField || hasFileUploadTask;
    });

    return {
      matched: Boolean(sensitiveFields.length > 0 || taskForm || (candidateForms.length > 0 && taskHints.test(href)))
    };
  }

  function isCommunityRoutineForm(form) {
    if (!(form instanceof Element)) return false;

    const marker = normalizeText(
      [
        form.id || "",
        form.className || "",
        form.getAttribute("role") || "",
        form.getAttribute("aria-label") || "",
        form.getAttribute("action") || ""
      ].join(" "),
      1000
    );
    const controlText = normalizeText(
      [
        form.innerText || "",
        [...form.querySelectorAll("input, textarea, select")]
          .map((control) =>
            [
              control.getAttribute("aria-label") || "",
              control.getAttribute("placeholder") || "",
              control.getAttribute("name") || "",
              control.getAttribute("id") || ""
            ].join(" ")
          )
          .join(" "),
        [...form.querySelectorAll("button, input[type='submit'], input[type='button']")]
          .map((control) => control.innerText || control.value || control.getAttribute("aria-label") || "")
          .join(" ")
      ].join(" "),
      1600
    );
    const haystack = `${marker} ${controlText}`;
    return hasCommunityRoutineHints(haystack) && !hasHighRiskFormHints(haystack);
  }

  function isCommunityRoutineField(field) {
    if (!(field instanceof Element)) return false;
    if (isCommunityRoutineForm(field.closest("form"))) return true;

    const container = field.closest(
      '[class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i], [class*="cmt" i], [id*="cmt" i], .view_comment, .cmt_write_box'
    );
    if (!(container instanceof Element)) return false;

    const haystack = normalizeText(
      [
        field.id || "",
        field.className || "",
        field.getAttribute("name") || "",
        field.getAttribute("placeholder") || "",
        field.getAttribute("aria-label") || "",
        container.id || "",
        container.className || "",
        container.innerText || container.textContent || ""
      ].join(" "),
      1600
    );
    return hasCommunityRoutineHints(haystack) && !hasHighRiskFormHints(haystack);
  }

  function hasCommunityRoutineHints(value) {
    return /(^|[\s_-])(comment|reply|search|keyword|filter|sort|login|signin|sign-in|nickname|memo|captcha|write|post|sch|q|search_type|search_keyword|s_keyword|cmt)([\s_-]|$)|\uB313\uAE00|\uB2F5\uAE00|\uAC80\uC0C9|\uB85C\uADF8\uC778|\uB2C9\uB124\uC784|\uBE44\uBC00\uBC88\uD638|\uCCA8\uBD80|\uD30C\uC77C|\uC791\uC131|\uB4F1\uB85D|\uAE00\uC4F0\uAE30/i.test(
      value
    );
  }

  function hasHighRiskFormHints(value) {
    return /\b(checkout|payment|billing|credit card|card number|apply|verify identity|passport|driver license|ssn|security settings|change password)\b|\uACB0\uC81C|\uCE74\uB4DC|\uACC4\uC88C|\uC2E0\uCCAD|\uBCF8\uC778\s*(\uC778\uC99D|\uD655\uC778)|\uC2E0\uBD84\uC99D|\uC5EC\uAD8C|\uC8FC\uBBFC\uB4F1\uB85D|\uBCF4\uC548|\uBE44\uBC00\uBC88\uD638\s*\uBCC0\uACBD/i.test(
      value
    );
  }

  function hasInteractiveSensitiveControl() {
    const directControlSelector = [
      'input[type="password"]',
      'input[type="file"]',
      'input[autocomplete*="password" i]',
      'input[autocomplete*="cc-" i]',
      'input[autocomplete*="one-time-code" i]',
      'input[name*="password" i]',
      'input[id*="password" i]',
      'input[name*="card" i]',
      'input[id*="card" i]',
      'input[name*="passport" i]',
      'input[id*="passport" i]',
      'input[name*="license" i]',
      'input[id*="license" i]',
      'input[name*="ssn" i]',
      'input[id*="ssn" i]',
      'input[name*="주민" i]',
      'input[id*="주민" i]'
    ].join(",");
    const directControls = [...document.querySelectorAll(directControlSelector)];
    if (directControls.some(isVisibleElement)) return true;

    const sensitiveFormPattern =
      /\b(login|sign[- ]?in|password|2fa|otp|verification code|security code|checkout|payment|billing|credit card|card number|account security|security settings|change password|reset password|verify identity|identity verification|passport|driver license|ssn|medical record|health record|patient portal|clinic appointment|doctor appointment|prescription refill|test result|sign contract|legal document|court filing|accept terms|agree to terms|upload id|id photo|choose file|select file)\b|로그인|비밀번호|인증번호|본인\s*(인증|확인)|결제|카드번호|계정\s*보안|보안\s*설정|주민등록번호|신분증\s*(업로드|촬영|제출)|여권\s*(번호|업로드|제출)|운전면허\s*(번호|업로드)|진료\s*(예약|기록)|처방\s*(전|재발급|리필)|검진\s*(결과|예약)|의료\s*기록|환자\s*포털|계약서|약관\s*(동의|확인)|개인정보\s*(수집|제공|입력|동의)|파일\s*(선택|첨부|업로드)|사진\s*(업로드|첨부|제출|등록|촬영|인증)/i;
    const forms = [...document.querySelectorAll("form")];
    if (
      forms.some((form) => {
        const controls = [...form.querySelectorAll("input, textarea, select, button")];
        if (!controls.some(isVisibleElement)) return false;
        const formText = normalizeText(
          [
            form.innerText || "",
            controls
              .map((control) =>
                [
                  control.getAttribute("aria-label") || "",
                  control.getAttribute("placeholder") || "",
                  control.getAttribute("autocomplete") || "",
                  control.getAttribute("name") || "",
                  control.getAttribute("id") || "",
                  control.getAttribute("type") || "",
                  control.value || ""
                ].join(" ")
              )
              .join(" ")
          ].join(" "),
          1600
        );
        return sensitiveFormPattern.test(formText);
      })
    ) {
      return true;
    }

    const sensitiveActionPattern =
      /\b(accept terms|agree to terms|sign contract)\b|약관\s*동의|개인정보\s*(수집|제공|입력)\s*동의/i;
    return [...document.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button']")].some(
      (control) =>
        isVisibleElement(control) &&
        sensitiveActionPattern.test(
          normalizeText(
            [
              control.innerText || "",
              control.value || "",
              control.getAttribute("aria-label") || "",
              control.getAttribute("title") || ""
            ].join(" "),
            800
          )
        )
    );
  }

  function detectSensitivePageKind({
    url = "",
    title = "",
    visibleText = "",
    hasInteractiveSensitiveControl = false
  } = {}) {
    const pageHaystack = `${url} ${title}`.slice(0, 1000);
    const visibleHaystack = String(visibleText || "").slice(0, 4000);
    const canUseVisibleText = Boolean(hasInteractiveSensitiveControl);
    for (const [kind, pagePattern, visiblePattern] of SENSITIVE_PATTERNS) {
      if (pagePattern.test(pageHaystack)) return kind;
      if ((canUseVisibleText || BODY_TEXT_ONLY_SENSITIVE_KINDS.has(kind)) && visiblePattern.test(visibleHaystack)) {
        return kind;
      }
    }
    return SENSITIVE_PAGE_KINDS.none;
  }

  function syncContrastFix(shouldEnable) {
    if (!shouldEnable) {
      stopContrastObserver();
      clearContrastFixes();
      return;
    }

    scheduleContrastFix();
    startContrastObserver();
  }

  function syncKnownSiteThemeBridge(themeActive, themePreset) {
    onBodyReady(() => {
      const body = document.body;
      if (!(body instanceof HTMLBodyElement)) return;
      if (!supportsTheSeedThemeBridge(body)) return;

      themeBridgeState = themeBridgeState || {
        hadDarkMode: body.classList.contains("theseed-dark-mode"),
        hadLightMode: body.classList.contains("theseed-light-mode")
      };

      if (!themeActive) {
        restoreKnownSiteThemeBridge(body);
        return;
      }

      if (themePreset === "soft-dark") {
        body.classList.remove("theseed-light-mode");
        body.classList.add("theseed-dark-mode");
        return;
      }

      body.classList.remove("theseed-dark-mode");
      body.classList.add("theseed-light-mode");
    });
  }

  function restoreKnownSiteThemeBridge(body) {
    if (!themeBridgeState) return;

    body.classList.toggle("theseed-dark-mode", Boolean(themeBridgeState.hadDarkMode));
    body.classList.toggle("theseed-light-mode", Boolean(themeBridgeState.hadLightMode));
  }

  function syncReaderTarget(shouldEnable) {
    document.querySelectorAll("[data-asd-reader-target]").forEach((element) => {
      if (element !== currentReaderTarget) element.removeAttribute("data-asd-reader-target");
    });

    if (!shouldEnable || !currentReaderTarget?.isConnected) {
      if (currentReaderTarget) currentReaderTarget.removeAttribute("data-asd-reader-target");
      return;
    }

    currentReaderTarget.setAttribute("data-asd-reader-target", "1");
  }

  function supportsTheSeedThemeBridge(body) {
    return (
      location.hostname.endsWith("namu.wiki") ||
      body.classList.contains("theseed-dark-mode") ||
      body.classList.contains("theseed-light-mode")
    );
  }

  function scheduleContrastFix() {
    if (contrastFixPending) return;
    contrastFixPending = true;

    clearTimeout(contrastFixTimer);
    contrastFixTimer = setTimeout(() => {
      contrastFixPending = false;
      contrastFixTimer = null;
      applyContrastFixes();
    }, 180);
  }

  function startContrastObserver() {
    if (contrastObserver || !document.documentElement) return;

    contrastObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList" && record.addedNodes.length > 0) {
          scheduleContrastFix();
          return;
        }
      }
    });

    contrastObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function stopContrastObserver() {
    if (!contrastObserver) return;
    contrastObserver.disconnect();
    contrastObserver = null;
    clearTimeout(contrastFixTimer);
    contrastFixTimer = null;
    contrastFixPending = false;
  }

  function applyContrastFixes() {
    clearContrastFixes();

    const scanRoot = document.body || document.documentElement;

    if (!(scanRoot instanceof Element)) return;

    const textSelectors = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "li",
      "label",
      "small",
      "strong",
      "em",
      "blockquote",
      "figcaption",
      "td",
      "th",
      "caption",
      "summary",
      "span",
      "div",
      "a"
    ].join(",");

    const candidates = scanRoot.matches(textSelectors)
      ? [scanRoot, ...scanRoot.querySelectorAll(textSelectors)]
      : [...scanRoot.querySelectorAll(textSelectors)];

    for (const element of candidates.slice(0, 800)) {
      if (!(element instanceof Element)) continue;
      if (isExtensionUiElement(element) || !isVisibleElement(element)) continue;
      if (!hasReadableText(element)) continue;

      const style = getComputedStyle(element);
      const foreground = parseCssColor(style.color);
      const background = resolveRenderedBackground(element);
      if (!foreground || !background) continue;

      if (contrastRatio(foreground, background) >= 4.35) continue;
      element.setAttribute(
        CONTRAST_FIX_ATTR,
        relativeLuminance(background) < 0.24 ? "dark-bg" : "light-bg"
      );
    }
  }

  function clearContrastFixes() {
    document.querySelectorAll(`[${CONTRAST_FIX_ATTR}]`).forEach((element) => {
      element.removeAttribute(CONTRAST_FIX_ATTR);
    });
  }

  function pauseAutoplayMedia() {
    document.querySelectorAll("audio, video").forEach((media) => {
      if (!media.autoplay && !media.muted) return;
      try {
        media.pause();
        media.muted = true;
      } catch {}
    });
  }

  function syncAdRemoval(shouldEnable) {
    if (adRemovalEnabled === shouldEnable) return;
    adRemovalEnabled = shouldEnable;

    if (!shouldEnable) {
      stopAdObserver();
      restoreAdCandidates();
      return;
    }

    scanAdCandidates(document);
    startAdObserver();
  }

  function startAdObserver() {
    if (adObserver || !document.documentElement) return;
    adObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) {
            scheduleAdScan();
            return;
          }
        }
      }
    });
    adObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function stopAdObserver() {
    if (!adObserver) return;
    adObserver.disconnect();
    adObserver = null;
    clearTimeout(adScanTimer);
    adScanTimer = null;
    adScanPending = false;
  }

  function syncImageSofteningReveal(shouldEnable) {
    if (imageSofteningRevealEnabled === shouldEnable) return;
    imageSofteningRevealEnabled = shouldEnable;

    if (!shouldEnable) {
      document.removeEventListener("pointermove", handleImageSofteningPointerMove, true);
      document.removeEventListener("pointerleave", handleImageSofteningPointerLeave, true);
      window.removeEventListener("scroll", scheduleImageSofteningRevealUpdate, true);
      window.removeEventListener("resize", scheduleImageSofteningRevealUpdate, true);
      window.removeEventListener("blur", handleImageSofteningWindowBlur);
      imageSofteningRevealPointerX = Number.NaN;
      imageSofteningRevealPointerY = Number.NaN;
      clearHoveredImageSofteningElement();
      hideImageSofteningUnlockButton();
      removeImageSofteningUnlockButton();
      clearUnlockedImageSofteningElements();
      return;
    }

    restoreUnlockedImageSofteningElements();
    ensureImageSofteningUnlockButton();
    document.addEventListener("pointermove", handleImageSofteningPointerMove, { capture: true, passive: true });
    document.addEventListener("pointerleave", handleImageSofteningPointerLeave, { capture: true, passive: true });
    window.addEventListener("scroll", scheduleImageSofteningRevealUpdate, { capture: true, passive: true });
    window.addEventListener("resize", scheduleImageSofteningRevealUpdate, { capture: true, passive: true });
    window.addEventListener("blur", handleImageSofteningWindowBlur);
  }

  function handleImageSofteningPointerMove(event) {
    if (!imageSofteningRevealEnabled) return;
    if (event.target instanceof Element && event.target.closest(`.${IMAGE_SOFTENING_UNLOCK_BUTTON_CLASS}`)) return;
    imageSofteningRevealPointerX = event.clientX;
    imageSofteningRevealPointerY = event.clientY;
    scheduleImageSofteningRevealUpdate();
  }

  function handleImageSofteningPointerLeave(event) {
    if (event.relatedTarget) return;
    imageSofteningRevealPointerX = Number.NaN;
    imageSofteningRevealPointerY = Number.NaN;
    clearHoveredImageSofteningElement();
    hideImageSofteningUnlockButton();
  }

  function handleImageSofteningWindowBlur() {
    clearHoveredImageSofteningElement();
    hideImageSofteningUnlockButton();
  }

  function scheduleImageSofteningRevealUpdate() {
    if (!imageSofteningRevealEnabled || imageSofteningRevealRafPending) return;
    imageSofteningRevealRafPending = true;
    requestAnimationFrame(updateImageSofteningReveal);
  }

  function updateImageSofteningReveal() {
    imageSofteningRevealRafPending = false;
    if (
      !imageSofteningRevealEnabled ||
      !root.hasAttribute("data-asd-image-softening") ||
      !Number.isFinite(imageSofteningRevealPointerX) ||
      !Number.isFinite(imageSofteningRevealPointerY)
    ) {
      clearHoveredImageSofteningElement();
      hideImageSofteningUnlockButton();
      return;
    }

    const target = findImageSofteningUnlockTarget(imageSofteningRevealPointerX, imageSofteningRevealPointerY);
    if (!target) {
      clearHoveredImageSofteningElement();
      hideImageSofteningUnlockButton();
      return;
    }

    revealHoveredImageSofteningElement(target);
    showImageSofteningUnlockButton(target);
  }

  function findImageSofteningUnlockTarget(clientX, clientY) {
    const elementsAtPoint =
      typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(clientX, clientY) : [];

    for (const element of elementsAtPoint) {
      if (!(element instanceof Element) || isExtensionUiElement(element)) continue;

      const media = findSoftenedMediaForReveal(element, clientX, clientY);
      if (isImageSofteningRevealTarget(media)) return media;

      const background = element.hasAttribute(BACKGROUND_IMAGE_SOFTEN_ATTR)
        ? element
        : element.closest?.(`[${BACKGROUND_IMAGE_SOFTEN_ATTR}]`);
      if (isImageSofteningRevealTarget(background)) return background;
    }

    return findVisibleSoftenedElementAtPoint(clientX, clientY);
  }

  function findSoftenedMediaForReveal(element, clientX, clientY) {
    if (element.matches(SOFTENED_MEDIA_SELECTOR)) {
      return isVisibleElement(element) && isPointInsideElement(element, clientX, clientY) ? element : null;
    }

    const mediaContainer = element.closest("a, button, picture, figure, [role='button']");
    const media = mediaContainer?.querySelector?.(SOFTENED_MEDIA_SELECTOR);
    return media instanceof Element && isVisibleElement(media) && isPointInsideElement(media, clientX, clientY)
      ? media
      : null;
  }

  function findVisibleSoftenedElementAtPoint(clientX, clientY) {
    let bestMatch = null;
    let bestArea = Number.POSITIVE_INFINITY;

    document.querySelectorAll(`${SOFTENED_MEDIA_SELECTOR}, [${BACKGROUND_IMAGE_SOFTEN_ATTR}]`).forEach((element) => {
      if (!isImageSofteningRevealTarget(element) || !isPointInsideElement(element, clientX, clientY)) return;

      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        bestMatch = element;
      }
    });

    return bestMatch;
  }

  function isPointInsideElement(element, clientX, clientY) {
    const rect = element.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function isImageSofteningRevealTarget(element) {
    return element instanceof Element && isVisibleElement(element);
  }

  function ensureImageSofteningUnlockButton() {
    if (imageSofteningUnlockButton || !document.documentElement) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = IMAGE_SOFTENING_UNLOCK_BUTTON_CLASS;
    button.textContent = resolveLocale(syncSettings.uiLanguage) === "ko" ? "블러 해제" : "Unblur";
    button.setAttribute(
      "aria-label",
      resolveLocale(syncSettings.uiLanguage) === "ko"
        ? "이 이미지는 새로고침 전까지 블러를 해제합니다"
        : "Unblur this image until the page is refreshed"
    );
    Object.assign(button.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483645",
      display: "none",
      padding: "8px 11px",
      border: "1px solid rgba(31, 36, 40, 0.24)",
      borderRadius: "7px",
      background: "rgba(255, 253, 248, 0.96)",
      color: "#1f2428",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
      font: "600 13px/1.2 system-ui, sans-serif",
      cursor: "pointer",
      pointerEvents: "auto"
    });
    button.addEventListener("click", handleImageSofteningUnlockClick);

    document.documentElement.append(button);
    imageSofteningUnlockButton = button;
  }

  function showImageSofteningUnlockButton(target) {
    ensureImageSofteningUnlockButton();
    if (!imageSofteningUnlockButton) return;

    imageSofteningUnlockTarget = target;
    const targetRect = target.getBoundingClientRect();
    const buttonRect = imageSofteningUnlockButton.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - Math.max(buttonRect.width, 96) - 8);
    const maxTop = Math.max(8, window.innerHeight - Math.max(buttonRect.height, 36) - 8);
    const left = clampNumber(targetRect.left + 8, 8, maxLeft, 8);
    const top = clampNumber(targetRect.top + 8, 8, maxTop, 8);

    imageSofteningUnlockButton.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    imageSofteningUnlockButton.style.display = "block";
  }

  function hideImageSofteningUnlockButton() {
    imageSofteningUnlockTarget = null;
    if (imageSofteningUnlockButton) imageSofteningUnlockButton.style.display = "none";
  }

  function removeImageSofteningUnlockButton() {
    imageSofteningUnlockButton?.removeEventListener("click", handleImageSofteningUnlockClick);
    imageSofteningUnlockButton?.remove();
    imageSofteningUnlockButton = null;
  }

  function handleImageSofteningUnlockClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!imageSofteningUnlockTarget) return;
    unlockImageSofteningElement(imageSofteningUnlockTarget);
    imageSofteningHoveredElement = null;
    hideImageSofteningUnlockButton();
  }

  function revealHoveredImageSofteningElement(element) {
    if (imageSofteningHoveredElement === element) return;
    clearHoveredImageSofteningElement();
    if (imageSofteningUnlockedElements.has(element)) return;

    applyImageSofteningReveal(element);
    imageSofteningHoveredElement = element;
  }

  function clearHoveredImageSofteningElement() {
    const element = imageSofteningHoveredElement;
    imageSofteningHoveredElement = null;
    if (!(element instanceof Element) || imageSofteningUnlockedElements.has(element)) return;

    element.removeAttribute(IMAGE_SOFTENING_REVEAL_ATTR);
    if (element.matches?.(SOFTENED_MEDIA_SELECTOR)) restoreImageSofteningOriginalFilter(element);
  }

  function restoreUnlockedImageSofteningElements() {
    for (const element of imageSofteningUnlockedElements) {
      if (element.isConnected) {
        unlockImageSofteningElement(element);
      } else {
        imageSofteningUnlockedElements.delete(element);
      }
    }
  }

  function unlockImageSofteningElement(element) {
    if (!(element instanceof Element)) return;

    applyImageSofteningReveal(element);
    imageSofteningUnlockedElements.add(element);
  }

  function applyImageSofteningReveal(element) {
    element.setAttribute(IMAGE_SOFTENING_REVEAL_ATTR, "1");
    if (element.matches(SOFTENED_MEDIA_SELECTOR)) {
      if (!imageSofteningOriginalFilters.has(element)) {
        imageSofteningOriginalFilters.set(element, {
          value: element.style.getPropertyValue("filter"),
          priority: element.style.getPropertyPriority("filter")
        });
      }
      element.style.setProperty("filter", getUnlockedImageSofteningFilter(), "important");
    }
  }

  function getUnlockedImageSofteningFilter() {
    return root.hasAttribute("data-asd-reduce-contrast")
      ? "contrast(0.9) saturate(0.92) brightness(0.98)"
      : "none";
  }

  function clearUnlockedImageSofteningElements() {
    for (const element of imageSofteningUnlockedElements) {
      element.removeAttribute(IMAGE_SOFTENING_REVEAL_ATTR);
      if (element.matches?.(SOFTENED_MEDIA_SELECTOR)) restoreImageSofteningOriginalFilter(element);
    }
    imageSofteningUnlockedElements = new Set();
  }

  function restoreImageSofteningOriginalFilter(element) {
    const original = imageSofteningOriginalFilters.get(element);
    if (!original) {
      element.style.removeProperty("filter");
      return;
    }

    if (original.value) {
      element.style.setProperty("filter", original.value, original.priority);
    } else {
      element.style.removeProperty("filter");
    }
  }

  function syncBackgroundImageSoftening(shouldEnable) {
    if (backgroundImageSofteningEnabled === shouldEnable) return;
    backgroundImageSofteningEnabled = shouldEnable;

    if (!shouldEnable) {
      stopBackgroundImageObserver();
      restoreBackgroundImageCandidates();
      return;
    }

    scanBackgroundImageCandidates(document);
    startBackgroundImageObserver();
  }

  function startBackgroundImageObserver() {
    if (backgroundImageObserver || !document.documentElement) return;
    backgroundImageObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" || record.addedNodes.length > 0) {
          scheduleBackgroundImageScan();
          return;
        }
      }
    });
    backgroundImageObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "role", "aria-label"]
    });
  }

  function stopBackgroundImageObserver() {
    if (!backgroundImageObserver) return;
    backgroundImageObserver.disconnect();
    backgroundImageObserver = null;
    clearTimeout(backgroundImageScanTimer);
    backgroundImageScanTimer = null;
    backgroundImageScanPending = false;
  }

  function scheduleBackgroundImageScan() {
    if (backgroundImageScanPending) return;
    backgroundImageScanPending = true;
    clearTimeout(backgroundImageScanTimer);
    backgroundImageScanTimer = setTimeout(() => {
      backgroundImageScanPending = false;
      backgroundImageScanTimer = null;
      if (!backgroundImageSofteningEnabled || !document.documentElement) return;
      scanBackgroundImageCandidates(document);
    }, 260);
  }

  function scanBackgroundImageCandidates(scope) {
    if (!scope?.querySelectorAll) return;

    const candidates = new Set();
    if (scope instanceof Element && isBackgroundImageCandidate(scope)) {
      candidates.add(scope);
    }

    scope.querySelectorAll(BACKGROUND_IMAGE_CANDIDATE_SELECTOR).forEach((element) => {
      if (isBackgroundImageCandidate(element)) candidates.add(element);
    });

    candidates.forEach(markBackgroundImageCandidate);
  }

  function isBackgroundImageCandidate(element) {
    if (!(element instanceof Element)) return false;
    if (element === document.documentElement || element === document.body) return false;
    if (isExtensionUiElement(element)) return false;
    if (element.hasAttribute(BACKGROUND_IMAGE_SOFTEN_ATTR)) return false;
    if (element.closest("form, input, textarea, select, button, [contenteditable='true']")) return false;
    if (element.querySelector("input, textarea, select, button, video, iframe, [contenteditable='true']")) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return false;
    if (rect.width > window.innerWidth * 0.98 && rect.height > window.innerHeight * 0.85) return false;

    const text = normalizeText(element.innerText || element.textContent || "", 80);
    if (text.length > 24) return false;

    return /\burl\(/i.test(getBackgroundImageForSoftening(element));
  }

  function markBackgroundImageCandidate(element) {
    const style = getComputedStyle(element);
    const backgroundImage = /\burl\(/i.test(style.backgroundImage || "")
      ? style.backgroundImage
      : element.style?.backgroundImage || "";
    if (!/\burl\(/i.test(backgroundImage)) return;

    element.setAttribute(BACKGROUND_IMAGE_SOFTEN_ATTR, "1");
    element.style.setProperty("--asd-background-softening-image", backgroundImage);
    element.style.setProperty("--asd-background-softening-size", style.backgroundSize || "cover");
    element.style.setProperty("--asd-background-softening-position", style.backgroundPosition || "center");
    element.style.setProperty("--asd-background-softening-repeat", style.backgroundRepeat || "no-repeat");
  }

  function getBackgroundImageForSoftening(element) {
    const style = getComputedStyle(element);
    const computedBackgroundImage = style.backgroundImage || "";
    if (/\burl\(/i.test(computedBackgroundImage)) return computedBackgroundImage;
    return element.style?.backgroundImage || "";
  }

  function restoreBackgroundImageCandidates() {
    document.querySelectorAll(`[${BACKGROUND_IMAGE_SOFTEN_ATTR}]`).forEach((element) => {
      element.removeAttribute(BACKGROUND_IMAGE_SOFTEN_ATTR);
      element.removeAttribute(IMAGE_SOFTENING_REVEAL_ATTR);
      element.style.removeProperty("--asd-background-softening-image");
      element.style.removeProperty("--asd-background-softening-size");
      element.style.removeProperty("--asd-background-softening-position");
      element.style.removeProperty("--asd-background-softening-repeat");
    });
  }

  function syncGifFreezing(shouldEnable) {
    if (gifFreezingEnabled === shouldEnable) return;
    gifFreezingEnabled = shouldEnable;

    if (!shouldEnable) {
      stopGifObserver();
      restoreFrozenGifs();
      return;
    }

    scanGifCandidates(document);
    startGifObserver();
  }

  function startGifObserver() {
    if (gifObserver || !document.documentElement) return;
    gifObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" || record.addedNodes.length > 0) {
          scheduleGifScan();
          return;
        }
      }
    });
    gifObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"]
    });
  }

  function stopGifObserver() {
    if (!gifObserver) return;
    gifObserver.disconnect();
    gifObserver = null;
    clearTimeout(gifScanTimer);
    gifScanTimer = null;
    gifScanPending = false;
  }

  function scheduleGifScan() {
    if (gifScanPending) return;
    gifScanPending = true;
    clearTimeout(gifScanTimer);
    gifScanTimer = setTimeout(() => {
      gifScanPending = false;
      gifScanTimer = null;
      if (!gifFreezingEnabled || !document.documentElement) return;
      scanGifCandidates(document);
    }, 260);
  }

  function scanGifCandidates(scope) {
    if (!scope?.querySelectorAll) return;
    if (scope instanceof HTMLImageElement) freezeAnimatedGif(scope);
    scope.querySelectorAll("img").forEach(freezeAnimatedGif);
  }

  // Reduce-motion: pause animated GIFs by swapping in a static first frame.
  // Cross-origin GIFs without CORS headers taint the canvas and cannot be frozen,
  // so those are left untouched.
  function freezeAnimatedGif(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.hasAttribute(GIF_FROZEN_ATTR) || isExtensionUiElement(img)) return;
    const src = img.currentSrc || img.src || "";
    if (!/\.gif(\?|#|$)/i.test(src)) return;

    const draw = () => {
      if (!gifFreezingEnabled || img.hasAttribute(GIF_FROZEN_ATTR)) return;
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const frozen = canvas.toDataURL("image/png");
        img.setAttribute(GIF_FROZEN_ATTR, "1");
        img.dataset.asdGifOriginal = src;
        if (img.srcset) {
          img.dataset.asdGifSrcset = img.srcset;
          img.removeAttribute("srcset");
        }
        img.src = frozen;
      } catch {
        // Tainted (cross-origin) canvas — leave the animated GIF in place.
      }
    };

    if (img.complete && (img.naturalWidth || img.width)) draw();
    else img.addEventListener("load", draw, { once: true });
  }

  function restoreFrozenGifs() {
    document.querySelectorAll(`img[${GIF_FROZEN_ATTR}]`).forEach((img) => {
      const original = img.dataset.asdGifOriginal;
      const srcset = img.dataset.asdGifSrcset;
      img.removeAttribute(GIF_FROZEN_ATTR);
      delete img.dataset.asdGifOriginal;
      delete img.dataset.asdGifSrcset;
      if (srcset) img.setAttribute("srcset", srcset);
      if (original) img.src = original;
    });
  }

  function scheduleAdScan() {
    if (adScanPending) return;
    adScanPending = true;
    clearTimeout(adScanTimer);
    adScanTimer = setTimeout(() => {
      adScanPending = false;
      adScanTimer = null;
      if (!adRemovalEnabled || !document.documentElement) return;
      scanAdCandidates(document);
    }, 220);
  }

  function scanAdCandidates(scope) {
    if (!scope?.querySelectorAll) return;

    const candidates = new Set();
    if (scope instanceof Element && isLikelyAdElement(scope)) {
      candidates.add(scope);
    }

    scope.querySelectorAll(AD_CANDIDATE_SELECTOR).forEach((element) => {
      candidates.add(resolveAdContainer(element));
    });

    scope.querySelectorAll("[id], [class], [role]").forEach((element) => {
      if (isLikelyAdElement(element)) {
        candidates.add(resolveAdContainer(element));
      }
    });

    syncAdRestoreControls();
    candidates.forEach(markAdCandidate);
    syncAdRestoreControls();
  }

  function resolveAdContainer(element) {
    let current = element;
    for (let depth = 0; depth < 3; depth += 1) {
      const parent = current?.parentElement;
      if (!parent || parent === document.body || parent === document.documentElement) break;
      if (isProtectedContent(parent)) break;
      // Never swallow a navigation/search bar (e.g. YouTube's #masthead-container is
      // full-width but short, so it looks "peripheral" — collapsing it hides search).
      if (isInteractiveChrome(parent)) break;
      if (isLikelyAdElement(parent)) {
        current = parent;
      }
    }
    return current;
  }

  function markAdCandidate(element) {
    if (!(element instanceof Element)) return;
    if (isProtectedContent(element)) return;
    if (isInteractiveChrome(element)) return;
    if (element.hasAttribute("data-asd-ad-collapsed")) return;
    if (element.closest("[data-asd-ad-collapsed]")) return;
    if (element.querySelector("[data-asd-ad-collapsed]")) return;

    const collapseId = `asd-ad-${collapsedAdIdCounter += 1}`;
    const control = createCollapsedAdControl(element, collapseId);
    element.setAttribute("data-asd-ad-collapse-id", collapseId);
    element.setAttribute("data-asd-ad-collapsed", "1");
    element.setAttribute("data-asd-original-hidden", element.hidden ? "1" : "0");
    element.setAttribute("data-asd-original-aria-hidden", element.getAttribute("aria-hidden") || "");
    element.setAttribute("aria-hidden", "true");
    element.hidden = true;

    element.before(control);
  }

  function syncAdRestoreControls() {
    const collapsedElements = [...document.querySelectorAll("[data-asd-ad-collapsed]")];
    const collapsedIds = new Set();

    collapsedElements.forEach((element) => {
      let collapseId = element.getAttribute("data-asd-ad-collapse-id");
      if (!collapseId) {
        collapseId = `asd-ad-${collapsedAdIdCounter += 1}`;
        element.setAttribute("data-asd-ad-collapse-id", collapseId);
      }

      collapsedIds.add(collapseId);
      const control = document.querySelector(
        `[data-asd-ad-restore-button][data-asd-ad-restore-for="${escapeSelector(collapseId)}"]`
      );
      if (!control) element.before(createCollapsedAdControl(element, collapseId));
    });

    document.querySelectorAll("[data-asd-ad-restore-button]").forEach((control) => {
      const collapseId = control.getAttribute("data-asd-ad-restore-for");
      if (!collapseId || !collapsedIds.has(collapseId)) control.remove();
    });
  }

  function restoreAdCandidates() {
    document.querySelectorAll("[data-asd-ad-collapsed]").forEach((element) => {
      restoreAdCandidate(element);
    });
    document.querySelectorAll("[data-asd-ad-restore-button]").forEach((element) => {
      element.remove();
    });
  }

  function createCollapsedAdControl(element, collapseId = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-asd-ad-restore-button", "1");
    if (collapseId) button.setAttribute("data-asd-ad-restore-for", collapseId);
    button.textContent = getCollapsedAdText();
    button.addEventListener("click", () => restoreAdCandidate(element, button));
    return button;
  }

  function restoreAdCandidate(element, control = null) {
    if (!(element instanceof Element)) return;

    const originalHidden = element.getAttribute("data-asd-original-hidden") === "1";
    const originalAriaHidden = element.getAttribute("data-asd-original-aria-hidden") || "";

    element.removeAttribute("data-asd-ad-collapsed");
    element.removeAttribute("data-asd-ad-collapse-id");
    element.removeAttribute("data-asd-original-hidden");
    element.removeAttribute("data-asd-original-aria-hidden");
    element.hidden = originalHidden;

    if (originalAriaHidden) {
      element.setAttribute("aria-hidden", originalAriaHidden);
    } else {
      element.removeAttribute("aria-hidden");
    }

    if (control instanceof Element) {
      control.remove();
    } else {
      const previous = element.previousElementSibling;
      if (previous?.matches("[data-asd-ad-restore-button]")) previous.remove();
    }
  }

  function getCollapsedAdText() {
    return resolveLocale(syncSettings.uiLanguage) === "ko"
      ? "접힌 방해 요소 보기"
      : "Show collapsed distraction";
  }

  function isLikelyAdElement(element) {
    if (!(element instanceof Element)) return false;

    const marker = [
      element.id,
      element.className,
      element.getAttribute("role"),
      element.getAttribute("aria-label"),
      element.getAttribute("data-testid"),
      element.getAttribute("data-ad"),
      element.getAttribute("data-ad-slot"),
      element.getAttribute("data-ad-client")
    ]
      .filter(Boolean)
      .join(" ");

    // Cheap marker test first; only walk the ancestor tree (isProtectedContent)
    // for the rare elements whose attributes look ad-like.
    if (!AD_MARKER_PATTERN.test(marker)) return false;
    return !isProtectedContent(element);
  }

  function isProtectedContent(element) {
    return Boolean(
      element.closest(
        "main, article, form, [role=\"main\"], [role=\"article\"], [contenteditable=\"true\"], .asd-foundation-indicator, .asd-foundation-ruler"
      ) &&
        !element.matches(AD_CANDIDATE_SELECTOR) &&
        !AD_MARKER_PATTERN.test([element.id, element.className, element.getAttribute("aria-label")].filter(Boolean).join(" "))
    );
  }

  // Site chrome we must never collapse as an ad: navigation, search, banners, or
  // anything wrapping a real form control. Ad blocks have none of these.
  function isInteractiveChrome(element) {
    if (!(element instanceof Element)) return false;
    if (element.matches("header, nav, [role='banner'], [role='navigation'], [role='search']")) return true;
    return Boolean(
      element.querySelector(
        "nav, header, [role='search'], [role='navigation'], [role='banner'], input:not([type='hidden']), textarea, select"
      )
    );
  }

  function syncReadingRuler(shouldEnable) {
    if (rulerEnabled === shouldEnable) return;
    rulerEnabled = shouldEnable;

    if (!shouldEnable) {
      document.removeEventListener("mousemove", moveRuler);
      if (ruler) ruler.hidden = true;
      return;
    }

    onBodyReady(() => {
      ruler = ruler || createRuler();
      ruler.hidden = false;
      document.addEventListener("mousemove", moveRuler, { passive: true });
    });
  }

  function createRuler() {
    const element = document.createElement("div");
    element.className = "asd-foundation-ruler";
    element.hidden = true;
    document.body.append(element);
    return element;
  }

  function moveRuler(event) {
    rulerPointerY = event.clientY;
    if (rulerRafPending) return;
    rulerRafPending = true;
    requestAnimationFrame(() => {
      rulerRafPending = false;
      if (!ruler) return;
      ruler.style.transform = `translateY(${Math.max(0, rulerPointerY - 18)}px)`;
    });
  }

  // Marks the detected reading container so chunking / reading-width CSS can
  // scope itself to article content instead of the whole page.
  function syncReadShape(shouldEnable) {
    document.querySelectorAll("[data-asd-read-shape]").forEach((element) => {
      if (element !== currentReaderTarget) element.removeAttribute("data-asd-read-shape");
    });

    if (!shouldEnable || !currentReaderTarget?.isConnected) {
      if (currentReaderTarget) currentReaderTarget.removeAttribute("data-asd-read-shape");
      return;
    }

    currentReaderTarget.setAttribute("data-asd-read-shape", "1");
  }

  // Focus spotlight (A1): a transparent window that follows the reading
  // position while a large box-shadow dims the rest of the page. Purely visual
  // overlay — it never mutates page DOM or layout.
  function syncFocusSpotlight(shouldEnable, scope) {
    spotlightScope = scope === "line" ? "line" : "paragraph";

    // apply() runs on every settings change; only do work when the on/off state
    // actually flips. A scope change while enabled is picked up on the next move.
    if (spotlightEnabled === shouldEnable) return;
    spotlightEnabled = shouldEnable;

    if (!shouldEnable) {
      document.removeEventListener("mousemove", moveSpotlight);
      window.removeEventListener("scroll", scheduleSpotlight);
      if (spotlightEl) spotlightEl.hidden = true;
      return;
    }

    onBodyReady(() => {
      spotlightEl = spotlightEl || createSpotlight();
      spotlightEl.hidden = false;
      // Start centered so the first paint (before any pointer move) is sensible
      // rather than pinned to the top-left corner.
      if (!spotlightX && !spotlightY) {
        spotlightX = Math.round((window.innerWidth || 0) / 2);
        spotlightY = Math.round((window.innerHeight || 0) / 2);
      }
      document.addEventListener("mousemove", moveSpotlight, { passive: true });
      window.addEventListener("scroll", scheduleSpotlight, { passive: true });
      positionSpotlight();
    });
  }

  function createSpotlight() {
    const element = document.createElement("div");
    element.className = "asd-foundation-spotlight";
    element.hidden = true;
    document.body.append(element);
    return element;
  }

  function moveSpotlight(event) {
    spotlightX = event.clientX;
    spotlightY = event.clientY;
    scheduleSpotlight();
  }

  function scheduleSpotlight() {
    if (spotlightRafPending) return;
    spotlightRafPending = true;
    requestAnimationFrame(() => {
      spotlightRafPending = false;
      positionSpotlight();
    });
  }

  function positionSpotlight() {
    if (!spotlightEl || spotlightEl.hidden) return;
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    let top;
    let height;
    const block = spotlightScope === "paragraph" ? findSpotlightBlock(spotlightX, spotlightY) : null;
    if (block) {
      const rect = block.getBoundingClientRect();
      const pad = 8;
      top = rect.top - pad;
      height = rect.height + pad * 2;
    } else {
      height = 48;
      top = spotlightY - height / 2;
    }
    height = Math.min(height, viewportH);
    top = Math.max(0, Math.min(top, viewportH - height));
    spotlightEl.style.top = `${Math.round(top)}px`;
    spotlightEl.style.height = `${Math.round(height)}px`;
  }

  function findSpotlightBlock(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const target = document.elementFromPoint(x, y);
    if (!(target instanceof Element) || isExtensionUiElement(target)) return null;
    const block = target.closest("p, li, dd, dt, blockquote, h1, h2, h3, h4, h5, h6, td, figcaption, pre");
    if (!block || isExtensionUiElement(block) || !isVisibleElement(block)) return null;
    return block;
  }

  // Reading progress (A2): a thin top bar plus an estimated-time-left label.
  // Counters time blindness on long article pages.
  function syncReadingProgress(shouldEnable) {
    // Only flip listeners/DOM when the on/off state actually changes (apply()
    // runs on every settings change). Word count is recomputed lazily.
    if (progressEnabled === shouldEnable) return;
    progressEnabled = shouldEnable;

    if (!shouldEnable) {
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      if (progressEl) progressEl.hidden = true;
      return;
    }

    onBodyReady(() => {
      progressEl = progressEl || createProgress();
      progressEl.hidden = false;
      progressWordsStale = true;
      window.addEventListener("scroll", scheduleProgress, { passive: true });
      window.addEventListener("resize", scheduleProgress, { passive: true });
      updateProgress();
    });
  }

  function createProgress() {
    const element = document.createElement("div");
    element.className = "asd-foundation-progress";
    element.setAttribute("role", "progressbar");
    element.setAttribute("aria-label", "Reading progress");
    element.setAttribute("aria-valuemin", "0");
    element.setAttribute("aria-valuemax", "100");
    const fill = document.createElement("div");
    fill.className = "fill";
    const label = document.createElement("span");
    label.className = "label";
    element.append(fill, label);
    document.body.append(element);
    return element;
  }

  function scheduleProgress() {
    if (progressRafPending) return;
    progressRafPending = true;
    requestAnimationFrame(() => {
      progressRafPending = false;
      updateProgress();
    });
  }

  function updateProgress() {
    if (!progressEl || progressEl.hidden) return;
    if (progressWordsStale) {
      progressTotalWords = countReadableWords();
      progressWordsStale = false;
    }
    const doc = document.documentElement;
    const viewportH = window.innerHeight || doc.clientHeight || 0;
    const max = Math.max(1, (doc.scrollHeight || 0) - viewportH);
    const ratio = Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop || 0) / max));
    const fill = progressEl.querySelector(".fill");
    const label = progressEl.querySelector(".label");
    if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
    if (label) {
      const remainingWords = Math.max(0, Math.round(progressTotalWords * (1 - ratio)));
      const minutes = Math.ceil(remainingWords / 220);
      label.textContent = minutes > 0 ? `~${minutes} min left` : "done";
    }
    progressEl.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  }

  function countReadableWords() {
    const source = currentReaderTarget?.isConnected ? currentReaderTarget : document.body;
    const text = source?.innerText || "";
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function syncActiveIndicator(shouldShow, profile) {
    if (!shouldShow) {
      if (indicator) indicator.hidden = true;
      return;
    }

    onBodyReady(() => {
      indicator = indicator || createIndicator();
      indicator.hidden = false;
      indicator.textContent = currentSensitivePageKind === SENSITIVE_PAGE_KINDS.none
        ? `ASD UI - ${profile}`
        : `ASD UI - protected: ${currentSensitivePageKind}`;
    });
  }

  function createIndicator() {
    const element = document.createElement("div");
    element.className = "asd-foundation-indicator";
    element.setAttribute("role", "status");
    document.body.append(element);
    return element;
  }

  // Opt-in floating quick-toggle: a small on-page control for the most common
  // global toggles, so users do not have to open the popup. Writes global sync
  // settings via the background; state reflects back through storage.onChanged.
  const QUICK_TOGGLE_ITEMS = [
    { key: "enabled", label: "On" },
    { key: "focusSpotlight", label: "Spotlight" },
    { key: "readerMode", label: "Reader" }
  ];

  function syncQuickToggle(shouldShow) {
    if (!shouldShow) {
      if (quickToggleEl) quickToggleEl.hidden = true;
      return;
    }

    onBodyReady(() => {
      quickToggleEl = quickToggleEl || createQuickToggle();
      quickToggleEl.hidden = false;
      updateQuickToggleStates();
    });
  }

  function createQuickToggle() {
    const host = document.createElement("div");
    host.className = "asd-foundation-quicktoggle";

    const panel = document.createElement("div");
    panel.className = "qt-panel";
    panel.hidden = true;

    for (const { key, label } of QUICK_TOGGLE_ITEMS) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "qt-item";
      item.dataset.qtKey = key;
      item.textContent = label;
      item.addEventListener("click", () => {
        void sendRuntimeMessage({
          type: MESSAGE_TYPES.setSettings,
          payload: { [key]: !syncSettings[key] }
        });
      });
      panel.append(item);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "qt-button";
    button.textContent = "ASD";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "ASD UI quick toggles");
    button.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });

    host.append(panel, button);
    document.body.append(host);
    return host;
  }

  function updateQuickToggleStates() {
    if (!quickToggleEl) return;
    quickToggleEl.querySelectorAll(".qt-item").forEach((item) => {
      const active = Boolean(syncSettings[item.dataset.qtKey]);
      item.setAttribute("aria-pressed", String(active));
      item.classList.toggle("is-on", active);
    });
  }

  function getSelectionContext() {
    refreshPageClassification();
    const selection = window.getSelection();
    const selectionText = normalizeText(selection?.toString() || "", 2000);
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const rootNode = range ? getRangeContainer(range) : document.body;
    const rawContext = rootNode?.innerText || rootNode?.textContent || document.body?.innerText || "";

    return {
      selectionText,
      surroundingText: extractNearbyText(normalizeText(rawContext, 16000), selectionText),
      pageTitle: document.title || "",
      pageUrl: location.href,
      pageLanguage: document.documentElement.lang || "",
      browserLanguage: navigator.language || "",
      sensitivePageKind: currentSensitivePageKind
    };
  }

  function getPageContext() {
    refreshPageClassification();

    return {
      pageTitle: document.title || "",
      pageUrl: location.href,
      pageProfile: currentProfile,
      communitySubtype: currentCommunitySubtype,
      visibleHeadings: collectVisibleTexts("h1, h2, h3, [role='heading']", 10, 120),
      keyActions: collectKeyActions(),
      importantTextSnippets: collectImportantTextSnippets(),
      mainText: collectMainText(),
      visibleCommunityItems: currentProfile === PAGE_PROFILES.community ? collectVisibleCommunityItems() : [],
      browserLanguage: navigator.language || "",
      sensitivePageKind: currentSensitivePageKind
    };
  }

  // The page summary must reflect the page's actual content, not just its
  // headings/buttons. Gather readable body text from the main content container,
  // skipping navigation/aside/footer chrome, capped so the prompt stays bounded.
  function collectMainText() {
    const container =
      currentReaderTarget ||
      document.querySelector("main, [role='main'], article") ||
      document.body;
    if (!(container instanceof Element)) return "";

    const blocks = [...container.querySelectorAll("p, li, h1, h2, h3, h4, blockquote, td, dd, figcaption")]
      .filter((element) => isVisibleElement(element))
      .filter(
        (element) =>
          !element.closest(
            "nav, header, footer, aside, [role='navigation'], [role='banner'], [role='complementary'], [role='search']"
          )
      )
      .map((element) => normalizeText(element.innerText || "", 400))
      .filter((value) => value.length >= 2);

    let text = "";
    for (const block of blocks) {
      if (text.length + block.length + 1 > 6000) break;
      text += text ? `\n${block}` : block;
    }

    if (text.length < 200) {
      text = normalizeText(container.innerText || "", 6000);
    }
    return text;
  }

  function getFormContext() {
    refreshPageClassification();
    const form = findRelevantForm();
    const warnings = form ? collectFormWarnings(form) : [];

    return {
      pageTitle: document.title || "",
      pageUrl: location.href,
      formTitle: form ? getFormTitle(form) : "",
      fields: form ? collectFormFields(form) : [],
      buttons: form ? collectFormButtons(form) : [],
      warnings,
      browserLanguage: navigator.language || "",
      sensitivePageKind: currentSensitivePageKind
    };
  }

  function getRangeContainer(range) {
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (node instanceof Element) {
      return node.closest("article, main, section, div, p, li, td, th, form") || node;
    }
    return document.body;
  }

  function extractNearbyText(sourceText, selectionText) {
    if (!sourceText) return "";
    if (!selectionText) return sourceText.slice(0, 900);

    const index = sourceText.toLowerCase().indexOf(selectionText.toLowerCase());
    if (index === -1) return sourceText.slice(0, 900);

    const start = Math.max(0, index - 420);
    const end = Math.min(sourceText.length, index + selectionText.length + 420);
    return sourceText.slice(start, end);
  }

  function collectVisibleTexts(selector, maxItems, maxLength, scope = document) {
    const elements = [...scope.querySelectorAll(selector)];
    const result = [];
    const seen = new Set();

    for (const element of elements) {
      if (!(element instanceof Element)) continue;
      if (!isVisibleElement(element)) continue;

      const text = normalizeText(element.innerText || element.textContent || "", maxLength);
      if (text.length < 2) continue;

      const key = text.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(text);

      if (result.length >= maxItems) break;
    }

    return result;
  }

  function collectKeyActions() {
    const candidates = [
      ...document.querySelectorAll("button, input[type='submit'], input[type='button'], summary, [role='button'], a[href]")
    ];
    const result = [];
    const seen = new Set();

    for (const element of candidates) {
      if (!(element instanceof Element)) continue;
      if (!isVisibleElement(element)) continue;

      const text = normalizeText(
        element.innerText || element.getAttribute("value") || element.getAttribute("aria-label") || "",
        120
      );
      if (!text || text.length > 80) continue;

      const likelyAction =
        element.matches("button, input[type='submit'], input[type='button'], summary, [role='button']") ||
        /\b(sign|log|continue|next|submit|apply|checkout|pay|save|reply|post|search|join|start|open|view)\b/i.test(text) ||
        element.closest("form");

      if (!likelyAction) continue;

      const key = text.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(text);
      if (result.length >= 12) break;
    }

    return result;
  }

  function collectImportantTextSnippets() {
    const target =
      document.querySelector("main, article, form, [role='main']") ||
      document.body ||
      document.documentElement;
    const elements = [...target.querySelectorAll("p, li, dd, dt, blockquote, h1, h2, h3, label, legend, td, th")];
    const result = [];
    const seen = new Set();

    for (const element of elements) {
      if (!(element instanceof Element)) continue;
      if (!isVisibleElement(element)) continue;

      const text = normalizeText(element.innerText || element.textContent || "", 280);
      if (text.length < 40) continue;

      const key = text.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(text);
      if (result.length >= 10) break;
    }

    if (result.length === 0) {
      const fallbackText = normalizeText(target.innerText || "", 280);
      if (fallbackText) result.push(fallbackText);
    }

    return result;
  }

  function collectVisibleCommunityItems() {
    const selectors = [
      "[data-testid='post-container']",
      "article",
      "[role='article']",
      "shreddit-comment",
      ".comment_view",
      ".reply",
      "[class*='comment' i]",
      "[id*='comment' i]",
      "[class*='reply' i]",
      "[id*='reply' i]"
    ].join(",");

    const result = [];
    const seen = new Set();
    const elements = [...document.querySelectorAll(selectors)];

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (!(element instanceof Element)) continue;
      if (!isVisibleElement(element)) continue;

      const text = normalizeText(element.innerText || element.textContent || "", 300);
      if (text.length < 20) continue;

      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        kind: classifyCommunityItem(element),
        text,
        position: index + 1
      });

      if (result.length >= 12) break;
    }

    return result;
  }

  function classifyCommunityItem(element) {
    if (element.matches("shreddit-comment, .reply, [class*='reply' i], [id*='reply' i]")) {
      return "reply";
    }

    if (element.matches(".comment_view, [class*='comment' i], [id*='comment' i]")) {
      return "comment";
    }

    if (element.matches("[data-testid='post-container'], article, [role='article']")) {
      return "post";
    }

    return "metadata";
  }

  function findRelevantForm() {
    const activeForm =
      document.activeElement instanceof Element ? document.activeElement.closest("form") : null;
    if (activeForm && countExplainableFields(activeForm) > 0) {
      return activeForm;
    }

    const forms = [...document.querySelectorAll("form")];
    const scored = forms
      .map((form) => ({
        form,
        score: countExplainableFields(form) * 10 + countVisibleButtons(form) * 3 + (isVisibleElement(form) ? 5 : 0)
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score);

    return scored[0]?.form || null;
  }

  function collectFormFields(form) {
    const fields = [...form.querySelectorAll("input, select, textarea")];
    const result = [];

    for (const field of fields) {
      if (!(field instanceof Element)) continue;
      if (!isExplainableField(field)) continue;

      const label = getFieldLabel(field);
      const type = getFieldType(field);
      const placeholder = normalizeText(field.getAttribute("placeholder") || "", 120);
      const nearbyHelpText = getNearbyHelpText(field);
      const required =
        field.hasAttribute("required") ||
        field.getAttribute("aria-required") === "true" ||
        /\*/.test(label) ||
        /\brequired\b/i.test(nearbyHelpText);

      if (!label && !placeholder && !type) continue;

      result.push({
        label,
        type,
        required,
        placeholder,
        nearbyHelpText
      });

      if (result.length >= 20) break;
    }

    return result;
  }

  function collectFormButtons(form) {
    return collectVisibleTexts("button, input[type='submit'], input[type='button']", 12, 80, form);
  }

  function collectFormWarnings(form) {
    const selectors = [
      "[role='alert']",
      ".error",
      ".warning",
      ".notice",
      ".help",
      ".hint",
      ".message",
      "[aria-invalid='true']"
    ].join(",");

    const texts = collectVisibleTexts(selectors, 12, 180, form);
    if (texts.length > 0) return texts;

    return collectVisibleTexts("small, p, li, .description, .note", 8, 180, form).filter((text) =>
      /\b(required|warning|privacy|agree|consent|password|verify|billing|payment|security|timeout)\b/i.test(text)
    );
  }

  function getFormTitle(form) {
    const ariaLabel = normalizeText(form.getAttribute("aria-label") || "", 160);
    if (ariaLabel) return ariaLabel;

    const labelledBy = form.getAttribute("aria-labelledby");
    if (labelledBy) {
      const text = normalizeText(
        labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.innerText || "")
          .join(" "),
        160
      );
      if (text) return text;
    }

    const nearbyHeading = form.closest("section, article, main, div")?.querySelector("h1, h2, h3, legend");
    return normalizeText(nearbyHeading?.innerText || "", 160);
  }

  function countExplainableFields(form) {
    return [...form.querySelectorAll("input, select, textarea")].filter((field) => isExplainableField(field)).length;
  }

  function countVisibleButtons(form) {
    return [...form.querySelectorAll("button, input[type='submit'], input[type='button']")].filter((element) =>
      isVisibleElement(element)
    ).length;
  }

  function isExplainableField(field) {
    if (!(field instanceof Element)) return false;
    if (!isVisibleElement(field)) return false;
    if (field.matches("input[type='hidden'], input[type='image'], input[type='file'][hidden], [disabled]")) return false;
    return true;
  }

  function getFieldLabel(field) {
    const fieldId = field.getAttribute("id");
    if (fieldId) {
      const explicitLabel = document.querySelector(`label[for="${escapeSelector(fieldId)}"]`);
      const text = normalizeText(explicitLabel?.innerText || "", 120);
      if (text) return text;
    }

    const wrappingLabel = field.closest("label");
    const wrappingText = normalizeText(wrappingLabel?.innerText || "", 120);
    if (wrappingText) return wrappingText;

    const ariaLabel = normalizeText(field.getAttribute("aria-label") || "", 120);
    if (ariaLabel) return ariaLabel;

    const row = field.closest("tr, li, .field, .form-group, .input-group, .control, div");
    const nearbyLabel = normalizeText(row?.querySelector("label, legend, h1, h2, h3")?.innerText || "", 120);
    return nearbyLabel;
  }

  function getFieldType(field) {
    if (field instanceof HTMLTextAreaElement) return "textarea";
    if (field instanceof HTMLSelectElement) return "select";
    return normalizeText(field.getAttribute("type") || field.tagName.toLowerCase(), 40);
  }

  function getNearbyHelpText(field) {
    const describedBy = field.getAttribute("aria-describedby") || "";
    const describedText = normalizeText(
      describedBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.innerText || "")
        .join(" "),
      220
    );
    if (describedText) return describedText;

    const wrapper = field.closest("label, fieldset, .field, .form-group, .input-group, .control, div");
    if (!wrapper) return "";

    const text = normalizeText(
      [...wrapper.querySelectorAll("small, .hint, .help, .note, .description, .error, [role='alert']")]
        .map((element) => element.innerText || element.textContent || "")
        .join(" "),
      220
    );
    return text;
  }

  function renderAssistPanel(payload) {
    if (!isExtensionContextAvailable()) {
      handleExtensionContextInvalidation();
      return;
    }
    if (!IS_TOP_FRAME) return;

    assistState.payload = payload;

    try {
      const ui = ensureAssistUi();
      const text = getPanelText();
      const wasHidden = ui.panel.hidden !== false;
      syncAssistUiAppearance();

      if (wasHidden && document.activeElement instanceof HTMLElement) {
        previouslyFocusedElement = document.activeElement;
      }

      ui.panel.hidden = false;
      ui.body.replaceChildren();

      ui.badge.textContent =
        payload.state === "loading" ? text.loading : payload.state === "error" ? text.issue : payload.model || text.helper;
      ui.title.textContent = getPanelTitle(payload.requestType, text);
      ui.close.textContent = text.close;

      if (payload.state === "loading") {
        ui.body.append(createLoadingIndicator(payload.message || text.loadingFallback));
        return;
      }

      if (payload.state === "error") {
        ui.body.append(createMessage(payload.message || text.loadingFallback));
        if (payload.requestType) ui.body.append(createRetryButton(payload.requestType, text));
        return;
      }

      renderUnifiedSummary(ui.body, payload.response || {}, text);
    } catch (error) {
      if (isExtensionContextInvalidationError(error)) {
        handleExtensionContextInvalidation();
        return;
      }

      throw error;
    }

    if (assistUi && !assistUi.panel.hidden) {
      try {
        assistUi.panel.focus({ preventScroll: true });
      } catch {
        /* focus may fail if the panel is not yet rendered */
      }
    }
  }

  function hideAssistPanel() {
    if (!assistUi) return;

    try {
      assistUi.panel.hidden = true;
    } catch (error) {
      if (isExtensionContextInvalidationError(error)) {
        handleExtensionContextInvalidation();
        return;
      }

      throw error;
    }

    const prior = previouslyFocusedElement;
    previouslyFocusedElement = null;
    if (prior && typeof prior.focus === "function" && prior.isConnected) {
      try {
        prior.focus({ preventScroll: true });
      } catch {
        /* element may no longer be focusable */
      }
    }
  }

  function ensureAssistUi() {
    if (assistUi) return assistUi;

    const host = document.getElementById(ASSIST_UI_HOST_ID) || document.createElement("div");
    host.id = ASSIST_UI_HOST_ID;
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.pointerEvents = "none";
    host.style.zIndex = "2147483646";

    if (!host.isConnected) {
      (document.documentElement || document.body).appendChild(host);
    }

    const shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = ASSIST_UI_STYLES;

    const overlay = document.createElement("div");
    overlay.id = "overlay";

    const panel = document.createElement("aside");
    panel.id = "panel";
    panel.hidden = true;

    const header = document.createElement("div");
    header.className = "header";

    const heading = document.createElement("div");
    heading.className = "heading";

    const badge = document.createElement("span");
    badge.className = "badge";

    const title = document.createElement("h2");
    title.className = "title";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "close";
    close.addEventListener("click", hideAssistPanel);

    const body = document.createElement("div");
    body.className = "body";

    heading.append(badge, title);
    header.append(heading, close);
    panel.append(header, body);
    overlay.append(panel);
    shadow.append(style, overlay);

    panel.setAttribute("tabindex", "-1");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    close.setAttribute("aria-label", "Close");

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        hideAssistPanel();
      }
    });

    assistUi = {
      host,
      shadow,
      panel,
      badge,
      title,
      body,
      close
    };

    syncAssistUiAppearance();
    return assistUi;
  }

  function syncAssistUiAppearance() {
    if (!assistUi) return;

    const theme = THEMES[syncSettings.themePreset] || THEMES["soft-light"];
    const isDark = syncSettings.themePreset === "soft-dark";

    assistUi.host.style.setProperty(
      "--asd-ui-font",
      syncSettings.readableFontEnabled
        ? '"KoddiUD OnGothic", "Atkinson Hyperlegible", "Segoe UI", "Malgun Gothic", Arial, sans-serif'
        : 'system-ui, "Segoe UI", Arial, sans-serif'
    );
    assistUi.host.style.setProperty("--asd-ui-surface", theme.surface);
    assistUi.host.style.setProperty(
      "--asd-ui-surface-soft",
      isDark ? "rgba(31, 38, 44, 0.92)" : "rgba(248, 244, 237, 0.96)"
    );
    assistUi.host.style.setProperty(
      "--asd-ui-card",
      isDark ? "rgba(31, 38, 44, 0.92)" : "rgba(255, 255, 255, 0.82)"
    );
    assistUi.host.style.setProperty("--asd-ui-fg", theme.fg);
    assistUi.host.style.setProperty("--asd-ui-muted", theme.muted || "#59656b");
    assistUi.host.style.setProperty("--asd-ui-accent", theme.accent);
    assistUi.host.style.setProperty(
      "--asd-ui-accent-soft",
      isDark ? "rgba(138, 182, 214, 0.16)" : "rgba(63, 111, 143, 0.12)"
    );
    assistUi.host.style.setProperty("--asd-ui-border", theme.border || "rgba(63, 111, 143, 0.24)");
  }

  // At most three calm cards: (1) the essence, (2) the one action, (3) cautions.
  // Confidence is a quiet footer line and detail is a collapsed toggle — neither
  // is a card. This keeps the panel low-load and predictable for ASD/ADHD readers.
  function renderUnifiedSummary(container, response, text) {
    const result = response && typeof response === "object" ? response : {};
    const keyPoints = Array.isArray(result.keyPoints) ? result.keyPoints : [];
    const watchOut = Array.isArray(result.watchOut) ? result.watchOut : [];
    const moreDetail = Array.isArray(result.moreDetail) ? result.moreDetail : [];

    if (result.bottomLine || keyPoints.length > 0) {
      const card = createCard();
      if (result.bottomLine) {
        const lead = document.createElement("p");
        lead.className = "lead";
        lead.textContent = normalizeText(result.bottomLine, 400);
        card.append(lead);
      }
      if (keyPoints.length > 0) card.append(createBulletList(keyPoints));
      container.append(card);
    }

    if (result.doThisNext) {
      const card = createCard("action");
      card.append(createLabel(text.doThisNext));
      const paragraph = document.createElement("p");
      paragraph.textContent = normalizeText(result.doThisNext, 400);
      card.append(paragraph);
      container.append(card);
    }

    if (watchOut.length > 0) {
      const card = createCard("caution");
      card.append(createLabel(text.watchOut));
      card.append(createBulletList(watchOut));
      container.append(card);
    }

    if (result.confidenceNote) {
      const note = document.createElement("p");
      note.className = "confidence";
      note.textContent = normalizeText(result.confidenceNote, 400);
      container.append(note);
    }

    if (moreDetail.length > 0) container.append(createDetailsSection(text.moreDetail, moreDetail));

    if (!container.childElementCount) container.append(createMessage(text.noItems));
  }

  function createCard(variant) {
    const card = document.createElement("section");
    card.className = variant ? `card ${variant}` : "card";
    return card;
  }

  function createLabel(value) {
    const label = document.createElement("p");
    label.className = "label";
    label.textContent = value;
    return label;
  }

  function createBulletList(items) {
    const list = document.createElement("ul");
    items.slice(0, 5).forEach((item) => {
      const element = document.createElement("li");
      element.textContent = normalizeText(item || "", 300);
      list.append(element);
    });
    return list;
  }

  function createDetailsSection(label, items) {
    const details = document.createElement("details");
    details.className = "more-detail";
    const summary = document.createElement("summary");
    summary.textContent = label;
    details.append(summary);
    details.append(createBulletList(items));
    return details;
  }

  function createMessage(message) {
    const paragraph = document.createElement("p");
    paragraph.className = "message";
    paragraph.textContent = message;
    return paragraph;
  }

  function createLoadingIndicator(message) {
    const wrap = document.createElement("div");
    wrap.className = "message loading";

    const label = document.createElement("span");
    label.textContent = message;

    const dots = document.createElement("span");
    dots.className = "dots";
    dots.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index += 1) dots.append(document.createElement("i"));

    wrap.append(label, dots);
    return wrap;
  }

  function createRetryButton(requestType, text) {
    const actions = document.createElement("div");
    actions.className = "actions";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "retry";
    button.textContent = text.retry;
    button.addEventListener("click", () => {
      button.disabled = true;
      retryAiRequest(requestType);
    });

    actions.append(button);
    return actions;
  }

  function retryAiRequest(requestType) {
    const typeByRequest = {
      selection: MESSAGE_TYPES.explainSelection,
      page: MESSAGE_TYPES.explainPage,
      form: MESSAGE_TYPES.explainForm
    };
    const type = typeByRequest[requestType];
    if (!type) return;

    try {
      chrome.runtime.sendMessage({ type }, () => {
        void chrome.runtime.lastError;
      });
    } catch (error) {
      if (isExtensionContextInvalidationError(error)) {
        handleExtensionContextInvalidation();
      }
    }
  }

  function getPanelTitle(requestType, text) {
    if (requestType === "form") return text.formTitle;
    if (requestType === "page") return text.pageTitle;
    return text.selectionTitle;
  }

  function getPanelText() {
    const locale = resolveLocale(syncSettings.uiLanguage);
    return PANEL_TEXT[locale] || PANEL_TEXT.en;
  }

  function getCurrentSiteOverride() {
    const origin = activeOrigin || normalizeOrigin(globalThis.location?.origin);
    const overrides = siteOverrides && typeof siteOverrides === "object" ? siteOverrides : {};
    return normalizeSiteOverride(origin ? overrides[origin] : null);
  }

  function normalizeOrigin(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      return /^https?:$/i.test(url.protocol) ? url.origin : "";
    } catch {
      return "";
    }
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve) => {
      if (!isExtensionContextAvailable()) {
        handleExtensionContextInvalidation();
        resolve(null);
        return;
      }

      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (!isExtensionContextAvailable()) {
            handleExtensionContextInvalidation();
            resolve(null);
            return;
          }

          if (chrome.runtime.lastError) {
            if (/Extension context invalidated/i.test(chrome.runtime.lastError.message || "")) {
              handleExtensionContextInvalidation();
            }
            resolve(null);
            return;
          }
          resolve(response || null);
        });
      } catch {
        handleExtensionContextInvalidation();
        resolve(null);
      }
    });
  }

  function isExtensionContextAvailable() {
    if (!extensionContextAvailable) return false;

    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  function handleExtensionContextInvalidation() {
    if (!extensionContextAvailable) return;

    extensionContextAvailable = false;
    hideAssistPanel();
  }

  function isExtensionContextInvalidationError(error) {
    return /Extension context invalidated/i.test(String(error?.message || error || ""));
  }

  function normalizeSettings(value = {}) {
    const settings = { ...DEFAULT_SETTINGS, ...safeObject(value) };
    settings.enabled = normalizeBoolean(settings.enabled, DEFAULT_SETTINGS.enabled);
    settings.readableFontEnabled = normalizeBoolean(settings.readableFontEnabled, DEFAULT_SETTINGS.readableFontEnabled);
    settings.reduceContrastEnabled = normalizeBoolean(settings.reduceContrastEnabled, DEFAULT_SETTINGS.reduceContrastEnabled);
    settings.readerMode = normalizeBoolean(settings.readerMode, DEFAULT_SETTINGS.readerMode);
    settings.communityAssistEnabled = normalizeBoolean(settings.communityAssistEnabled, DEFAULT_SETTINGS.communityAssistEnabled);
    settings.adRemovalEnabled = normalizeBoolean(settings.adRemovalEnabled, DEFAULT_SETTINGS.adRemovalEnabled);
    settings.reduceMotion = normalizeBoolean(settings.reduceMotion, DEFAULT_SETTINGS.reduceMotion);
    settings.muteAutoplay = normalizeBoolean(settings.muteAutoplay, DEFAULT_SETTINGS.muteAutoplay);
    settings.imageSofteningEnabled = normalizeBoolean(settings.imageSofteningEnabled, DEFAULT_SETTINGS.imageSofteningEnabled);
    settings.readingRuler = normalizeBoolean(settings.readingRuler, DEFAULT_SETTINGS.readingRuler);
    settings.focusSpotlight = normalizeBoolean(settings.focusSpotlight, DEFAULT_SETTINGS.focusSpotlight);
    settings.readingProgress = normalizeBoolean(settings.readingProgress, DEFAULT_SETTINGS.readingProgress);
    settings.readerChunking = normalizeBoolean(settings.readerChunking, DEFAULT_SETTINGS.readerChunking);
    settings.focusSpotlightScope = settings.focusSpotlightScope === "line" ? "line" : "paragraph";
    settings.aiHelperEnabled = normalizeBoolean(settings.aiHelperEnabled, DEFAULT_SETTINGS.aiHelperEnabled);
    settings.aiGentleSuggestions = normalizeBoolean(settings.aiGentleSuggestions, DEFAULT_SETTINGS.aiGentleSuggestions);
    settings.showActiveStateIndicator = normalizeBoolean(
      settings.showActiveStateIndicator,
      DEFAULT_SETTINGS.showActiveStateIndicator
    );
    settings.showQuickToggle = normalizeBoolean(settings.showQuickToggle, DEFAULT_SETTINGS.showQuickToggle);
    settings.themePreset = settings.themePreset === "original" || THEMES[settings.themePreset]
      ? settings.themePreset
      : DEFAULT_SETTINGS.themePreset;
    if (
      ["minimal-safe", "text-focused", "motion-minimal"].includes(settings.activeComfortPreset) &&
      settings.themePreset === "soft-light"
    ) {
      settings.themePreset = "original";
    }
    settings.pageDensity = normalizePageDensity(settings.pageDensity);
    settings.imageSofteningStrength = normalizeImageSofteningStrength(settings.imageSofteningStrength);
    settings.textScale = clampInteger(settings.textScale, 80, 140, DEFAULT_SETTINGS.textScale);
    settings.lineHeight = clampNumber(settings.lineHeight, 1.4, 2.1, DEFAULT_SETTINGS.lineHeight);
    settings.letterSpacing = clampNumber(settings.letterSpacing, 0, 0.12, DEFAULT_SETTINGS.letterSpacing);
    settings.wordSpacing = clampNumber(settings.wordSpacing, 0, 0.5, DEFAULT_SETTINGS.wordSpacing);
    settings.readingWidth = normalizeReadingWidth(settings.readingWidth);
    return settings;
  }

  function normalizeReadingWidth(value) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(100, Math.max(45, parsed));
  }

  function normalizeSiteOverrides(value = {}) {
    const result = {};
    for (const [origin, override] of Object.entries(safeObject(value))) {
      result[origin] = normalizeSiteOverride(override);
    }
    return result;
  }

  function normalizeSiteOverride(value = {}) {
    const override = { ...DEFAULT_SITE_OVERRIDE, ...safeObject(value) };
    return Object.fromEntries(
      Object.entries(DEFAULT_SITE_OVERRIDE).map(([key, fallback]) => [
        key,
        normalizeBoolean(override[key], fallback)
      ])
    );
  }

  function onBodyReady(callback) {
    if (document.body) {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  }

  function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function normalizeBoolean(value, fallback) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return Boolean(fallback);
  }

  function clampInteger(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizePageDensity(value) {
    if (value === "compact" || value === "spacious") return value;
    return "normal";
  }

  function normalizeImageSofteningStrength(value) {
    if (value === "low" || value === "high") return value;
    return "medium";
  }

  function resolveImageSofteningBlur(value) {
    if (value === "low") return "4px";
    if (value === "high") return "12px";
    return "8px";
  }

  function hasReadableText(element) {
    const text = normalizeText(element.textContent || "", 240);
    if (text.length < 2) return false;

    const tagName = element.tagName;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"].includes(tagName)) return false;
    if (element.closest("button, input, textarea, select")) return false;
    return true;
  }

  function resolveRenderedBackground(element) {
    let node = element;

    while (node instanceof Element) {
      const background = parseCssColor(getComputedStyle(node).backgroundColor);
      if (background && background.alpha > 0.92) {
        return background;
      }
      node = node.parentElement;
    }

    return getThemeFallbackBackground();
  }

  function getThemeFallbackBackground() {
    const background = parseCssColor(getComputedStyle(document.body || document.documentElement).backgroundColor);
    if (background) return background;

    const theme = THEMES[syncSettings.themePreset] || THEMES["soft-light"];
    return parseHexColor(theme.bg) || { red: 250, green: 247, blue: 240, alpha: 1 };
  }

  function parseCssColor(value) {
    if (typeof value !== "string") return null;
    const match = value.trim().match(/^rgba?\(([^)]+)\)$/i);
    if (!match) return null;

    const parts = match[1].split(",").map((item) => item.trim());
    if (parts.length < 3) return null;

    const red = Number.parseFloat(parts[0]);
    const green = Number.parseFloat(parts[1]);
    const blue = Number.parseFloat(parts[2]);
    const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

    if (![red, green, blue, alpha].every((part) => Number.isFinite(part))) return null;
    return { red, green, blue, alpha };
  }

  function parseHexColor(value) {
    const normalized = String(value || "").trim();
    const match = normalized.match(/^#([0-9a-f]{6})$/i);
    if (!match) return null;

    const hex = match[1];
    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16),
      alpha: 1
    };
  }

  function contrastRatio(foreground, background) {
    const fg = relativeLuminance(foreground);
    const bg = relativeLuminance(background);
    const lighter = Math.max(fg, bg);
    const darker = Math.min(fg, bg);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function relativeLuminance(color) {
    const channels = [color.red, color.green, color.blue].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function normalizeText(value, maxLength) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function resolveLocale(value) {
    if (value === "ko" || value === "en") return value;
    return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
  }

  function isVisibleElement(element) {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function isExtensionUiElement(element) {
    return Boolean(
      element.id === ASSIST_UI_HOST_ID ||
        element.closest(`#${ASSIST_UI_HOST_ID}`) ||
        element.closest(`.${IMAGE_SOFTENING_UNLOCK_BUTTON_CLASS}`) ||
        element.closest(".asd-foundation-indicator") ||
        element.closest(".asd-foundation-ruler")
    );
  }

  function escapeSelector(value) {
    try {
      return CSS.escape(value);
    } catch {
      return value.replace(/["\\]/g, "");
    }
  }
})();
