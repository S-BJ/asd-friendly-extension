import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { DEFAULT_SITE_OVERRIDE, DEFAULT_SYNC_SETTINGS } from "../src/shared/settings.js";
import { detectSensitivePageKind } from "../src/shared/sensitive-page.js";

const contentScript = await readFile(new URL("../src/content/index.js", import.meta.url), "utf8");

test("content script default settings mirror shared settings", () => {
  assert.deepEqual(extractContentObject("DEFAULT_SETTINGS"), DEFAULT_SYNC_SETTINGS);
  assert.deepEqual(extractContentObject("DEFAULT_SITE_OVERRIDE"), DEFAULT_SITE_OVERRIDE);
});

test("content script sensitive-page behavior mirrors shared sensitive-page module", () => {
  const contentSensitive = createContentSensitiveDetector();
  const cases = [
    {
      url: "https://example.com/checkout",
      title: "Billing details",
      visibleText: "Card number and payment review"
    },
    {
      url: "https://github.com/settings/profile",
      title: "Your profile",
      visibleText: "Edit your bio, company, location and website links."
    },
    {
      url: "https://example.com/news/photo",
      title: "Photo story",
      visibleText: "A camera review with sample images"
    },
    {
      title: "Photo upload",
      visibleText: "Choose file to upload image"
    },
    {
      title: "Member access",
      visibleText: "\uC544\uC774\uB514 \uBE44\uBC00\uBC88\uD638 \uB85C\uADF8\uC778"
    }
  ];

  for (const context of cases) {
    assert.equal(contentSensitive.detect(context), detectSensitivePageKind(context));
  }
});

function extractContentObject(name) {
  const marker = `const ${name} = `;
  const start = contentScript.indexOf(marker);
  assert.notEqual(start, -1, `${name} declaration should exist in content script`);

  const openBrace = contentScript.indexOf("{", start + marker.length);
  const closeBrace = findMatchingBrace(contentScript, openBrace);
  return Function(`"use strict"; return (${contentScript.slice(openBrace, closeBrace + 1)});`)();
}

function createContentSensitiveDetector() {
  const start = contentScript.indexOf("const SENSITIVE_PAGE_KINDS");
  const end = contentScript.indexOf("const DEFAULT_SETTINGS", start);
  assert.notEqual(start, -1, "SENSITIVE_PAGE_KINDS should exist in content script");
  assert.notEqual(end, -1, "DEFAULT_SETTINGS should follow sensitive-page declarations");

  const context = {};
  vm.runInNewContext(
    `${contentScript.slice(start, end)}
    function __detectSensitivePageKind({ url = "", title = "", visibleText = "", hasInteractiveSensitiveControl = false } = {}) {
      const pageHaystack = \`\${url} \${title}\`.slice(0, 1000);
      const visibleHaystack = String(visibleText || "").slice(0, 4000);
      const canUseVisibleText = Boolean(hasInteractiveSensitiveControl);
      for (const [kind, pagePattern, visiblePattern] of SENSITIVE_PATTERNS) {
        if (pagePattern.test(pageHaystack)) return kind;
        if (canUseVisibleText && visiblePattern.test(visibleHaystack)) return kind;
      }
      return SENSITIVE_PAGE_KINDS.none;
    }
    globalThis.__contentSensitive = {
      detect: __detectSensitivePageKind
    };`,
    context
  );
  return context.__contentSensitive;
}

function findMatchingBrace(value, openBrace) {
  assert.notEqual(openBrace, -1, "Object literal should have an opening brace");
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = openBrace; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Object literal closing brace was not found.");
}
