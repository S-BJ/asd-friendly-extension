export const EXPLANATION_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    plain_meaning: { type: "string" },
    likely_intent: { type: "string" },
    what_to_do_next: { type: "string" },
    safer_rewrite: { type: "string" },
    confidence_note: { type: "string" },
    confusing_parts: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "plain_meaning",
    "likely_intent",
    "what_to_do_next",
    "safer_rewrite",
    "confidence_note",
    "confusing_parts"
  ]
});

export const PAGE_SUMMARY_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    page_purpose: { type: "string" },
    important_areas: {
      type: "array",
      items: { type: "string" }
    },
    visible_main_actions: {
      type: "array",
      items: { type: "string" }
    },
    likely_next_step: { type: "string" },
    optional_or_secondary_areas: {
      type: "array",
      items: { type: "string" }
    },
    warnings_or_confusing_points: {
      type: "array",
      items: { type: "string" }
    },
    unknowns: {
      type: "array",
      items: { type: "string" }
    },
    confidence_note: { type: "string" }
  },
  required: [
    "page_purpose",
    "important_areas",
    "visible_main_actions",
    "likely_next_step",
    "optional_or_secondary_areas",
    "warnings_or_confusing_points",
    "unknowns",
    "confidence_note"
  ]
});

export const FORM_EXPLANATION_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    form_purpose: { type: "string" },
    required_fields: {
      type: "array",
      items: { type: "string" }
    },
    optional_fields: {
      type: "array",
      items: { type: "string" }
    },
    important_warnings: {
      type: "array",
      items: { type: "string" }
    },
    time_sensitive_warnings: {
      type: "array",
      items: { type: "string" }
    },
    review_before_submit: {
      type: "array",
      items: { type: "string" }
    },
    suggested_steps: {
      type: "array",
      items: { type: "string" }
    },
    confidence_note: { type: "string" }
  },
  required: [
    "form_purpose",
    "required_fields",
    "optional_fields",
    "important_warnings",
    "time_sensitive_warnings",
    "review_before_submit",
    "suggested_steps",
    "confidence_note"
  ]
});
