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

export function shapeSelectionPayload(parsed) {
  return {
    plainMeaning: normalizeText(parsed.plain_meaning, 500),
    likelyIntent: normalizeText(parsed.likely_intent, 500),
    whatToDoNext: normalizeText(parsed.what_to_do_next, 500),
    saferRewrite: normalizeText(parsed.safer_rewrite, 500),
    confidenceNote: normalizeText(parsed.confidence_note, 220),
    confusingParts: normalizeStringArray(parsed.confusing_parts, 5, 240)
  };
}

export function shapePageSummaryPayload(parsed) {
  return {
    pagePurpose: normalizeText(parsed.page_purpose, 320),
    importantAreas: normalizeStringArray(parsed.important_areas, 5, 160),
    visibleMainActions: normalizeStringArray(parsed.visible_main_actions, 6, 160),
    likelyNextStep: normalizeText(parsed.likely_next_step, 220),
    optionalOrSecondaryAreas: normalizeStringArray(parsed.optional_or_secondary_areas, 5, 160),
    warningsOrConfusingPoints: normalizeStringArray(parsed.warnings_or_confusing_points, 6, 180),
    unknowns: normalizeStringArray(parsed.unknowns, 5, 180),
    confidenceNote: normalizeText(parsed.confidence_note, 220)
  };
}

export function shapeFormPayload(parsed) {
  return {
    formPurpose: normalizeText(parsed.form_purpose, 320),
    requiredFields: normalizeStringArray(parsed.required_fields, 10, 120),
    optionalFields: normalizeStringArray(parsed.optional_fields, 10, 120),
    importantWarnings: normalizeStringArray(parsed.important_warnings, 8, 180),
    timeSensitiveWarnings: normalizeStringArray(parsed.time_sensitive_warnings, 6, 180),
    reviewBeforeSubmit: normalizeStringArray(parsed.review_before_submit, 10, 180),
    suggestedSteps: normalizeStringArray(parsed.suggested_steps, 8, 160),
    confidenceNote: normalizeText(parsed.confidence_note, 220)
  };
}
