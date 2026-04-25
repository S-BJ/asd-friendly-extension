import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

const COMMUNITY_HINTS = /\b(board|forum|gallery|subreddit|thread|comment|reply|vote|upvote|downvote|post)\b|\uAC8C\uC2DC\uD310|\uB313\uAE00|\uB2F5\uAE00|\uCD94\uCC9C|\uBE44\uCD94\uCC9C|\uAC24\uB7EC\uB9AC/i;

export function detectCommunityProfile(documentLike = document) {
  const bodyText = normalizeText(documentLike.body?.innerText || "", 3000);
  const linkCount = documentLike.querySelectorAll?.("a[href]")?.length || 0;
  const commentLikeCount = documentLike.querySelectorAll?.('[class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i]')?.length || 0;
  const hasCommunityHints = COMMUNITY_HINTS.test(bodyText);

  if ((commentLikeCount >= 5 || linkCount >= 80) && hasCommunityHints) {
    return createPageProfileResult(PAGE_PROFILES.community, 0.7, "Dense community discussion signals were found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No community profile signal found.");
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
