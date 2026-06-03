export function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

export function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  return false;
}

export function clampNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizePageProfile(value) {
  if (value === "reader" || value === "portal" || value === "community" || value === "form") {
    return value;
  }
  return "generic";
}

export function normalizeCommunitySubtype(value) {
  if (value === "board-list" || value === "feed" || value === "thread" || value === "comment-section") {
    return value;
  }
  return "none";
}

export function normalizeCommunityItemKind(value) {
  if (value === "post" || value === "comment" || value === "reply" || value === "notice" || value === "control") {
    return value;
  }
  return "metadata";
}

export function normalizeCommunityItemInput(item) {
  if (!item || typeof item !== "object") return null;

  const kind = normalizeCommunityItemKind(item.kind);
  const text = normalizeText(item.text, 300);
  const position = clampNumber(item.position, 0, 0, 10_000);

  if (!text) return null;

  return { kind, text, position };
}

export function normalizeFormFieldInput(field) {
  if (!field || typeof field !== "object") return null;

  const label = normalizeText(field.label, 120);
  const type = normalizeText(field.type, 40);
  const placeholder = normalizeText(field.placeholder, 120);
  const nearbyHelpText = normalizeText(field.nearbyHelpText, 220);
  const required = normalizeBoolean(field.required);

  if (!label && !type && !placeholder) return null;

  return { label, type, required, placeholder, nearbyHelpText };
}

export function normalizeSelectionContext(context) {
  const value = safeObject(context);
  return {
    selectionText: normalizeText(value.selectionText, 2000),
    surroundingText: normalizeText(value.surroundingText, 2500),
    pageTitle: normalizeText(value.pageTitle, 200),
    pageUrl: normalizeText(value.pageUrl, 400),
    pageLanguage: normalizeText(value.pageLanguage, 32),
    browserLanguage: normalizeText(value.browserLanguage, 32),
    preferredResponseLanguage: normalizeText(value.preferredResponseLanguage, 32),
    preferredResponseLanguageCode: normalizeText(value.preferredResponseLanguageCode, 12)
  };
}

export function normalizePageContext(context) {
  const value = safeObject(context);
  return {
    pageTitle: normalizeText(value.pageTitle, 200),
    pageUrl: normalizeText(value.pageUrl, 400),
    pageProfile: normalizePageProfile(value.pageProfile),
    communitySubtype: normalizeCommunitySubtype(value.communitySubtype),
    mainText: normalizeText(value.mainText, 6000),
    visibleHeadings: normalizeStringArray(value.visibleHeadings, 10, 120),
    keyActions: normalizeStringArray(value.keyActions, 12, 120),
    importantTextSnippets: normalizeStringArray(value.importantTextSnippets, 10, 280),
    visibleCommunityItems: Array.isArray(value.visibleCommunityItems)
      ? value.visibleCommunityItems.map(normalizeCommunityItemInput).filter(Boolean).slice(0, 12)
      : [],
    browserLanguage: normalizeText(value.browserLanguage, 32),
    preferredResponseLanguage: normalizeText(value.preferredResponseLanguage, 32),
    preferredResponseLanguageCode: normalizeText(value.preferredResponseLanguageCode, 12)
  };
}

export function normalizeFormContext(context) {
  const value = safeObject(context);
  return {
    pageTitle: normalizeText(value.pageTitle, 200),
    pageUrl: normalizeText(value.pageUrl, 400),
    formTitle: normalizeText(value.formTitle, 160),
    fields: Array.isArray(value.fields)
      ? value.fields.map(normalizeFormFieldInput).filter(Boolean).slice(0, 20)
      : [],
    buttons: normalizeStringArray(value.buttons, 12, 80),
    warnings: normalizeStringArray(value.warnings, 12, 180),
    browserLanguage: normalizeText(value.browserLanguage, 32),
    preferredResponseLanguage: normalizeText(value.preferredResponseLanguage, 32),
    preferredResponseLanguageCode: normalizeText(value.preferredResponseLanguageCode, 12)
  };
}

// Selection, page, and form all return the same ASD/ADHD summary shape
// (see ai-schemas.js). One shaper, three names kept for existing import sites.
export function shapeSummaryPayload(parsed) {
  return {
    bottomLine: normalizeText(parsed.bottom_line, 240),
    keyPoints: normalizeStringArray(parsed.key_points, 3, 150),
    doThisNext: normalizeText(parsed.do_this_next, 240),
    watchOut: normalizeStringArray(parsed.watch_out, 5, 220),
    moreDetail: normalizeStringArray(parsed.more_detail, 8, 220),
    confidenceNote: normalizeText(parsed.confidence_note, 220)
  };
}

export const shapeSelectionPayload = shapeSummaryPayload;
export const shapePageSummaryPayload = shapeSummaryPayload;
export const shapeFormPayload = shapeSummaryPayload;
