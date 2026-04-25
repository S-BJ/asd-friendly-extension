export const THEME_PRESETS = Object.freeze({
  original: "original",
  softLight: "soft-light",
  softDark: "soft-dark",
  neutralLowContrast: "neutral-low-contrast"
});

export const IMAGE_SOFTENING_STRENGTHS = Object.freeze({
  low: "low",
  medium: "medium",
  high: "high"
});

export const PAGE_DENSITIES = Object.freeze({
  compact: "compact",
  normal: "normal",
  spacious: "spacious"
});

export const DEFAULT_SYNC_SETTINGS = Object.freeze({
  enabled: true,
  uiLanguage: "auto",
  firstRunComplete: false,
  activeComfortPreset: "minimal-safe",
  themePreset: THEME_PRESETS.original,
  textScale: 100,
  lineHeight: 1.7,
  pageDensity: PAGE_DENSITIES.normal,
  readableFontEnabled: false,
  reduceContrastEnabled: false,
  readerMode: false,
  communityAssistEnabled: false,
  adRemovalEnabled: false,
  reduceMotion: true,
  muteAutoplay: true,
  imageSofteningEnabled: false,
  imageSofteningStrength: IMAGE_SOFTENING_STRENGTHS.medium,
  readingRuler: false,
  aiHelperEnabled: false,
  aiGentleSuggestions: true,
  assistPanelDefaultOpen: false,
  showActiveStateIndicator: true
});

export const DEFAULT_LOCAL_SETTINGS = Object.freeze({
  openAIApiKey: "",
  backendUrl: "",
  siteOverrides: {}
});

export const DEFAULT_SITE_OVERRIDE = Object.freeze({
  disabled: false,
  keepOriginalColors: false,
  keepOriginalFonts: false,
  allowAds: false,
  disableContrastReduction: false,
  allowAutoplay: false,
  disableImageSoftening: false,
  disableAiSuggestions: false,
  disableCommunityAssist: false,
  disableReaderMode: false
});

const BOOLEAN_SYNC_KEYS = Object.freeze([
  "enabled",
  "firstRunComplete",
  "readableFontEnabled",
  "reduceContrastEnabled",
  "readerMode",
  "communityAssistEnabled",
  "adRemovalEnabled",
  "reduceMotion",
  "muteAutoplay",
  "imageSofteningEnabled",
  "readingRuler",
  "aiHelperEnabled",
  "aiGentleSuggestions",
  "assistPanelDefaultOpen",
  "showActiveStateIndicator"
]);

export const COMFORT_PRESETS = Object.freeze({
  "minimal-safe": Object.freeze({
    themePreset: THEME_PRESETS.original,
    pageDensity: PAGE_DENSITIES.normal,
    textScale: 100,
    lineHeight: 1.7,
    readableFontEnabled: false,
    reduceContrastEnabled: false,
    reduceMotion: true,
    muteAutoplay: true,
    adRemovalEnabled: false,
    communityAssistEnabled: false,
    readerMode: false,
    aiHelperEnabled: false,
    showActiveStateIndicator: true
  }),
  "soft-light-calm": Object.freeze({
    themePreset: THEME_PRESETS.softLight,
    pageDensity: PAGE_DENSITIES.normal,
    reduceMotion: true,
    muteAutoplay: true,
    readableFontEnabled: true,
    adRemovalEnabled: true,
    reduceContrastEnabled: true,
    aiGentleSuggestions: true
  }),
  "soft-dark-calm": Object.freeze({
    themePreset: THEME_PRESETS.softDark,
    pageDensity: PAGE_DENSITIES.normal,
    reduceMotion: true,
    muteAutoplay: true,
    readableFontEnabled: true,
    adRemovalEnabled: true,
    reduceContrastEnabled: true,
    aiGentleSuggestions: true
  }),
  "text-focused": Object.freeze({
    themePreset: THEME_PRESETS.original,
    textScale: 110,
    lineHeight: 1.8,
    pageDensity: PAGE_DENSITIES.spacious,
    readableFontEnabled: true,
    reduceContrastEnabled: false,
    reduceMotion: true,
    muteAutoplay: true,
    adRemovalEnabled: true,
    readerMode: false
  }),
  "motion-minimal": Object.freeze({
    themePreset: THEME_PRESETS.original,
    reduceMotion: true,
    muteAutoplay: true,
    readableFontEnabled: true,
    adRemovalEnabled: true,
    reduceContrastEnabled: true,
    aiGentleSuggestions: false
  })
});

