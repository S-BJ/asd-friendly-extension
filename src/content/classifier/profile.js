import { PAGE_PROFILES, normalizePageProfile } from "../../shared/page-profile.js";

export function createPageProfileResult(profile, confidence = 0, reason = "") {
  return {
    profile: normalizePageProfile(profile),
    confidence: clampConfidence(confidence),
    reason: typeof reason === "string" ? reason : ""
  };
}

export function createGenericProfile(reason = "No stronger page profile matched.") {
  return createPageProfileResult(PAGE_PROFILES.generic, 0.25, reason);
}

function clampConfidence(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1, Math.max(0, parsed));
}

