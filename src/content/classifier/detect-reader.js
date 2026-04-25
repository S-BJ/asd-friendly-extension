import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

export function detectReaderProfile(documentLike = document) {
  const candidates = [...(documentLike.querySelectorAll?.([
    "article",
    "main",
    "[role='main']",
    "[role='article']",
    "[class*='article' i]",
    "[class*='entry-content' i]",
    "[class*='post-content' i]",
    "[class*='content-body' i]",
    "[id*='content' i]"
  ].join(",")) || [])];

  if (candidates.length === 0) {
    return createPageProfileResult(PAGE_PROFILES.generic, 0, "No main reading container found.");
  }

  const bestScore = candidates.reduce((score, candidate) => Math.max(score, scoreReaderCandidate(candidate)), 0);

  if (bestScore >= 1) {
    return createPageProfileResult(PAGE_PROFILES.reader, 0.75, "Strong article-like reading flow found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No strong reader profile signal found.");
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function scoreReaderCandidate(element) {
  const paragraphs = element.querySelectorAll?.("p")?.length || 0;
  const headings = element.querySelectorAll?.("h1, h2, h3")?.length || 0;
  const links = element.querySelectorAll?.("a[href]")?.length || 0;
  const textLength = normalizeText(element.innerText || "", 8000).length;
  const linkHeavy = links > Math.max(10, paragraphs * 8) && textLength < 2200;

  if (linkHeavy || paragraphs < 2 || textLength < 800) return 0;
  if (paragraphs >= 4 && textLength >= 1200) return 1;
  if (paragraphs >= 3 && textLength >= 950 && headings >= 1) return 1;
  if (paragraphs >= 2 && textLength >= 1500 && headings >= 1) return 1;
  return 0;
}
