import { DEFAULT_SITE_OVERRIDE, normalizeSiteOverride, originFromUrl } from "../shared/settings.js";

export function getSiteOverride(siteOverrides, pageUrl) {
  const origin = originFromUrl(pageUrl);
  if (!origin) return DEFAULT_SITE_OVERRIDE;
  return normalizeSiteOverride(siteOverrides?.[origin]);
}

export function setSiteOverride(siteOverrides, origin, override) {
  if (!origin) return { ...siteOverrides };
  return {
    ...siteOverrides,
    [origin]: normalizeSiteOverride(override)
  };
}

export function clearSiteOverride(siteOverrides, origin) {
  const nextOverrides = { ...siteOverrides };
  delete nextOverrides[origin];
  return nextOverrides;
}

