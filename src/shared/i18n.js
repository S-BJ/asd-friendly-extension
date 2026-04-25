export const SUPPORTED_LOCALES = Object.freeze(["en", "ko"]);
export const DEFAULT_LOCALE = "en";

export function resolveLocale(value, browserLanguage = "") {
  const explicit = normalizeLocale(value);
  if (explicit && explicit !== "auto") return explicit;

  const browserLocale = normalizeLocale(browserLanguage);
  return browserLocale || DEFAULT_LOCALE;
}

function normalizeLocale(value) {
  if (typeof value !== "string") return "";
  const normalized = value.toLowerCase();
  if (normalized === "auto") return "auto";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("en")) return "en";
  return "";
}

