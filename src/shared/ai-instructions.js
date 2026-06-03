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
    "Put a clear reminder in do_this_next to verify visible details before submitting, paying, uploading, or changing account/security settings."
  ].join(" ");
}

// Shared output contract for every action. The reader is autistic and/or has ADHD,
// so the shape is fixed and minimal: one bottom line, at most three ranked points,
// one concrete next action, watch-outs (including the literal meaning of any
// figurative/ambiguous wording), optional collapsed detail, and an honesty note.
function buildSharedOutputRules(preferredResponseLanguage) {
  return [
    "You write for a reader who is autistic and/or has ADHD. They want low ambiguity, low reading load, and a clear bottom line.",
    `Always write every field in ${preferredResponseLanguage || "English"}.`,
    "Use short sentences and plain, everyday words. One idea per item. No jargon, no filler, no marketing tone.",
    "bottom_line: ONE sentence with the single most important takeaway, stated literally. This comes first and must stand on its own.",
    "key_points: at most 3 items, most important first, each under ~12 words. Fewer is better. Do not pad to reach 3.",
    "do_this_next: exactly one concrete next action the reader can take now. If nothing is required, say that plainly (for example, \"Nothing to do — this is for reading.\").",
    "watch_out: only genuinely important cautions. ALSO restate any idiom, sarcasm, figurative, or ambiguous wording in literal terms, formatted like \"'phrase' = plain meaning\". Use an empty array if there is nothing.",
    "more_detail: secondary notes only, for someone who wants more after the essentials. Use an empty array rather than repeating the points above.",
    "confidence_note: one short line saying whether this is based only on visible text or includes interpretation.",
    "Never invent content that is not supported by what you were given. If evidence is thin, say so instead of guessing.",
    "Return only schema-compliant JSON."
  ];
}

export function buildSelectionInstructions(context) {
  const sensitiveInstruction = getSensitiveContextInstruction(context, [
    context.selectionText,
    context.surroundingText
  ]);
  return [
    "Task: explain a piece of text the reader selected on a web page.",
    "bottom_line is the plain meaning of the selected text in one sentence.",
    "key_points are the main ideas inside the selection. do_this_next is what the text asks the reader to do, if anything.",
    "watch_out must spell out any confusing, figurative, or double-meaning wording in the selection.",
    ...buildSharedOutputRules(context.preferredResponseLanguage),
    sensitiveInstruction
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
    context.surroundingText || "(none)"
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
    "Task: summarize what this web page is actually about, so the reader can grasp the content without reading all of it.",
    "The page's readable content is provided in main_text. Summarize THAT content. headings, key_actions, and snippets are only minor extra hints.",
    "bottom_line: in one sentence, the page's actual topic or purpose — what it is about, not how it is laid out.",
    "key_points: the most important things the page actually says — facts, ideas, or takeaways from the content.",
    "do_this_next: the single most useful next action for the reader (often the main thing worth reading). If nothing specific is needed, say so plainly.",
    "watch_out: genuine cautions, plus any figurative or ambiguous wording explained literally. more_detail: secondary topics or sections from the content.",
    "Do NOT describe the page's structure or controls. Never write things like \"a heading is visible\", \"a button is shown\", or \"the rest of the content is not visible\". Summarize the content itself.",
    "On community pages, describe only the visible posts or comments and never claim whole-community consensus.",
    ...buildSharedOutputRules(context.preferredResponseLanguage),
    sensitiveInstruction
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
    "Task: explain a form from its visible structure.",
    "bottom_line is what the form is for, in one sentence. key_points are the fields the reader most needs to fill (required first).",
    "do_this_next is how to proceed or submit safely. watch_out covers fields whose required status is unclear, time-sensitive notes, and sensitive cautions; more_detail can list optional fields or extra steps.",
    "Never assume typed values or hidden state. If required status is unclear, put it in watch_out instead of claiming certainty.",
    ...buildSharedOutputRules(context.preferredResponseLanguage),
    sensitiveInstruction
  ].filter(Boolean).join(" ");
}
