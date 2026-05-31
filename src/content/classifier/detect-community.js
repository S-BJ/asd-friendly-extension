import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

const COMMUNITY_HINTS = /\b(board|forum|gallery|subreddit|thread|comment|reply|vote|upvote|downvote|post)\b|\uAC8C\uC2DC\uD310|\uB313\uAE00|\uB2F5\uAE00|\uCD94\uCC9C|\uBE44\uCD94\uCC9C|\uAC24\uB7EC\uB9AC/i;

export function detectCommunityProfile(documentLike = document, { path = "" } = {}) {
  const bodyText = normalizeText(documentLike.body?.innerText || "", 3000);
  const commentLikeCount = documentLike.querySelectorAll?.('[class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i]')?.length || 0;
  const listLikeCount = documentLike.querySelectorAll?.("li, tr, article")?.length || 0;
  const hasCommunityHints = COMMUNITY_HINTS.test(bodyText);
  // Board-index (thread list) pages often have no inline comment widgets, so also
  // accept a community URL token + long list + discussion hint. News/portal fronts
  // lack the path token, so this stays off them.
  const hasBoardPathToken = /\b(board|forum|gallery|bbs|community|gall|cafe)\b/.test(String(path).toLowerCase());
  const looksLikeBoardIndex = hasBoardPathToken && listLikeCount >= 20 && hasCommunityHints;

  // Require real comment/reply widgets (or the board-index signal). A high link
  // count alone matches news/portal fronts whose body text incidentally says "post".
  // (The shipped inline detector additionally short-circuits known community hosts.)
  if ((commentLikeCount >= 5 && hasCommunityHints) || looksLikeBoardIndex) {
    return createPageProfileResult(PAGE_PROFILES.community, 0.7, "Dense community discussion signals were found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No community profile signal found.");
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
