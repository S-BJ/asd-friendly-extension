import { normalizeLocalSettings } from "../shared/settings.js";
import {
  DEFAULT_OPENAI_ENDPOINT,
  DEFAULT_OPENAI_MODEL,
  normalizeOpenAIEndpoint,
  normalizeOpenAIModel
} from "../shared/openai-models.js";
import {
  EXPLANATION_SCHEMA,
  FORM_EXPLANATION_SCHEMA,
  PAGE_SUMMARY_SCHEMA
} from "../shared/ai-schemas.js";
import {
  buildFormInstructions,
  buildPageInstructions,
  buildSelectionContentText,
  buildSelectionInstructions
} from "../shared/ai-instructions.js";
import {
  normalizeFormContext,
  normalizePageContext,
  normalizeSelectionContext,
  shapeFormPayload,
  shapePageSummaryPayload,
  shapeSelectionPayload
} from "../shared/ai-normalize.js";

const REQUEST_TIMEOUT_MS = 30_000;

export const AI_CLIENT_ERROR_CODES = Object.freeze({
  missingApiKey: "missing_api_key",
  backendOffline: "backend_offline",
  invalidResponse: "invalid_response",
  requestFailed: "request_failed",
  requestTimedOut: "request_timed_out"
});

export async function requestSelectionExplanation(localSettings, context) {
  const settings = normalizeLocalSettings(localSettings);
  if (settings.openAIApiKey) {
    return requestSelectionDirect(settings, context);
  }
  throw createAiClientError(
    AI_CLIENT_ERROR_CODES.missingApiKey,
    "Enter an API endpoint and API key in the popup, then choose a model."
  );
}

export async function requestPageSummary(localSettings, context) {
  const settings = normalizeLocalSettings(localSettings);
  if (settings.openAIApiKey) {
    return requestPageDirect(settings, context);
  }
  throw createAiClientError(
    AI_CLIENT_ERROR_CODES.missingApiKey,
    "Enter an API endpoint and API key in the popup, then choose a model."
  );
}

export async function requestFormExplanation(localSettings, context) {
  const settings = normalizeLocalSettings(localSettings);
  if (settings.openAIApiKey) {
    return requestFormDirect(settings, context);
  }
  throw createAiClientError(
    AI_CLIENT_ERROR_CODES.missingApiKey,
    "Enter an API endpoint and API key in the popup, then choose a model."
  );
}

export async function fetchAvailableModels(localSettings) {
  const settings = normalizeLocalSettings(localSettings);
  if (!settings.openAIApiKey) {
    throw createAiClientError(AI_CLIENT_ERROR_CODES.missingApiKey, "Enter an API key first.");
  }

  const data = await requestModels(settings.openAIEndpoint, settings.openAIApiKey);
  return Array.isArray(data.data)
    ? data.data
        .map((model) => (typeof model?.id === "string" ? model.id.trim() : ""))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    : [];
}

async function requestSelectionDirect(settings, context) {
  const normalizedContext = normalizeSelectionContext(context);
  const openAIModel = normalizeOpenAIModel(settings.openAIModel);
  if (!normalizedContext.selectionText) {
    throw createAiClientError(AI_CLIENT_ERROR_CODES.requestFailed, "No selected text was provided.");
  }

  const parsed = await requestStructuredOutput({
    endpoint: settings.openAIEndpoint,
    apiKey: settings.openAIApiKey,
    name: "selection_explanation",
    schema: EXPLANATION_SCHEMA,
    model: openAIModel,
    maxOutputTokens: 700,
    instructions: buildSelectionInstructions(normalizedContext),
    contentText: buildSelectionContentText(normalizedContext)
  });

  return {
    model: openAIModel,
    payload: shapeSelectionPayload(parsed)
  };
}

async function requestPageDirect(settings, context) {
  const normalizedContext = normalizePageContext(context);
  const openAIModel = normalizeOpenAIModel(settings.openAIModel);
  const parsed = await requestStructuredOutput({
    endpoint: settings.openAIEndpoint,
    apiKey: settings.openAIApiKey,
    name: "page_summary",
    schema: PAGE_SUMMARY_SCHEMA,
    model: openAIModel,
    maxOutputTokens: 900,
    instructions: buildPageInstructions(normalizedContext),
    contentText: JSON.stringify(normalizedContext, null, 2)
  });

  return {
    model: openAIModel,
    payload: shapePageSummaryPayload(parsed)
  };
}

