const DEFAULT_EXTENSION_ID = "nibpcfbgiokcjajcglmappiehobcljjj";

export function resolveAllowedExtensionOrigins(rawValue, options = {}) {
  const fixedExtensionId = options.fixedExtensionId || DEFAULT_EXTENSION_ID;
  const allowAnyByDefault = options.allowAnyExtensionOriginByDefault !== false;
  const tokens = String(rawValue || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const exactOrigins = tokens
    .filter((item) => item.startsWith("chrome-extension://") && item !== "chrome-extension://*")
    .map((item) => item.replace(/\/+$/, ""));
  const wildcardConfigured = tokens.some((item) =>
    item === "*" || item === "any" || item === "chrome-extension://*"
  );

  if (wildcardConfigured || (exactOrigins.length === 0 && allowAnyByDefault)) {
    return {
      allowAnyExtensionOrigin: true,
      origins: new Set(exactOrigins)
    };
  }

  return {
    allowAnyExtensionOrigin: false,
    origins: new Set(exactOrigins.length > 0 ? exactOrigins : [`chrome-extension://${fixedExtensionId}`])
  };
}

export function resolveAllowedOrigin(origin, extensionPolicy, port = 8787) {
  if (!origin) return null;
  if (isAllowedExtensionOrigin(origin, extensionPolicy)) return origin;
  if (origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`) return origin;
  return false;
}

export function isAllowedExtensionOrigin(origin, extensionPolicy) {
  if (!isChromeExtensionOrigin(origin)) return false;
  if (extensionPolicy?.allowAnyExtensionOrigin) return true;
  return Boolean(extensionPolicy?.origins?.has(origin));
}

export function normalizeEnvBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return Boolean(fallback);
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return Boolean(fallback);
}

function isChromeExtensionOrigin(origin) {
  return /^chrome-extension:\/\/[a-p]{32}$/i.test(String(origin || ""));
}
