import { detectSensitivePageKind, SENSITIVE_PAGE_KINDS } from "./sensitive-page.js";

export function getSensitiveContextInstruction(context, visibleTextParts = []) {
  const sensitiveKind = detectSensitivePageKind({
    url: context.pageUrl || context.page?.url || "",
    title: [context.pageTitle, context.formTitle, context.page?.title].filter(Boolean).join(" "),
    visibleText: visibleTextParts.filter(Boolean).join(" ")
  });

  if (sensitiveKind === SENSITIVE_PAGE_KINDS.none) return "";

  return [
    `This appears to be a sensitive ${sensitiveKind} page or form.`,
    "Be conservative.",
    "Do not infer hidden state, typed values, identity details, payment details, health details, legal meaning, or personal intent.",
    "Remind the user to verify visible details before submitting, paying, uploading, or changing account/security settings."
  ].join(" ");
}

export function buildSelectionInstructions(context) {
  const sensitiveInstruction = getSensitiveContextInstruction(context, [
    context.selectionText,
    context.surroundingText
  ]);
  return [
    "You explain selected web text in direct, literal, predictable language.",
    "Write for someone who prefers concrete wording and low ambiguity.",
    `Always write the response in ${context.preferredResponseLanguage || "English"}.`,
    "If the text does not contain enough evidence, say so plainly instead of guessing.",
    "Keep each field concise and practical.",
    "Add a short confidence note that says whether the answer comes directly from visible text or includes interpretation.",
    sensitiveInstruction,
    "Return only schema-compliant JSON."
  ].filter(Boolean).join(" ");
}

export function buildSelectionContentText(context) {
  return [
    `Browser language: ${context.browserLanguage || "unknown"}`,
    `Preferred response language: ${context.preferredResponseLanguage || "unknown"} (${context.preferredResponseLanguageCode || "unknown"})`,
    `Page language: ${context.pageLanguage || "unknown"}`,
    `Page title: ${context.pageTitle || "unknown"}`,
    `Page URL: ${context.pageUrl || "unknown"}`,
    "",
    "Selected text:",
    context.selectionText,
    "",
    "Nearby page context:",
    context.surroundingText || "(none)",
    "",
    "Explain the selected text with these goals:",
    "- Say the direct meaning in simpler words.",
    "- Infer the likely intent only when the evidence supports it.",
    "- Suggest the next action only if the text implies one.",
    "- Provide a calmer, more literal rewrite.",
    "- List specific confusing parts, or return an empty list."
  ].join("\n");
}

export function buildPageInstructions(context) {
  const sensitiveInstruction = getSensitiveContextInstruction(context, [
    ...context.visibleHeadings,
    ...context.keyActions,
    ...context.importantTextSnippets,
    ...context.visibleCommunityItems.map((item) => item.text)
  ]);
  return [
    "You explain a webpage in calm, direct language for someone who prefers low ambiguity.",
    `Always write the response in ${context.preferredResponseLanguage || "English"}.`,
    "Only use the visible context that was provided. Do not imply you saw the full page when you did not.",
    "List visible main actions by their labels when available, and say what each appears to do based only on visible text.",
    "Separate likely next steps from optional or secondary areas.",
    "List unknowns where the visible context is not enough to be certain.",
    "If context is incomplete, say that plainly in the confidence note.",
    "On community pages, only describe visible posts or comments and do not claim whole-community consensus.",
    sensitiveInstruction,
    "Return only schema-compliant JSON."
  ].filter(Boolean).join(" ");
}

export function buildFormInstructions(context) {
  const sensitiveInstruction = getSensitiveContextInstruction(context, [
    context.formTitle,
    ...context.fields.flatMap((field) => [field.label, field.type, field.placeholder, field.nearbyHelpText]),
    ...context.buttons,
    ...context.warnings
  ]);
  return [
    "You explain visible form structure in calm, direct language for someone who prefers predictability and low ambiguity.",
    `Always write the response in ${context.preferredResponseLanguage || "English"}.`,
    "Never assume typed values or hidden state.",
    "If required status is unclear, move the item into review before submit instead of claiming certainty.",
    "For payment, account, health, legal, identity, or password forms, be conservative and remind the user to verify visible details before submitting.",
    sensitiveInstruction,
    "Return only schema-compliant JSON."
  ].filter(Boolean).join(" ");
}