export function normalizeSyncSettings(value = {}) {
  const settings = { ...DEFAULT_SYNC_SETTINGS, ...safeObject(value) };
  settings.uiLanguage = normalizeUiLanguage(settings.uiLanguage);
  settings.activeComfortPreset = COMFORT_PRESETS[settings.activeComfortPreset]
    ? settings.activeComfortPreset
    : DEFAULT_SYNC_SETTINGS.activeComfortPreset;
  settings.textScale = clampInteger(settings.textScale, 80, 140, DEFAULT_SYNC_SETTINGS.textScale);
  settings.lineHeight = clampNumber(settings.lineHeight, 1.4, 2.1, DEFAULT_SYNC_SETTINGS.lineHeight);
  settings.pageDensity = normalizeEnum(settings.pageDensity, PAGE_DENSITIES, DEFAULT_SYNC_SETTINGS.pageDensity);
  settings.themePreset = normalizeEnum(settings.themePreset, THEME_PRESETS, DEFAULT_SYNC_SETTINGS.themePreset);
  if (
    ["minimal-safe", "text-focused", "motion-minimal"].includes(settings.activeComfortPreset) &&
    settings.themePreset === THEME_PRESETS.softLight
  ) {
    settings.themePreset = THEME_PRESETS.original;
  }
  settings.imageSofteningStrength = normalizeEnum(
    settings.imageSofteningStrength,
    IMAGE_SOFTENING_STRENGTHS,
    DEFAULT_SYNC_SETTINGS.imageSofteningStrength
  );
  for (const key of BOOLEAN_SYNC_KEYS) {
    settings[key] = normalizeBoolean(settings[key], DEFAULT_SYNC_SETTINGS[key]);
  }
  return settings;
}

export function normalizeLocalSettings(value = {}) {
  const settings = { ...DEFAULT_LOCAL_SETTINGS, ...safeObject(value) };
  settings.openAIApiKey = typeof settings.openAIApiKey === "string" ? settings.openAIApiKey.trim() : "";
  settings.backendUrl = typeof settings.backendUrl === "string" ? settings.backendUrl.trim().replace(/\/+$/, "") : "";
  settings.siteOverrides = normalizeSiteOverrides(settings.siteOverrides);
  return settings;
}

export function normalizeSiteOverrides(value = {}) {
  const result = {};
  for (const [origin, override] of Object.entries(safeObject(value))) {
    if (!isValidOrigin(origin)) continue;
    result[origin] = normalizeSiteOverride(override);
  }
  return result;
}

export function normalizeSiteOverride(value = {}) {
  const override = { ...DEFAULT_SITE_OVERRIDE, ...safeObject(value) };
  return Object.fromEntries(
    Object.entries(DEFAULT_SITE_OVERRIDE).map(([key, defaultValue]) => [key, Boolean(override[key] ?? defaultValue)])
  );
}

export function applyComfortPreset(settings, presetKey, overrides = {}) {
  const preset = COMFORT_PRESETS[presetKey];
  if (!preset) return normalizeSyncSettings(settings);
  return normalizeSyncSettings({
    ...settings,
    ...preset,
    ...safeObject(overrides),
    activeComfortPreset: presetKey,
    firstRunComplete: true
  });
}

export function originFromUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeUiLanguage(value) {
  if (value === "ko" || value === "en") return value;
  return DEFAULT_SYNC_SETTINGS.uiLanguage;
}

function normalizeEnum(value, enumObject, fallback) {
  return Object.values(enumObject).includes(value) ? value : fallback;
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

function isValidOrigin(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.origin === value;
  } catch {
    return false;
  }
}
