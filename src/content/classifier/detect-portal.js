import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

export function detectPortalProfile(documentLike = document) {
  const bodyText = normalizeText(documentLike.body?.innerText || "", 6000);
  const links = documentLike.querySelectorAll?.("a[href]")?.length || 0;
  const lists = documentLike.querySelectorAll?.("ul, ol, nav, section")?.length || 0;
  const linkDensity = links / Math.max(bodyText.length / 180, 1);

  if (links >= 60 && lists >= 8 && linkDensity >= 1.2) {
    return createPageProfileResult(PAGE_PROFILES.portal, 0.65, "High link and navigation density found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No portal profile signal found.");
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

