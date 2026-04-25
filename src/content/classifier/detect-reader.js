import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

export function detectReaderProfile(documentLike = document) {
  const article = documentLike.querySelector?.("article, main, [role='main']");
  if (!article) {
    return createPageProfileResult(PAGE_PROFILES.generic, 0, "No main reading container found.");
  }

  const paragraphs = article.querySelectorAll?.("p")?.length || 0;
  const textLength = normalizeText(article.innerText || "", 6000).length;

  if (paragraphs >= 4 && textLength >= 1200) {
    return createPageProfileResult(PAGE_PROFILES.reader, 0.75, "Strong article-like reading flow found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No strong reader profile signal found.");
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

