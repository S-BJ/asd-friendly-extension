// One ASD/ADHD-tuned summary shape, shared by the selection, page, and form
// actions so the on-page panel always renders the same calm, predictable layout:
//   - bottom_line: the single most important takeaway, first (BLUF)
//   - key_points: at most 3, ordered most-important-first
//   - do_this_next: one concrete action (or an explicit "nothing required")
//   - watch_out: real warnings + the literal meaning of figurative/ambiguous wording
//   - more_detail: secondary notes, shown collapsed (progressive disclosure)
//   - confidence_note: short uncertainty marker
const SUMMARY_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    bottom_line: { type: "string" },
    key_points: {
      type: "array",
      items: { type: "string" }
    },
    do_this_next: { type: "string" },
    watch_out: {
      type: "array",
      items: { type: "string" }
    },
    more_detail: {
      type: "array",
      items: { type: "string" }
    },
    confidence_note: { type: "string" }
  },
  required: [
    "bottom_line",
    "key_points",
    "do_this_next",
    "watch_out",
    "more_detail",
    "confidence_note"
  ]
});

export { SUMMARY_SCHEMA };
export const EXPLANATION_SCHEMA = SUMMARY_SCHEMA;
export const PAGE_SUMMARY_SCHEMA = SUMMARY_SCHEMA;
export const FORM_EXPLANATION_SCHEMA = SUMMARY_SCHEMA;
