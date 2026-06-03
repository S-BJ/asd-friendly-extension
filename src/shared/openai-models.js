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
export const DEFAULT_OPENAI_ENDPOINT = "https://api.openai.com/v1";

export function normalizeOpenAIModel(value) {
  const model = typeof value === "string" ? value.trim() : "";
  if (!model) return DEFAULT_OPENAI_MODEL;
  return model.length <= 160 ? model : DEFAULT_OPENAI_MODEL;
}

export function normalizeOpenAIEndpoint(value) {
  const endpoint = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  if (!endpoint) return DEFAULT_OPENAI_ENDPOINT;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_OPENAI_ENDPOINT;
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_OPENAI_ENDPOINT;
  }
}

export function normalizeOpenAIModelList(value) {
  const ids = Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : typeof item?.id === "string" ? item.id.trim() : ""))
        .filter((id) => id && id.length <= 160)
    : [];
  return [...new Set(ids)].slice(0, 200);
}
