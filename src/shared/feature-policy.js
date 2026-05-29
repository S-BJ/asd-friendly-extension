export const FEATURE_KEYS = Object.freeze({
  enabled: "enabled",
  reduceMotion: "reduceMotion",
  muteAutoplay: "muteAutoplay",
  themePreset: "themePreset",
  textScale: "textScale",
  lineHeight: "lineHeight",
  readableFont: "readableFontEnabled",
  reduceContrast: "reduceContrastEnabled",
  readerMode: "readerMode",
  communityAssist: "communityAssistEnabled",
  adRemoval: "adRemovalEnabled",
  readingRuler: "readingRuler",
  focusSpotlight: "focusSpotlight",
  readingProgress: "readingProgress",
  letterSpacing: "letterSpacing",
  readingWidth: "readingWidth",
  readerChunking: "readerChunking",
  imageSoftening: "imageSofteningEnabled",
  aiHelper: "aiHelperEnabled",
  aiGentleSuggestions: "aiGentleSuggestions",
  activeStateIndicator: "showActiveStateIndicator",
  quickToggle: "showQuickToggle"
});

export const FEATURE_DEFAULT_POLICY = Object.freeze({
  [FEATURE_KEYS.enabled]: {
    defaultEnabled: true,
    globalToggle: true,
    siteOverride: true,
    evidence: "core-control"
  },
  [FEATURE_KEYS.reduceMotion]: {
    defaultEnabled: true,
    globalToggle: true,
    siteOverride: true,
    evidence: "strong-support"
  },
  [FEATURE_KEYS.muteAutoplay]: {
    defaultEnabled: true,
    globalToggle: true,
    siteOverride: true,
    evidence: "strong-support"
  },
  [FEATURE_KEYS.readerMode]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "page-type-dependent"
  },
  [FEATURE_KEYS.readableFont]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "readability-support-preference-varies"
  },
  [FEATURE_KEYS.reduceContrast]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "individual-preference"
  },
  [FEATURE_KEYS.communityAssist]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "useful-for-dense-pages-preserve-order"
  },
  [FEATURE_KEYS.adRemoval]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "useful-but-site-fragile"
  },
  [FEATURE_KEYS.readingRuler]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: false,
    evidence: "individual-preference"
  },
  [FEATURE_KEYS.focusSpotlight]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "plausible-place-keeping"
  },
  [FEATURE_KEYS.readingProgress]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "time-blindness-support"
  },
  [FEATURE_KEYS.letterSpacing]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: false,
    evidence: "readability-support-preference-varies"
  },
  [FEATURE_KEYS.readingWidth]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: false,
    evidence: "readability-support-preference-varies"
  },
  [FEATURE_KEYS.readerChunking]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: false,
    evidence: "segment-content"
  },
  [FEATURE_KEYS.imageSoftening]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "plausible-high-variance"
  },
  [FEATURE_KEYS.aiHelper]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: true,
    evidence: "core-product-layer"
  },
  [FEATURE_KEYS.aiGentleSuggestions]: {
    defaultEnabled: true,
    globalToggle: true,
    siteOverride: true,
    evidence: "confirmed-direction-dismissible"
  },
  [FEATURE_KEYS.activeStateIndicator]: {
    defaultEnabled: true,
    globalToggle: true,
    siteOverride: false,
    evidence: "reduces-surprise"
  },
  [FEATURE_KEYS.quickToggle]: {
    defaultEnabled: false,
    globalToggle: true,
    siteOverride: false,
    evidence: "convenience-opt-in"
  }
});

export function isSiteOverrideable(featureKey) {
  return Boolean(FEATURE_DEFAULT_POLICY[featureKey]?.siteOverride);
}
