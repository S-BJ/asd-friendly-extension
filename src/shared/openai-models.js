export const OPENAI_MODELS = Object.freeze([
  Object.freeze({
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    description: "Balanced quality, speed, and cost"
  }),
  Object.freeze({
    id: "gpt-5.5",
    label: "GPT-5.5",
    description: "Highest quality"
  }),
  Object.freeze({
    id: "gpt-5.4",
    label: "GPT-5.4",
    description: "High quality, lower cost than GPT-5.5"
  }),
  Object.freeze({
    id: "gpt-5.4-nano",
    label: "GPT-5.4 nano",
    description: "Lowest cost and fastest"
  })
]);

export const DEFAULT_OPENAI_MODEL = OPENAI_MODELS[0].id;

const OPENAI_MODEL_IDS = new Set(OPENAI_MODELS.map((model) => model.id));

export function normalizeOpenAIModel(value) {
  return OPENAI_MODEL_IDS.has(value) ? value : DEFAULT_OPENAI_MODEL;
}
