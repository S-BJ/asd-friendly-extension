import { PAGE_PROFILES } from "../../shared/page-profile.js";
import { createPageProfileResult } from "./profile.js";

const TASK_FORM_HINTS =
  /\b(login|sign in|signin|sign-in|signup|register|checkout|payment|billing|apply|password|account|security|verify)\b|\uB85C\uADF8\uC778|\uAC00\uC785|\uACB0\uC81C|\uC2E0\uCCAD|\uBE44\uBC00\uBC88\uD638|\uBCF8\uC778\s*(\uC778\uC99D|\uD655\uC778)/i;
const UPLOAD_TASK_HINTS =
  /\b(upload|attach|attachment|choose file|select file|file picker|apply|verify|submit document|id photo|passport photo)\b|\uC5C5\uB85C\uB4DC|\uCCA8\uBD80|\uD30C\uC77C\s*(\uC120\uD0DD|\uC81C\uCD9C)|\uC2E0\uCCAD|\uBCF8\uC778\s*(\uC778\uC99D|\uD655\uC778)|\uC2E0\uBD84\uC99D|\uC5EC\uAD8C/i;
const COMMUNITY_ROUTINE_FORM_HINTS =
  /(^|[\s_-])(comment|reply|search|keyword|filter|sort|login|signin|sign-in|nickname|memo|captcha|write|post|sch|q|search_type|search_keyword|s_keyword|cmt)([\s_-]|$)|\uB313\uAE00|\uB2F5\uAE00|\uAC80\uC0C9|\uB85C\uADF8\uC778|\uB2C9\uB124\uC784|\uBE44\uBC00\uBC88\uD638|\uCCA8\uBD80|\uD30C\uC77C|\uC791\uC131|\uB4F1\uB85D|\uAE00\uC4F0\uAE30/i;
const HIGH_RISK_FORM_HINTS =
  /\b(checkout|payment|billing|credit card|card number|apply|verify identity|passport|driver license|ssn|security settings|change password)\b|\uACB0\uC81C|\uCE74\uB4DC|\uACC4\uC88C|\uC2E0\uCCAD|\uBCF8\uC778\s*(\uC778\uC99D|\uD655\uC778)|\uC2E0\uBD84\uC99D|\uC5EC\uAD8C|\uC8FC\uBBFC\uB4F1\uB85D|\uBCF4\uC548|\uBE44\uBC00\uBC88\uD638\s*\uBCC0\uACBD/i;
const SENSITIVE_FIELD_SELECTOR = [
  'input[type="password"]',
  'input[autocomplete*="password" i]',
  'input[autocomplete*="cc-" i]',
  'input[name*="password" i]',
  'input[name*="card" i]',
  'input[name*="birth" i]',
  'input[name*="passport" i]',
  'input[name*="license" i]',
  'input[name*="ssn" i]',
  'input[name*="\uC8FC\uBBFC" i]'
].join(",");

export function detectFormProfile(documentLike = document, { communityMatched = false } = {}) {
  const forms = [...(documentLike.querySelectorAll?.("form") || [])];
  const sensitiveFields = [...(documentLike.querySelectorAll?.(SENSITIVE_FIELD_SELECTOR) || [])].filter(
    (field) => !(communityMatched && isCommunityRoutineField(field))
  );
  const candidateForms = communityMatched ? forms.filter((form) => !isCommunityRoutineForm(form)) : forms;
  const taskForms = candidateForms.filter((form) => {
    const fields = form.querySelectorAll?.("input, select, textarea")?.length || 0;
    if (fields < 2) return false;

    const formText = getFormText(form);
    const hasPasswordField = Boolean(form.querySelector?.('input[type="password"], input[autocomplete*="password" i]'));
    const hasFileUploadTask = Boolean(form.querySelector?.('input[type="file"]')) && UPLOAD_TASK_HINTS.test(formText);
    return TASK_FORM_HINTS.test(formText) || hasPasswordField || hasFileUploadTask;
  });

  if (sensitiveFields.length > 0 || taskForms.length > 0) {
    return createPageProfileResult(PAGE_PROFILES.form, 0.75, "Task-oriented form signals were found.");
  }

  return createPageProfileResult(PAGE_PROFILES.generic, 0, "No high-risk form profile signal found.");
}

function isCommunityRoutineForm(form) {
  if (!form) return false;
  const haystack = getFormText(form);
  return COMMUNITY_ROUTINE_FORM_HINTS.test(haystack) && !HIGH_RISK_FORM_HINTS.test(haystack);
}

function isCommunityRoutineField(field) {
  if (!field) return false;
  if (isCommunityRoutineForm(field.closest?.("form"))) return true;

  const container = field.closest?.(
    '[class*="comment" i], [id*="comment" i], [class*="reply" i], [id*="reply" i], [class*="cmt" i], [id*="cmt" i], .view_comment, .cmt_write_box'
  );
  if (!container) return false;

  const haystack = normalizeText(
    [
      field.id || "",
      field.className || "",
      field.getAttribute?.("name") || "",
      field.getAttribute?.("placeholder") || "",
      field.getAttribute?.("aria-label") || "",
      container.id || "",
      container.className || "",
      container.innerText || container.textContent || ""
    ].join(" "),
    1600
  );
  return COMMUNITY_ROUTINE_FORM_HINTS.test(haystack) && !HIGH_RISK_FORM_HINTS.test(haystack);
}

function getFormText(form) {
  return normalizeText(
    [
      form.id || "",
      form.className || "",
      form.getAttribute?.("role") || "",
      form.getAttribute?.("aria-label") || "",
      form.getAttribute?.("action") || "",
      form.innerText || "",
      [...(form.querySelectorAll?.("input, textarea, select") || [])]
        .map((control) =>
          [
            control.getAttribute?.("aria-label") || "",
            control.getAttribute?.("placeholder") || "",
            control.getAttribute?.("name") || "",
            control.getAttribute?.("id") || ""
          ].join(" ")
        )
        .join(" "),
      [...(form.querySelectorAll?.("button, input[type='submit'], input[type='button']") || [])]
        .map((control) => control.innerText || control.value || control.getAttribute?.("aria-label") || "")
        .join(" ")
    ].join(" "),
    1600
  );
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