async function requestFormDirect(settings, context) {
  const normalizedContext = normalizeFormContext(context);
  const openAIModel = normalizeOpenAIModel(settings.openAIModel);
  if (normalizedContext.fields.length === 0) {
    throw createAiClientError(AI_CLIENT_ERROR_CODES.requestFailed, "No form fields were provided.");
  }

  const parsed = await requestStructuredOutput({
    endpoint: settings.openAIEndpoint,
    apiKey: settings.openAIApiKey,
    name: "form_explanation",
    schema: FORM_EXPLANATION_SCHEMA,
    model: openAIModel,
    maxOutputTokens: 1000,
    instructions: buildFormInstructions(normalizedContext),
    contentText: JSON.stringify(normalizedContext, null, 2)
  });

  return {
    model: openAIModel,
    payload: shapeFormPayload(parsed)
  };
}

async function requestStructuredOutput({ endpoint = DEFAULT_OPENAI_ENDPOINT, apiKey, model = DEFAULT_OPENAI_MODEL, name, schema, maxOutputTokens, instructions, contentText }) {
  const openAIEndpoint = normalizeOpenAIEndpoint(endpoint);
  const openAIModel = normalizeOpenAIModel(model);
  let response;
  try {
    response = await fetchWithTimeout(`${openAIEndpoint}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openAIModel,
        max_output_tokens: maxOutputTokens,
        instructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: contentText
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name,
            strict: true,
            schema
          }
        }
      })
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createAiClientError(
        AI_CLIENT_ERROR_CODES.requestTimedOut,
        "The OpenAI request did not finish in time."
      );
    }
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.requestFailed,
      "The OpenAI request could not reach the API."
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.invalidResponse,
      "The AI service returned an invalid response."
    );
  }

  if (!response.ok) {
    const message = normalizeResponseMessage(
      typeof data?.error?.message === "string" ? data.error.message : String(data?.error || ""),
      280
    ) || "OpenAI request failed.";
    throw createAiClientError(AI_CLIENT_ERROR_CODES.requestFailed, message);
  }

  const refusal = collectRefusal(data.output);
  if (refusal) {
    throw createAiClientError(AI_CLIENT_ERROR_CODES.requestFailed, refusal);
  }

  const outputText = typeof data.output_text === "string" && data.output_text
    ? data.output_text
    : collectOutputText(data.output);

  if (!outputText) {
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.invalidResponse,
      "The model returned no text output."
    );
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.invalidResponse,
      "The model response could not be parsed as JSON."
    );
  }
}

async function requestModels(endpoint, apiKey) {
  const openAIEndpoint = normalizeOpenAIEndpoint(endpoint);
  let response;
  try {
    response = await fetchWithTimeout(`${openAIEndpoint}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createAiClientError(
        AI_CLIENT_ERROR_CODES.requestTimedOut,
        "The model list request did not finish in time."
      );
    }
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.backendOffline,
      "The AI endpoint is not reachable."
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.invalidResponse,
      "The AI service returned an invalid response."
    );
  }

  if (!response.ok) {
    const message = normalizeResponseMessage(
      typeof data?.error?.message === "string" ? data.error.message : String(data?.error || ""),
      280
    ) || "The model list request failed.";
    throw createAiClientError(
      AI_CLIENT_ERROR_CODES.requestFailed,
      message
    );
  }

  return data;
}

async function fetchWithTimeout(url, init, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function collectOutputText(outputItems) {
  if (!Array.isArray(outputItems)) return "";

  return outputItems
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

function collectRefusal(outputItems) {
  if (!Array.isArray(outputItems)) return "";

  for (const item of outputItems) {
    if (!Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part.type === "refusal" && typeof part.refusal === "string") {
        return part.refusal;
      }
    }
  }

  return "";
}

function normalizeResponseMessage(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function createAiClientError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
