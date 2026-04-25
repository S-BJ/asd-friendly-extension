import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeEnvBoolean,
  resolveAllowedExtensionOrigins,
  resolveAllowedOrigin
} from "./cors.mjs";
import {
  EXPLANATION_SCHEMA,
  FORM_EXPLANATION_SCHEMA,
  PAGE_SUMMARY_SCHEMA
} from "../src/shared/ai-schemas.js";
import {
  buildFormInstructions,
  buildPageInstructions,
  buildSelectionContentText,
  buildSelectionInstructions
} from "../src/shared/ai-instructions.js";
import {
  normalizeFormContext,
  normalizePageContext,
  normalizeSelectionContext,
  shapeFormPayload,
  shapePageSummaryPayload,
  shapeSelectionPayload
} from "../src/shared/ai-normalize.js";
import { DEFAULT_OPENAI_MODEL, OPENAI_MODELS, normalizeOpenAIModel } from "../src/shared/openai-models.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXED_EXTENSION_ID = "nibpcfbgiokcjajcglmappiehobcljjj";
const USER_CONFIG_DIR = process.env.ASD_FRIENDLY_CONFIG_DIR || join(homedir(), ".asd-friendly-extension");
const EXTERNAL_ENV_PATH = join(USER_CONFIG_DIR, "server.env.local");
const LOCAL_ENV_PATH = join(__dirname, ".env.local");
const REQUEST_TIMEOUT_MS = 30_000;

loadEnvFile(EXTERNAL_ENV_PATH);
loadEnvFile(LOCAL_ENV_PATH);

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const OPENAI_MODEL = normalizeOpenAIModel(process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ALLOW_ANY_EXTENSION_ORIGIN = normalizeEnvBoolean(
  process.env.ASD_FRIENDLY_ALLOW_ANY_EXTENSION_ORIGIN,
  true
);
const ALLOWED_EXTENSION_ORIGINS = resolveAllowedExtensionOrigins(process.env.ALLOWED_EXTENSION_ORIGINS, {
  allowAnyExtensionOriginByDefault: ALLOW_ANY_EXTENSION_ORIGIN,
  fixedExtensionId: FIXED_EXTENSION_ID
});

const server = createServer(async (req, res) => {
  const allowedOrigin = resolveAllowedOrigin(req.headers.origin, ALLOWED_EXTENSION_ORIGINS, PORT);
  if (allowedOrigin === false) {
    writeJson(res, 403, {
      ok: false,
      error: "Origin not allowed."
    });
    return;
  }

  setCorsHeaders(res, allowedOrigin);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    writeJson(res, 200, {
      ok: true,
      service: "asd-friendly-openai-backend",
      model: OPENAI_MODEL,
      supportedModels: OPENAI_MODELS.map((model) => model.id),
      apiKeyConfigured: Boolean(OPENAI_API_KEY),
      requestScopedApiKeySupported: true,
      extensionOriginPolicy: ALLOWED_EXTENSION_ORIGINS.allowAnyExtensionOrigin
        ? "any chrome-extension:// origin"
        : [...ALLOWED_EXTENSION_ORIGINS.origins]
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/explain-selection") {
    try {
      const apiKey = resolveApiKey(req);
      ensureApiKey(apiKey);

      const body = await readJsonBody(req);
      const model = resolveOpenAIModel(body);
      const context = normalizeSelectionContext({ ...body, pageLanguage: body.pageLanguage });

      if (!context.selectionText) {
        writeJson(res, 400, {
          ok: false,
          error: "No selected text was provided."
        });
        return;
      }

      const explanation = await explainSelection(context, apiKey, model);

      writeJson(res, 200, {
        ok: true,
        model,
        explanation
      });
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error."
      });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/summarize-page") {
    try {
      const apiKey = resolveApiKey(req);
      ensureApiKey(apiKey);

      const body = await readJsonBody(req);
      const model = resolveOpenAIModel(body);
      const context = normalizePageContext(body);
      const summary = await summarizePage(context, apiKey, model);

      writeJson(res, 200, {
        ok: true,
        model,
        summary
      });
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error."
      });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/explain-form") {
    try {
      const apiKey = resolveApiKey(req);
      ensureApiKey(apiKey);

      const body = await readJsonBody(req);
      const model = resolveOpenAIModel(body);
      const context = normalizeFormContext(body);

      if (context.fields.length === 0) {
        writeJson(res, 400, {
          ok: false,
          error: "No form fields were provided."
        });
        return;
      }

      const explanation = await explainForm(context, apiKey, model);

      writeJson(res, 200, {
        ok: true,
        model,
        explanation
      });
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error."
      });
    }
    return;
  }

  writeJson(res, 404, {
    ok: false,
    error: "Not found."
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ASD-Friendly OpenAI backend listening on http://127.0.0.1:${PORT}`);
});

async function explainSelection(context, apiKey, model = OPENAI_MODEL) {
  const parsed = await requestStructuredOutput({
    apiKey,
    model,
    name: "selection_explanation",
    schema: EXPLANATION_SCHEMA,
    maxOutputTokens: 500,
    instructions: buildSelectionInstructions(context),
    contentText: buildSelectionContentText(context)
  });
  return shapeSelectionPayload(parsed);
}

async function summarizePage(context, apiKey, model = OPENAI_MODEL) {
  const parsed = await requestStructuredOutput({
    apiKey,
    model,
    name: "page_summary",
    schema: PAGE_SUMMARY_SCHEMA,
    maxOutputTokens: 900,
    instructions: buildPageInstructions(context),
    contentText: JSON.stringify(context, null, 2)
  });
  return shapePageSummaryPayload(parsed);
}

async function explainForm(context, apiKey, model = OPENAI_MODEL) {
  const parsed = await requestStructuredOutput({
    apiKey,
    model,
    name: "form_explanation",
    schema: FORM_EXPLANATION_SCHEMA,
    maxOutputTokens: 1000,
    instructions: buildFormInstructions(context),
    contentText: JSON.stringify(context, null, 2)
  });
  return shapeFormPayload(parsed);
}

async function requestStructuredOutput({ apiKey, model = OPENAI_MODEL, name, schema, instructions, contentText, maxOutputTokens }) {
  const openAIModel = normalizeOpenAIModel(model);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
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
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The OpenAI request did not finish in time.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || data?.error || "OpenAI request failed.";
    throw new Error(message);
  }

  const refusal = collectRefusal(data.output);
  if (refusal) {
    throw new Error(refusal);
  }

  const outputText = collectOutputText(data.output);
  if (!outputText) {
    throw new Error("The model returned no text output.");
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error("The model response could not be parsed as JSON.");
  }
}

function resolveApiKey(req) {
  const headerValue = req.headers["x-openai-api-key"];
  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue)) {
    const first = headerValue.find((value) => typeof value === "string" && value.trim());
    if (first) return first.trim();
  }

  return OPENAI_API_KEY;
}

function resolveOpenAIModel(body) {
  return normalizeOpenAIModel(body?.openAIModel || OPENAI_MODEL);
}

function ensureApiKey(apiKey) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Enter it in the backend console, send it per request, or set it in server env.");
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!key || process.env[key]) continue;
    process.env[key] = value;
  }
}

function setCorsHeaders(res, origin) {
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-OpenAI-Api-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
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
